import type { MarketDataCommune } from "@/lib/market-data";

export type MarketScoreLevel = "tres_actif" | "actif" | "modere" | "calme";
export type MarketScoreComponentKey = "liquidite" | "tendance_prix" | "rendement" | "densite_donnees";

export interface MarketScoreResult {
  score: number; // 0-100
  level: MarketScoreLevel;
  components: { key: MarketScoreComponentKey; score: number }[];
}

export function computeMarketScore(commune: MarketDataCommune): MarketScoreResult {
  const components: { key: MarketScoreComponentKey; score: number }[] = [];

  const tx = commune.nbTransactions ?? 0;
  const liquidityScore = tx > 100 ? 25 : tx > 50 ? 20 : tx > 20 ? 15 : 10;
  components.push({ key: "liquidite", score: liquidityScore });

  let trendScore = 15;
  if (commune.prixM2Existant && commune.prixM2Annonces) {
    const ecart = (commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant;
    if (ecart > 0.02) trendScore = 25;
    else if (ecart < -0.02) trendScore = 10;
  }
  components.push({ key: "tendance_prix", score: trendScore });

  let yieldScore = 15;
  if (commune.loyerM2Annonces && commune.prixM2Existant) {
    const rendement = (commune.loyerM2Annonces * 12) / commune.prixM2Existant * 100;
    if (rendement > 4) yieldScore = 25;
    else if (rendement > 3) yieldScore = 20;
    else yieldScore = 15;
  }
  components.push({ key: "rendement", score: yieldScore });

  const densityScore = commune.quartiers && commune.quartiers.length > 0 ? 25 : 15;
  components.push({ key: "densite_donnees", score: densityScore });

  const score = components.reduce((sum, c) => sum + c.score, 0);

  let level: MarketScoreLevel;
  if (score >= 80) level = "tres_actif";
  else if (score >= 65) level = "actif";
  else if (score >= 50) level = "modere";
  else level = "calme";

  return { score, level, components };
}

export function getScoreColor(level: MarketScoreLevel): string {
  switch (level) {
    case "tres_actif":
      return "bg-green-100 text-green-800";
    case "actif":
      return "bg-blue-100 text-blue-800";
    case "modere":
      return "bg-amber-100 text-amber-800";
    case "calme":
      return "bg-gray-100 text-gray-600";
  }
}

export function getScoreBarColor(level: MarketScoreLevel): string {
  switch (level) {
    case "tres_actif":
      return "bg-green-500";
    case "actif":
      return "bg-blue-500";
    case "modere":
      return "bg-amber-500";
    case "calme":
      return "bg-gray-400";
  }
}
