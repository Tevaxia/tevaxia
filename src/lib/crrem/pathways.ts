/**
 * CRREM 2024 Global Pathways — 1.5 °C Paris-aligned.
 *
 * Source : CRREM v3.0 (2024) — https://www.crrem.eu/pathways/
 * EU averages pour chaque asset type, trajectoire de décarbonation
 * exprimée en intensité énergétique (kWh/m²/an) et intensité carbone
 * (kgCO2e/m²/an). Les valeurs annuelles sont interpolées linéairement
 * entre les points d'ancrage publiés (2020, 2025, 2030, 2035, 2040,
 * 2045, 2050).
 *
 * Calibration LU :
 * - Grid électrique LU ~79 gCO2/kWh (ILR 2023) vs EU moyen ~244
 * - Gaz naturel 201 gCO2/kWh (facteur standard)
 * - Chauffage fioul 264 gCO2/kWh
 * - 2850 degree-days LU (Ministère de l'Environnement 2023)
 *
 * Les trajectoires CRREM restent globales (EU); la calibration LU joue
 * dans le calcul d'intensité actuelle et la comparaison au pathway.
 */

export type CrremAssetType =
  | "residential_mfh"      // Multi-family housing (collectif)
  | "residential_sfh"      // Single-family housing (individuel)
  | "office"               // Bureau
  | "retail_shopping"      // Centre commercial
  | "retail_highstreet"    // Commerce de rue
  | "hotel"                // Hôtel
  | "warehouse"            // Entrepôt / logistique
  | "healthcare";          // Santé (hôpital, cliniques, maisons retraite)

export interface PathwayPoint {
  year: number;
  energyKwhM2: number;     // Intensité énergétique kWh/m²/an
  carbonKgM2: number;      // Intensité carbone kgCO2e/m²/an
}

/**
 * CRREM Global 1.5°C pathways — EU average.
 * Sources : CRREM 2024 Global Pathways Report, Oct 2024.
 */
const CRREM_PATHWAYS: Record<CrremAssetType, PathwayPoint[]> = {
  residential_mfh: [
    { year: 2020, energyKwhM2: 168, carbonKgM2: 35 },
    { year: 2025, energyKwhM2: 150, carbonKgM2: 28 },
    { year: 2030, energyKwhM2: 112, carbonKgM2: 20 },
    { year: 2035, energyKwhM2: 80,  carbonKgM2: 14 },
    { year: 2040, energyKwhM2: 58,  carbonKgM2: 11 },
    { year: 2045, energyKwhM2: 42,  carbonKgM2: 7 },
    { year: 2050, energyKwhM2: 30,  carbonKgM2: 4 },
  ],
  residential_sfh: [
    { year: 2020, energyKwhM2: 193, carbonKgM2: 40 },
    { year: 2025, energyKwhM2: 173, carbonKgM2: 32 },
    { year: 2030, energyKwhM2: 130, carbonKgM2: 23 },
    { year: 2035, energyKwhM2: 95,  carbonKgM2: 16 },
    { year: 2040, energyKwhM2: 69,  carbonKgM2: 12 },
    { year: 2045, energyKwhM2: 50,  carbonKgM2: 8 },
    { year: 2050, energyKwhM2: 36,  carbonKgM2: 4 },
  ],
  office: [
    { year: 2020, energyKwhM2: 140, carbonKgM2: 38 },
    { year: 2025, energyKwhM2: 125, carbonKgM2: 30 },
    { year: 2030, energyKwhM2: 98,  carbonKgM2: 23 },
    { year: 2035, energyKwhM2: 75,  carbonKgM2: 17 },
    { year: 2040, energyKwhM2: 58,  carbonKgM2: 13 },
    { year: 2045, energyKwhM2: 44,  carbonKgM2: 8 },
    { year: 2050, energyKwhM2: 34,  carbonKgM2: 3 },
  ],
  retail_shopping: [
    { year: 2020, energyKwhM2: 210, carbonKgM2: 48 },
    { year: 2025, energyKwhM2: 185, carbonKgM2: 38 },
    { year: 2030, energyKwhM2: 145, carbonKgM2: 28 },
    { year: 2035, energyKwhM2: 110, carbonKgM2: 21 },
    { year: 2040, energyKwhM2: 84,  carbonKgM2: 16 },
    { year: 2045, energyKwhM2: 64,  carbonKgM2: 10 },
    { year: 2050, energyKwhM2: 50,  carbonKgM2: 4 },
  ],
  retail_highstreet: [
    { year: 2020, energyKwhM2: 170, carbonKgM2: 42 },
    { year: 2025, energyKwhM2: 152, carbonKgM2: 34 },
    { year: 2030, energyKwhM2: 119, carbonKgM2: 25 },
    { year: 2035, energyKwhM2: 91,  carbonKgM2: 18 },
    { year: 2040, energyKwhM2: 70,  carbonKgM2: 14 },
    { year: 2045, energyKwhM2: 54,  carbonKgM2: 9 },
    { year: 2050, energyKwhM2: 42,  carbonKgM2: 4 },
  ],
  hotel: [
    { year: 2020, energyKwhM2: 250, carbonKgM2: 55 },
    { year: 2025, energyKwhM2: 220, carbonKgM2: 44 },
    { year: 2030, energyKwhM2: 170, carbonKgM2: 32 },
    { year: 2035, energyKwhM2: 135, carbonKgM2: 25 },
    { year: 2040, energyKwhM2: 107, carbonKgM2: 19 },
    { year: 2045, energyKwhM2: 85,  carbonKgM2: 12 },
    { year: 2050, energyKwhM2: 68,  carbonKgM2: 5 },
  ],
  warehouse: [
    { year: 2020, energyKwhM2: 95,  carbonKgM2: 23 },
    { year: 2025, energyKwhM2: 85,  carbonKgM2: 18 },
    { year: 2030, energyKwhM2: 68,  carbonKgM2: 14 },
    { year: 2035, energyKwhM2: 52,  carbonKgM2: 10 },
    { year: 2040, energyKwhM2: 40,  carbonKgM2: 7 },
    { year: 2045, energyKwhM2: 31,  carbonKgM2: 5 },
    { year: 2050, energyKwhM2: 24,  carbonKgM2: 2 },
  ],
  healthcare: [
    { year: 2020, energyKwhM2: 305, carbonKgM2: 68 },
    { year: 2025, energyKwhM2: 270, carbonKgM2: 55 },
    { year: 2030, energyKwhM2: 215, carbonKgM2: 40 },
    { year: 2035, energyKwhM2: 170, carbonKgM2: 30 },
    { year: 2040, energyKwhM2: 134, carbonKgM2: 23 },
    { year: 2045, energyKwhM2: 106, carbonKgM2: 15 },
    { year: 2050, energyKwhM2: 84,  carbonKgM2: 6 },
  ],
};

export const ASSET_TYPE_LABELS: Record<CrremAssetType, string> = {
  residential_mfh: "Résidentiel collectif",
  residential_sfh: "Résidentiel individuel",
  office: "Bureau",
  retail_shopping: "Centre commercial",
  retail_highstreet: "Commerce de rue",
  hotel: "Hôtellerie",
  warehouse: "Entrepôt / logistique",
  healthcare: "Santé",
};

/**
 * Retourne le pathway interpolé linéairement pour chaque année entre 2020 et 2050.
 */
export function getPathway(assetType: CrremAssetType, fromYear = 2020, toYear = 2050): PathwayPoint[] {
  const anchors = CRREM_PATHWAYS[assetType];
  const result: PathwayPoint[] = [];
  for (let y = fromYear; y <= toYear; y++) {
    result.push(interpolateAt(anchors, y));
  }
  return result;
}

function interpolateAt(anchors: PathwayPoint[], year: number): PathwayPoint {
  if (year <= anchors[0].year) return { ...anchors[0], year };
  if (year >= anchors[anchors.length - 1].year) return { ...anchors[anchors.length - 1], year };
  for (let i = 0; i < anchors.length - 1; i++) {
    const a = anchors[i];
    const b = anchors[i + 1];
    if (year >= a.year && year <= b.year) {
      const t = (year - a.year) / (b.year - a.year);
      return {
        year,
        energyKwhM2: a.energyKwhM2 + (b.energyKwhM2 - a.energyKwhM2) * t,
        carbonKgM2: a.carbonKgM2 + (b.carbonKgM2 - a.carbonKgM2) * t,
      };
    }
  }
  return { ...anchors[anchors.length - 1], year };
}

/**
 * Facteurs d'émission CO2 Luxembourg (sources publiques ILR 2023 + guichet.lu).
 */
export const LU_EMISSION_FACTORS = {
  electricity_grid: 0.079,  // kgCO2e/kWh (très bas car hydro suisse + éolien + nucléaire FR)
  natural_gas: 0.201,       // kgCO2e/kWh PCI
  heating_oil: 0.264,       // kgCO2e/kWh PCI
  pellets: 0.020,           // résiduel combustion + transport
  district_heating: 0.110,  // moyenne LU réseaux chaleur (essentiellement biomasse + gaz)
  heat_pump_air_cop3: 0.026, // 0.079 / 3 COP
  heat_pump_geo_cop4: 0.020, // 0.079 / 4 COP
  solar_thermal: 0,
} as const;

export type LuEnergySource = keyof typeof LU_EMISSION_FACTORS;

export const LU_ENERGY_SOURCE_LABELS: Record<LuEnergySource, string> = {
  electricity_grid: "Électricité (réseau LU)",
  natural_gas: "Gaz naturel",
  heating_oil: "Fioul",
  pellets: "Pellets / biomasse",
  district_heating: "Réseau de chaleur",
  heat_pump_air_cop3: "Pompe à chaleur air (COP 3)",
  heat_pump_geo_cop4: "Pompe à chaleur géothermique (COP 4)",
  solar_thermal: "Solaire thermique",
};

/**
 * EPBD LU deadlines (loi modifiée 2025).
 * Classe E exigée en 2030 pour être louable.
 * Classe D exigée en 2033.
 * Zéro-émission en 2050.
 */
export const EPBD_DEADLINES = [
  { year: 2030, minClass: "E", description: "Classe E minimum pour louer" },
  { year: 2033, minClass: "D", description: "Classe D minimum pour louer" },
  { year: 2050, minClass: "A+", description: "Parc zéro-émission (objectif)" },
] as const;
