import { NextResponse } from "next/server";
import { rechercherCommune, getAllCommunes, getMarketDataCommune, suggestComparables } from "@/lib/market-data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const commune = searchParams.get("commune");
  const search = searchParams.get("q");
  const suggest = searchParams.get("suggest");

  if (search) {
    const results = rechercherCommune(search);
    return NextResponse.json({ success: true, data: results.map((r) => ({ commune: r.commune, matchedOn: r.matchedOn, isLocalite: r.isLocalite, quartier: r.quartier })) });
  }

  if (commune) {
    const data = getMarketDataCommune(commune);
    if (!data) return NextResponse.json({ success: false, error: "Commune non trouvée" }, { status: 404 });
    return NextResponse.json({ success: true, data });
  }

  if (suggest) {
    const suggestions = suggestComparables(suggest);
    return NextResponse.json({ success: true, data: suggestions });
  }

  // Liste de toutes les communes
  return NextResponse.json({ success: true, data: getAllCommunes() });
}
