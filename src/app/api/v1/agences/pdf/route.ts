import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { authenticateApiRequest, corsPreflightResponse, API_CORS_HEADERS } from "@/lib/api-auth";
import {
  AgencyEstimationPdf,
  type AgencyPdfBranding,
  type AgencyPdfPayload,
} from "@/components/agences/AgencyEstimationPdf";

export const runtime = "nodejs";

export async function OPTIONS() {
  return corsPreflightResponse();
}

interface RequestBody {
  org_id?: string;
  estimation: AgencyPdfPayload["estimation"];
  fees?: AgencyPdfPayload["fees"];
  aides?: AgencyPdfPayload["aides"];
  prospect?: AgencyPdfPayload["prospect"];
  branding_override?: Partial<AgencyPdfBranding>;
}

async function fetchOrgBranding(orgId: string): Promise<AgencyPdfBranding | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const cookieStore = await cookies();
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: () => {},
    },
  });

  const { data, error } = await supabase
    .from("organizations")
    .select("name, logo_url, brand_color, contact_email, contact_phone, vat_number, legal_mention")
    .eq("id", orgId)
    .single();
  if (error || !data) return null;
  return data as AgencyPdfBranding;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400, headers: API_CORS_HEADERS });
  }

  if (!body.estimation || typeof body.estimation.valeur_centrale !== "number") {
    return NextResponse.json(
      { success: false, error: "Missing or invalid estimation payload" },
      { status: 400, headers: API_CORS_HEADERS },
    );
  }

  // Two auth modes:
  // 1) API key header (B2B integration: branding_override required, no Supabase fetch)
  // 2) Logged-in user with org_id (in-app use: branding fetched from org_id)
  const hasApiKey = request.headers.get("x-api-key") || request.headers.get("authorization");
  let branding: AgencyPdfBranding;

  if (hasApiKey) {
    const auth = authenticateApiRequest(request);
    if (!auth.ok) return auth.response;
    if (!body.branding_override?.name) {
      return NextResponse.json(
        { success: false, error: "branding_override with at least 'name' is required for API-key calls" },
        { status: 400, headers: API_CORS_HEADERS },
      );
    }
    branding = {
      name: body.branding_override.name,
      logo_url: body.branding_override.logo_url ?? null,
      brand_color: body.branding_override.brand_color ?? "#0B2447",
      contact_email: body.branding_override.contact_email ?? null,
      contact_phone: body.branding_override.contact_phone ?? null,
      vat_number: body.branding_override.vat_number ?? null,
      legal_mention: body.branding_override.legal_mention ?? null,
    };
  } else {
    if (!body.org_id) {
      return NextResponse.json(
        { success: false, error: "Either X-API-Key header or org_id (with logged-in session) is required" },
        { status: 401, headers: API_CORS_HEADERS },
      );
    }
    const fetched = await fetchOrgBranding(body.org_id);
    if (!fetched) {
      return NextResponse.json(
        { success: false, error: "Organization not found or access denied" },
        { status: 404, headers: API_CORS_HEADERS },
      );
    }
    branding = fetched;
  }

  const payload: AgencyPdfPayload = {
    branding,
    estimation: body.estimation,
    fees: body.fees,
    aides: body.aides,
    prospect: body.prospect,
    generated_at: new Date().toISOString(),
  };

  try {
    const buffer = await renderToBuffer(AgencyEstimationPdf({ payload }));
    const uint8 = new Uint8Array(buffer);
    return new NextResponse(uint8, {
      status: 200,
      headers: {
        ...API_CORS_HEADERS,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="estimation-${payload.estimation.commune}-${Date.now()}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "PDF rendering error";
    return NextResponse.json(
      { success: false, error: `PDF rendering error: ${message}` },
      { status: 500, headers: API_CORS_HEADERS },
    );
  }
}
