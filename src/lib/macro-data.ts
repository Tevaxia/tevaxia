// ============================================================
// DONNÉES MACRO-ÉCONOMIQUES — Luxembourg
// ============================================================
// Sources : BCL, STATEC, Eurostat, Observatoire de l'Habitat
// Séries historiques 2015-2026 pour rapports EVS et graphiques

export interface MacroDataPoint {
  year: number;
  value: number;
}

// ──────────────────────────────────────────────
// OAT 10 ans — Taux des obligations d'État Luxembourg / Zone Euro
// Source : BCL, Eurostat (rendement moyen annuel)
// ──────────────────────────────────────────────
export const OAT_10Y: MacroDataPoint[] = [
  { year: 2015, value: 0.47 },
  { year: 2016, value: 0.09 },
  { year: 2017, value: 0.32 },
  { year: 2018, value: 0.44 },
  { year: 2019, value: -0.07 },
  { year: 2020, value: -0.31 },
  { year: 2021, value: -0.19 },
  { year: 2022, value: 1.46 },
  { year: 2023, value: 2.84 },
  { year: 2024, value: 2.61 },
  { year: 2025, value: 2.75 },
  { year: 2026, value: 2.65 }, // estimation
];

// ──────────────────────────────────────────────
// Taux hypothécaires moyens Luxembourg (fixe 20 ans)
// Source : BCL, enquête taux d'intérêt bancaires
// ──────────────────────────────────────────────
export const TAUX_HYPOTHECAIRE: MacroDataPoint[] = [
  { year: 2015, value: 2.20 },
  { year: 2016, value: 1.90 },
  { year: 2017, value: 1.80 },
  { year: 2018, value: 1.75 },
  { year: 2019, value: 1.55 },
  { year: 2020, value: 1.45 },
  { year: 2021, value: 1.50 },
  { year: 2022, value: 2.80 },
  { year: 2023, value: 3.95 },
  { year: 2024, value: 3.60 },
  { year: 2025, value: 3.30 },
  { year: 2026, value: 3.15 }, // estimation
];

// ──────────────────────────────────────────────
// Indice du coût de la construction (STATEC, base 100 = 2015)
// Source : STATEC — Indice semestriel du coût de la construction
// ──────────────────────────────────────────────
export const INDICE_CONSTRUCTION: MacroDataPoint[] = [
  { year: 2015, value: 100.0 },
  { year: 2016, value: 101.8 },
  { year: 2017, value: 104.2 },
  { year: 2018, value: 107.5 },
  { year: 2019, value: 110.8 },
  { year: 2020, value: 113.2 },
  { year: 2021, value: 120.5 },
  { year: 2022, value: 132.8 },
  { year: 2023, value: 139.5 },
  { year: 2024, value: 142.0 },
  { year: 2025, value: 144.8 },
  { year: 2026, value: 147.0 }, // estimation
];

// ──────────────────────────────────────────────
// Taux de chômage Luxembourg (%)
// Source : STATEC, ADEM — Taux de chômage national (définition BIT)
// ──────────────────────────────────────────────
export const TAUX_CHOMAGE: MacroDataPoint[] = [
  { year: 2015, value: 6.5 },
  { year: 2016, value: 6.3 },
  { year: 2017, value: 5.5 },
  { year: 2018, value: 5.4 },
  { year: 2019, value: 5.4 },
  { year: 2020, value: 6.4 },
  { year: 2021, value: 5.7 },
  { year: 2022, value: 4.8 },
  { year: 2023, value: 5.2 },
  { year: 2024, value: 5.5 },
  { year: 2025, value: 5.3 },
  { year: 2026, value: 5.2 }, // estimation
];

// ──────────────────────────────────────────────
// Inflation Luxembourg — IPCN (%)
// Source : STATEC — Indice des prix à la consommation national
// ──────────────────────────────────────────────
export const INFLATION: MacroDataPoint[] = [
  { year: 2015, value: 0.5 },
  { year: 2016, value: 0.3 },
  { year: 2017, value: 1.7 },
  { year: 2018, value: 1.5 },
  { year: 2019, value: 1.7 },
  { year: 2020, value: 0.8 },
  { year: 2021, value: 2.5 },
  { year: 2022, value: 6.3 },
  { year: 2023, value: 3.0 },
  { year: 2024, value: 2.2 },
  { year: 2025, value: 2.0 },
  { year: 2026, value: 1.9 }, // estimation
];

// ──────────────────────────────────────────────
// Volume de transactions immobilières (nombre/an)
// Source : Observatoire de l'Habitat, Publicité Foncière
// Inclut appartements + maisons (actes notariés enregistrés)
// ──────────────────────────────────────────────
export const TRANSACTIONS_VOLUME: MacroDataPoint[] = [
  { year: 2015, value: 10_200 },
  { year: 2016, value: 10_800 },
  { year: 2017, value: 11_300 },
  { year: 2018, value: 11_600 },
  { year: 2019, value: 11_900 },
  { year: 2020, value: 10_500 },
  { year: 2021, value: 12_800 },
  { year: 2022, value: 10_400 },
  { year: 2023, value: 7_800 },
  { year: 2024, value: 8_600 },
  { year: 2025, value: 9_400 },
  { year: 2026, value: 9_800 }, // estimation
];

// ──────────────────────────────────────────────
// Prix moyen m² appartements Luxembourg (national, existant)
// Source : Observatoire de l'Habitat — prix enregistrés (actes notariés)
// ──────────────────────────────────────────────
export const PRIX_MOYEN_M2: MacroDataPoint[] = [
  { year: 2015, value: 4_350 },
  { year: 2016, value: 4_600 },
  { year: 2017, value: 4_900 },
  { year: 2018, value: 5_250 },
  { year: 2019, value: 5_500 },
  { year: 2020, value: 6_000 },
  { year: 2021, value: 7_200 },
  { year: 2022, value: 8_050 },
  { year: 2023, value: 7_600 },
  { year: 2024, value: 7_350 },
  { year: 2025, value: 7_500 },
  { year: 2026, value: 7_600 }, // estimation
];

// ──────────────────────────────────────────────
// Taux de vacance bureaux Luxembourg-Ville (%)
// Source : JLL, CBRE, Cushman & Wakefield — rapports trimestriels
// ──────────────────────────────────────────────
export const TAUX_VACANCE_BUREAUX: MacroDataPoint[] = [
  { year: 2015, value: 5.2 },
  { year: 2016, value: 4.8 },
  { year: 2017, value: 4.2 },
  { year: 2018, value: 3.5 },
  { year: 2019, value: 3.2 },
  { year: 2020, value: 3.8 },
  { year: 2021, value: 4.5 },
  { year: 2022, value: 4.8 },
  { year: 2023, value: 5.5 },
  { year: 2024, value: 5.8 },
  { year: 2025, value: 5.6 },
  { year: 2026, value: 5.3 }, // estimation
];

// ──────────────────────────────────────────────
// PIB Luxembourg (milliards €, prix courants)
// Source : STATEC — Comptes nationaux
// ──────────────────────────────────────────────
export const PIB: MacroDataPoint[] = [
  { year: 2015, value: 52.1 },
  { year: 2016, value: 54.2 },
  { year: 2017, value: 56.8 },
  { year: 2018, value: 60.1 },
  { year: 2019, value: 63.5 },
  { year: 2020, value: 64.6 },
  { year: 2021, value: 72.3 },
  { year: 2022, value: 77.8 },
  { year: 2023, value: 79.2 },
  { year: 2024, value: 81.5 },
  { year: 2025, value: 84.0 },
  { year: 2026, value: 86.5 }, // estimation
];

// ──────────────────────────────────────────────
// Population Luxembourg (milliers)
// Source : STATEC — état de la population
// ──────────────────────────────────────────────
export const POPULATION: MacroDataPoint[] = [
  { year: 2015, value: 569 },
  { year: 2016, value: 582 },
  { year: 2017, value: 596 },
  { year: 2018, value: 608 },
  { year: 2019, value: 619 },
  { year: 2020, value: 630 },
  { year: 2021, value: 640 },
  { year: 2022, value: 653 },
  { year: 2023, value: 666 },
  { year: 2024, value: 672 },
  { year: 2025, value: 680 },
  { year: 2026, value: 688 }, // estimation
];

// ──────────────────────────────────────────────
// Taux directeur BCE — Taux de refinancement principal (%)
// Source : BCE
// ──────────────────────────────────────────────
export const TAUX_DIRECTEUR_BCE: MacroDataPoint[] = [
  { year: 2015, value: 0.05 },
  { year: 2016, value: 0.00 },
  { year: 2017, value: 0.00 },
  { year: 2018, value: 0.00 },
  { year: 2019, value: 0.00 },
  { year: 2020, value: 0.00 },
  { year: 2021, value: 0.00 },
  { year: 2022, value: 2.50 },
  { year: 2023, value: 4.50 },
  { year: 2024, value: 3.40 },
  { year: 2025, value: 2.65 },
  { year: 2026, value: 2.25 }, // estimation
];

// ──────────────────────────────────────────────
// Loyer moyen m²/mois appartements Luxembourg (national, €)
// Source : Observatoire de l'Habitat — annonces
// ──────────────────────────────────────────────
export const LOYER_MOYEN_M2: MacroDataPoint[] = [
  { year: 2015, value: 17.5 },
  { year: 2016, value: 18.2 },
  { year: 2017, value: 19.0 },
  { year: 2018, value: 20.5 },
  { year: 2019, value: 21.8 },
  { year: 2020, value: 22.5 },
  { year: 2021, value: 23.8 },
  { year: 2022, value: 25.5 },
  { year: 2023, value: 26.8 },
  { year: 2024, value: 27.5 },
  { year: 2025, value: 28.0 },
  { year: 2026, value: 28.5 }, // estimation
];

// ============================================================
// Fonctions utilitaires
// ============================================================

/**
 * Retourne la dernière valeur d'une série temporelle.
 */
export function getLatestValue(data: MacroDataPoint[]): number {
  if (data.length === 0) return 0;
  return data[data.length - 1].value;
}

/**
 * Retourne l'évolution sur N années : valeur actuelle, variation absolue et %.
 * @param data Série de données
 * @param years Nombre d'années de recul (ex: 5 = comparer à il y a 5 ans)
 */
export function getEvolution(
  data: MacroDataPoint[],
  years: number,
): { value: number; change: number; changePct: number } {
  if (data.length === 0) return { value: 0, change: 0, changePct: 0 };
  const latest = data[data.length - 1];
  const targetYear = latest.year - years;
  const earlier = data.find((d) => d.year === targetYear);
  if (!earlier) return { value: latest.value, change: 0, changePct: 0 };
  const change = latest.value - earlier.value;
  const changePct = earlier.value !== 0 ? (change / Math.abs(earlier.value)) * 100 : 0;
  return { value: latest.value, change, changePct };
}

/**
 * Retourne la valeur pour une année donnée, ou null si introuvable.
 */
export function getValueForYear(data: MacroDataPoint[], year: number): number | null {
  const point = data.find((d) => d.year === year);
  return point ? point.value : null;
}

/**
 * Retourne le min et max d'une série.
 */
export function getMinMax(data: MacroDataPoint[]): { min: MacroDataPoint; max: MacroDataPoint } {
  let min = data[0];
  let max = data[0];
  for (const d of data) {
    if (d.value < min.value) min = d;
    if (d.value > max.value) max = d;
  }
  return { min, max };
}

/**
 * Calcule le taux de croissance annuel composé (TCAC / CAGR) entre la première
 * et la dernière année de la série.
 */
export function getCagr(data: MacroDataPoint[]): number {
  if (data.length < 2) return 0;
  const first = data[0];
  const last = data[data.length - 1];
  const years = last.year - first.year;
  if (years <= 0 || first.value <= 0) return 0;
  return (Math.pow(last.value / first.value, 1 / years) - 1) * 100;
}

/**
 * Calcule le rendement brut locatif national moyen pour une année donnée.
 * Rendement = (loyer m²/mois × 12) / prix m² × 100
 */
export function getRendementBrutNational(year: number): number | null {
  const prix = getValueForYear(PRIX_MOYEN_M2, year);
  const loyer = getValueForYear(LOYER_MOYEN_M2, year);
  if (!prix || !loyer) return null;
  return (loyer * 12) / prix * 100;
}

/**
 * Retourne un résumé macro pour une année donnée (utile pour les rapports EVS).
 */
export function getMacroSummary(year: number) {
  return {
    oat10y: getValueForYear(OAT_10Y, year),
    tauxHypothecaire: getValueForYear(TAUX_HYPOTHECAIRE, year),
    indiceConstruction: getValueForYear(INDICE_CONSTRUCTION, year),
    tauxChomage: getValueForYear(TAUX_CHOMAGE, year),
    inflation: getValueForYear(INFLATION, year),
    transactionsVolume: getValueForYear(TRANSACTIONS_VOLUME, year),
    prixMoyenM2: getValueForYear(PRIX_MOYEN_M2, year),
    tauxVacanceBureaux: getValueForYear(TAUX_VACANCE_BUREAUX, year),
    pib: getValueForYear(PIB, year),
    population: getValueForYear(POPULATION, year),
    tauxDirecteurBce: getValueForYear(TAUX_DIRECTEUR_BCE, year),
    loyerMoyenM2: getValueForYear(LOYER_MOYEN_M2, year),
  };
}

/**
 * Liste exhaustive des séries disponibles avec métadonnées.
 */
export const MACRO_SERIES = [
  { key: "OAT_10Y", label: "OAT 10 ans", unit: "%", data: OAT_10Y },
  { key: "TAUX_HYPOTHECAIRE", label: "Taux hypothécaire (fixe 20 ans)", unit: "%", data: TAUX_HYPOTHECAIRE },
  { key: "INDICE_CONSTRUCTION", label: "Indice coût construction", unit: "base 100", data: INDICE_CONSTRUCTION },
  { key: "TAUX_CHOMAGE", label: "Taux de chômage", unit: "%", data: TAUX_CHOMAGE },
  { key: "INFLATION", label: "Inflation (IPCN)", unit: "%", data: INFLATION },
  { key: "TRANSACTIONS_VOLUME", label: "Transactions immobilières", unit: "nb/an", data: TRANSACTIONS_VOLUME },
  { key: "PRIX_MOYEN_M2", label: "Prix moyen m² appartement", unit: "€/m²", data: PRIX_MOYEN_M2 },
  { key: "TAUX_VACANCE_BUREAUX", label: "Vacance bureaux Luxembourg-Ville", unit: "%", data: TAUX_VACANCE_BUREAUX },
  { key: "PIB", label: "PIB Luxembourg", unit: "Mrd €", data: PIB },
  { key: "POPULATION", label: "Population", unit: "milliers", data: POPULATION },
  { key: "TAUX_DIRECTEUR_BCE", label: "Taux directeur BCE", unit: "%", data: TAUX_DIRECTEUR_BCE },
  { key: "LOYER_MOYEN_M2", label: "Loyer moyen m²/mois", unit: "€/m²/mois", data: LOYER_MOYEN_M2 },
] as const;
