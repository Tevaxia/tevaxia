import { NextResponse } from "next/server";
import { isConfigured, listAspsps } from "@/lib/enable-banking";

export const runtime = "nodejs";

/**
 * GET /api/psd2/institutions?country=LU
 * Liste les banques (ASPSPs) supportées par Enable Banking pour le pays.
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Enable Banking not configured", configured: false }, { status: 501 });
  }
  const url = new URL(req.url);
  const country = (url.searchParams.get("country") ?? "LU").toUpperCase();
  try {
    const aspsps = await listAspsps(country);
    return NextResponse.json({
      configured: true,
      institutions: aspsps.map((a) => ({
        id: a.name, // Enable Banking identifie par name+country
        name: a.name,
        country: a.country,
        logo: a.logo ?? "",
        bic: "",
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
