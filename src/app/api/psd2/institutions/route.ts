import { NextResponse } from "next/server";
import { isConfigured, listInstitutions } from "@/lib/gocardless-bad";

export const runtime = "nodejs";

/**
 * GET /api/psd2/institutions?country=LU
 * Liste les banques supportées par GoCardless BAD pour le pays donné.
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "GoCardless BAD not configured", configured: false }, { status: 501 });
  }
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") ?? "LU").toUpperCase();
  try {
    const institutions = await listInstitutions(country);
    return NextResponse.json({
      configured: true,
      institutions: institutions.map((i) => ({ id: i.id, name: i.name, bic: i.bic, logo: i.logo })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
