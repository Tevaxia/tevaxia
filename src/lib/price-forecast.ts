/**
 * Prévisions prix immobilier LU — 12-24 mois.
 *
 * 3 scénarios paramétrés (pessimiste / central / optimiste) basés
 * sur les tendances historiques STATEC + Observatoire Habitat.
 * Ne remplace pas un modèle ARIMA certifié ; sert à encadrer un
 * ordre de grandeur pour un acheteur / vendeur.
 */

import { getCagr, PRIX_MOYEN_M2, type MacroDataPoint } from "./macro-data";

export interface PriceScenario {
  name: "pessimiste" | "central" | "optimiste";
  nameKey: string;
  annualGrowthPct: number;
  color: string;
}

export const DEFAULT_SCENARIOS: PriceScenario[] = [
  { name: "pessimiste", nameKey: "scnPessimiste", annualGrowthPct: -3, color: "#dc2626" },
  { name: "central", nameKey: "scnCentral", annualGrowthPct: 2, color: "#1e3a5f" },
  { name: "optimiste", nameKey: "scnOptimiste", annualGrowthPct: 5, color: "#059669" },
];

export interface PriceForecastPoint {
  year: number;
  month: number;
  label: string;
  historical?: number;
  pessimiste?: number;
  central?: number;
  optimiste?: number;
  isProjection: boolean;
}

export interface PriceForecastResult {
  series: PriceForecastPoint[];
  cagrHistorical: number;
  basePrice: number;
  endPessimiste: number;
  endCentral: number;
  endOptimiste: number;
}

/**
 * Génère une série mensuelle avec historique + 3 projections.
 * @param basePrice Prix m² actuel (ex. prix commune sélectionnée)
 * @param horizonMonths Horizon de projection (défaut 24 mois)
 * @param scenarios 3 scénarios de croissance annuelle
 * @param historicalSeries Série annuelle nationale (macro-data PRIX_MOYEN_M2)
 */
export function buildPriceForecast(
  basePrice: number,
  horizonMonths = 24,
  scenarios: PriceScenario[] = DEFAULT_SCENARIOS,
  historicalSeries: MacroDataPoint[] = PRIX_MOYEN_M2,
): PriceForecastResult {
  const now = new Date();
  const startYear = now.getUTCFullYear();
  const startMonth = now.getUTCMonth() + 1;

  // 1) Historique : on interpole entre les points annuels pour avoir 12 points par an
  // On prend les 5 dernières années d'historique pour la lisibilité
  const recentHistory = historicalSeries.filter((p) => p.year >= startYear - 5 && p.year <= startYear);
  // Ratio du prix commune / prix national courant (pour ajuster l'historique à la commune)
  const currentNational = historicalSeries.find((p) => p.year === startYear)?.value
    ?? historicalSeries[historicalSeries.length - 1].value;
  const ratio = currentNational > 0 ? basePrice / currentNational : 1;

  const series: PriceForecastPoint[] = [];
  for (let i = 0; i < recentHistory.length - 1; i++) {
    const pCur = recentHistory[i];
    const pNext = recentHistory[i + 1];
    for (let m = 0; m < 12; m++) {
      const frac = m / 12;
      const val = (pCur.value + (pNext.value - pCur.value) * frac) * ratio;
      series.push({
        year: pCur.year,
        month: m + 1,
        label: `${String(m + 1).padStart(2, "0")}/${String(pCur.year).slice(-2)}`,
        historical: Math.round(val),
        isProjection: false,
      });
    }
  }
  // Point actuel (premier mois projection = current)
  series.push({
    year: startYear,
    month: startMonth,
    label: `${String(startMonth).padStart(2, "0")}/${String(startYear).slice(-2)}`,
    historical: Math.round(basePrice),
    pessimiste: Math.round(basePrice),
    central: Math.round(basePrice),
    optimiste: Math.round(basePrice),
    isProjection: false,
  });

  // 2) Projections mensuelles pour chaque scénario
  for (let h = 1; h <= horizonMonths; h++) {
    const mIdx = startMonth - 1 + h;
    const yOffset = Math.floor(mIdx / 12);
    const year = startYear + yOffset;
    const month = (mIdx % 12) + 1;
    const label = `${String(month).padStart(2, "0")}/${String(year).slice(-2)}`;
    const pt: PriceForecastPoint = {
      year, month, label,
      isProjection: true,
    };
    for (const s of scenarios) {
      const monthlyRate = Math.pow(1 + s.annualGrowthPct / 100, 1 / 12) - 1;
      const val = basePrice * Math.pow(1 + monthlyRate, h);
      if (s.name === "pessimiste") pt.pessimiste = Math.round(val);
      if (s.name === "central") pt.central = Math.round(val);
      if (s.name === "optimiste") pt.optimiste = Math.round(val);
    }
    series.push(pt);
  }

  const cagrHistorical = getCagr(recentHistory);
  const last = series[series.length - 1];

  return {
    series,
    cagrHistorical,
    basePrice,
    endPessimiste: last.pessimiste ?? basePrice,
    endCentral: last.central ?? basePrice,
    endOptimiste: last.optimiste ?? basePrice,
  };
}
