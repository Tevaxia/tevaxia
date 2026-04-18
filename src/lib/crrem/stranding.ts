/**
 * CRREM Stranding Analysis — calcule l'année où un bien devient "stranded"
 * (dépasse la trajectoire CRREM 1.5°C) et fournit le gap de décarbonation
 * à combler.
 */

import {
  getPathway,
  LU_EMISSION_FACTORS,
  type CrremAssetType,
  type LuEnergySource,
  type PathwayPoint,
} from "./pathways";

export type EnergyMix = Partial<Record<LuEnergySource, number>>;

export interface AssetInput {
  name: string;
  assetType: CrremAssetType;
  floorAreaM2: number;
  /** Consommation annuelle par source d'énergie (kWh). Somme = consommation totale. */
  energyMix: Partial<Record<LuEnergySource, number>>;
  /** Année courante — défaut new Date().getFullYear() */
  currentYear?: number;
}

export interface StrandingResult {
  currentYear: number;
  /** Intensité énergétique actuelle (kWh/m²/an) */
  currentEnergyKwhM2: number;
  /** Intensité carbone actuelle (kgCO2e/m²/an) — facteurs LU */
  currentCarbonKgM2: number;
  /** Année où le bien dépasse la trajectoire énergétique */
  strandingYearEnergy: number | null;
  /** Année où le bien dépasse la trajectoire carbone */
  strandingYearCarbon: number | null;
  /** Année minimum = le plus contraignant des deux */
  strandingYear: number | null;
  /** Timeline année par année : pathway vs actuel + flag stranded */
  timeline: Array<PathwayPoint & { asset_energyKwhM2: number; asset_carbonKgM2: number; stranded: boolean }>;
  /** Gap à combler pour rester aligné en 2030 (kWh/m²/an à réduire) */
  gapEnergy2030: number;
  gapEnergy2040: number;
  gapEnergy2050: number;
  /** Gap carbone (kgCO2e/m²/an à réduire) pour 2030/2040/2050 */
  gapCarbon2030: number;
  gapCarbon2040: number;
  gapCarbon2050: number;
  /** Nombre d'années avant stranding (négatif si déjà stranded) */
  yearsUntilStranding: number | null;
  /** Net-zero year (carbone ≤ 2 kgCO2e/m²/an) */
  netZeroYear: number | null;
}

/**
 * Calcule le résultat de stranding.
 * L'asset est considéré "stranded" quand son intensité dépasse le pathway pour
 * l'année considérée. On suppose par défaut que l'asset NE s'améliore PAS (pire
 * cas) — c'est l'analyse "do-nothing". Les scénarios de rénovation se font via
 * simulateRetrofit().
 */
export function analyzeStranding(input: AssetInput): StrandingResult {
  const currentYear = input.currentYear ?? new Date().getFullYear();
  const totalKwh = Object.values(input.energyMix).reduce((s, v) => s + (v ?? 0), 0);
  const currentEnergyKwhM2 = input.floorAreaM2 > 0 ? totalKwh / input.floorAreaM2 : 0;

  // Intensité carbone avec facteurs LU
  const totalCarbonKg = Object.entries(input.energyMix).reduce((sum, [src, kwh]) => {
    const factor = LU_EMISSION_FACTORS[src as LuEnergySource] ?? 0;
    return sum + (kwh ?? 0) * factor;
  }, 0);
  const currentCarbonKgM2 = input.floorAreaM2 > 0 ? totalCarbonKg / input.floorAreaM2 : 0;

  const pathway = getPathway(input.assetType, currentYear, 2050);

  // Scan année par année pour détecter stranding
  let strandingYearEnergy: number | null = null;
  let strandingYearCarbon: number | null = null;
  const timeline = pathway.map((point) => {
    const stranded = currentEnergyKwhM2 > point.energyKwhM2 || currentCarbonKgM2 > point.carbonKgM2;
    if (strandingYearEnergy === null && currentEnergyKwhM2 > point.energyKwhM2) {
      strandingYearEnergy = point.year;
    }
    if (strandingYearCarbon === null && currentCarbonKgM2 > point.carbonKgM2) {
      strandingYearCarbon = point.year;
    }
    return {
      ...point,
      asset_energyKwhM2: currentEnergyKwhM2,
      asset_carbonKgM2: currentCarbonKgM2,
      stranded,
    };
  });

  const strandingCandidates: number[] = [];
  if (strandingYearEnergy != null) strandingCandidates.push(strandingYearEnergy);
  if (strandingYearCarbon != null) strandingCandidates.push(strandingYearCarbon);
  const strandingYear: number | null = strandingCandidates.length > 0 ? Math.min(...strandingCandidates) : null;

  const p2030 = pathway.find((p) => p.year === 2030);
  const p2040 = pathway.find((p) => p.year === 2040);
  const p2050 = pathway.find((p) => p.year === 2050);

  // Net-zero : carbone ≤ 2 kgCO2e/m²/an (seuil conventionnel CRREM)
  const nz = pathway.find((p) => p.carbonKgM2 <= 2);

  return {
    currentYear,
    currentEnergyKwhM2,
    currentCarbonKgM2,
    strandingYearEnergy,
    strandingYearCarbon,
    strandingYear,
    timeline,
    gapEnergy2030: Math.max(0, currentEnergyKwhM2 - (p2030?.energyKwhM2 ?? 0)),
    gapEnergy2040: Math.max(0, currentEnergyKwhM2 - (p2040?.energyKwhM2 ?? 0)),
    gapEnergy2050: Math.max(0, currentEnergyKwhM2 - (p2050?.energyKwhM2 ?? 0)),
    gapCarbon2030: Math.max(0, currentCarbonKgM2 - (p2030?.carbonKgM2 ?? 0)),
    gapCarbon2040: Math.max(0, currentCarbonKgM2 - (p2040?.carbonKgM2 ?? 0)),
    gapCarbon2050: Math.max(0, currentCarbonKgM2 - (p2050?.carbonKgM2 ?? 0)),
    yearsUntilStranding: strandingYear != null ? strandingYear - currentYear : null,
    netZeroYear: nz?.year ?? null,
  };
}

/**
 * Simule l'impact d'une rénovation :
 *   - réduction énergétique % (isolation, vitrage, étanchéité)
 *   - switch source (ex. 100 % fioul → 50 % PAC + 50 % grid)
 *   - installation PV autoconsommation (kWc)
 */
export interface RetrofitScenario {
  label: string;
  energyReductionPct: number;           // 0..1
  newEnergyMix?: Partial<Record<LuEnergySource, number>>;
  pvSelfConsumptionKwh?: number;
}

export function simulateRetrofit(base: AssetInput, scenario: RetrofitScenario): StrandingResult {
  const area = base.floorAreaM2;
  const currentTotalKwh = Object.values(base.energyMix).reduce((s, v) => s + (v ?? 0), 0);
  const reducedKwh = currentTotalKwh * (1 - scenario.energyReductionPct);

  // Si newEnergyMix fourni → on remplace complètement, sinon on scale l'existant
  let newMix: Partial<Record<LuEnergySource, number>>;
  if (scenario.newEnergyMix) {
    const weightSum = Object.values(scenario.newEnergyMix).reduce((s, v) => s + (v ?? 0), 0);
    if (weightSum === 0) {
      newMix = scenario.newEnergyMix;
    } else {
      newMix = {};
      for (const [src, weight] of Object.entries(scenario.newEnergyMix)) {
        newMix[src as LuEnergySource] = (reducedKwh * (weight ?? 0)) / weightSum;
      }
    }
  } else {
    const scale = reducedKwh / Math.max(1, currentTotalKwh);
    newMix = {};
    for (const [src, kwh] of Object.entries(base.energyMix)) {
      newMix[src as LuEnergySource] = (kwh ?? 0) * scale;
    }
  }

  // Soustraire l'autoconsommation PV de la source "electricity_grid"
  if (scenario.pvSelfConsumptionKwh) {
    newMix.electricity_grid = Math.max(0, (newMix.electricity_grid ?? 0) - scenario.pvSelfConsumptionKwh);
  }

  return analyzeStranding({
    ...base,
    energyMix: newMix,
  });
}

/**
 * Prédéfinit 3 scénarios typiques pour l'UI (quick buttons).
 */
export const DEFAULT_RETROFIT_SCENARIOS: RetrofitScenario[] = [
  {
    label: "Rénovation légère (−30 %)",
    energyReductionPct: 0.30,
  },
  {
    label: "Rénovation + PAC (−50 % + PAC)",
    energyReductionPct: 0.50,
    newEnergyMix: { heat_pump_air_cop3: 0.7, electricity_grid: 0.3 },
  },
  {
    label: "Rénovation profonde (−70 %) + PV 10 kWc",
    energyReductionPct: 0.70,
    newEnergyMix: { heat_pump_geo_cop4: 0.8, electricity_grid: 0.2 },
    pvSelfConsumptionKwh: 8000, // 10 kWc en LU = ~9000 kWh/an, ~80 % autoconso typique
  },
];
