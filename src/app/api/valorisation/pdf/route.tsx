import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { ReportDocument, type ReportData } from "@/components/ValuationReport";
import { renderToBuffer } from "@react-pdf/renderer";
import { createHash } from "node:crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/valorisation/pdf
 *
 * Génère le rapport EVS 2025 côté serveur à partir des données JSON, signe
 * le PDF (SHA-256) et retourne le binaire avec le hash dans le header
 * X-Pdf-Sha256 pour vérification publique sur /verify.
 *
 * Avantages vs client-side :
 * - Bundle @react-pdf/renderer (~200 KB gzipped) devient lazy / non-blocking
 * - Génération en ~1 s CPU serveur au lieu de 2-5 s CPU mobile
 * - Hash calculé côté serveur (plus solide juridiquement)
 * - Réutilisable depuis l'API publique /api/v1/mlv ou un cron d'envoi email
 */
export async function POST(req: Request) {
  // Auth : Bearer JWT Supabase
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 501 });
  }

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  // Payload
  let data: ReportData;
  try {
    data = (await req.json()) as ReportData;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!data || typeof data !== "object" || !data.dateRapport) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  try {
    // eslint-disable-next-line react-hooks/error-boundaries -- reviewed, intentional
    const buffer = await renderToBuffer(<ReportDocument data={data} />);
    const hash = createHash("sha256").update(buffer).digest("hex");
    const filename = `tevaxia-rapport-${data.dateRapport}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
        "X-Pdf-Sha256": hash,
        "Content-Length": String(buffer.length),
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "render_failed", message }, { status: 500 });
  }
}
