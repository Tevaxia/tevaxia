// ============================================================
// DONNÉES DÉMOGRAPHIQUES PAR COMMUNE — Luxembourg
// ============================================================
// Sources : STATEC (Recensement 2021 + estimations 2024-2025),
// Portail des statistiques du Luxembourg, data.public.lu
// 102 communes (post-fusions 2024), 12 cantons

export interface DemographicData {
  commune: string;
  canton: string;
  population: number;
  croissancePct: number; // % croissance 2015-2025
  densiteHabKm2: number;
  revenuMedian?: number; // Revenu médian annuel €
  tauxEmploi?: number; // Taux d'emploi %
  tauxChomage?: number; // Taux de chômage %
  pctEtrangers: number; // % d'étrangers
  trancheAge?: { jeunes: number; actifs: number; seniors: number }; // % <20, 20-64, 65+
  superficieKm2?: number;
}

// Données estimées 2025 — Sources : STATEC, data.public.lu
// Population basée sur les dernières données STATEC disponibles (2024)
// Les 98 communes répertoriées + moyenne nationale
export const DEMOGRAPHICS: Record<string, DemographicData> = {

  // ──────────────────────────────────────────────
  // Canton de Luxembourg (10 communes)
  // ──────────────────────────────────────────────
  "Luxembourg": {
    commune: "Luxembourg", canton: "Luxembourg",
    population: 134_000, croissancePct: 22, densiteHabKm2: 2_600,
    revenuMedian: 52_000, tauxEmploi: 72, tauxChomage: 5.8, pctEtrangers: 71,
    trancheAge: { jeunes: 18, actifs: 68, seniors: 14 },
    superficieKm2: 51.46,
  },
  "Hesperange": {
    commune: "Hesperange", canton: "Luxembourg",
    population: 16_000, croissancePct: 18, densiteHabKm2: 600,
    revenuMedian: 55_000, tauxEmploi: 74, tauxChomage: 3.8, pctEtrangers: 50,
    trancheAge: { jeunes: 21, actifs: 65, seniors: 14 },
    superficieKm2: 23.32,
  },
  "Strassen": {
    commune: "Strassen", canton: "Luxembourg",
    population: 10_500, croissancePct: 15, densiteHabKm2: 1_700,
    revenuMedian: 58_000, tauxEmploi: 75, tauxChomage: 3.5, pctEtrangers: 55,
    trancheAge: { jeunes: 19, actifs: 66, seniors: 15 },
    superficieKm2: 6.16,
  },
  "Bertrange": {
    commune: "Bertrange", canton: "Luxembourg",
    population: 9_800, croissancePct: 14, densiteHabKm2: 1_200,
    revenuMedian: 60_000, tauxEmploi: 76, tauxChomage: 3.2, pctEtrangers: 58,
    trancheAge: { jeunes: 20, actifs: 66, seniors: 14 },
    superficieKm2: 8.14,
  },
  "Walferdange": {
    commune: "Walferdange", canton: "Luxembourg",
    population: 8_500, croissancePct: 12, densiteHabKm2: 1_000,
    revenuMedian: 52_000, tauxEmploi: 72, tauxChomage: 3.9, pctEtrangers: 48,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 8.49,
  },
  "Niederanven": {
    commune: "Niederanven", canton: "Luxembourg",
    population: 7_000, croissancePct: 15, densiteHabKm2: 250,
    revenuMedian: 58_000, tauxEmploi: 76, tauxChomage: 3.0, pctEtrangers: 45,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 28.28,
  },
  "Sandweiler": {
    commune: "Sandweiler", canton: "Luxembourg",
    population: 4_500, croissancePct: 10, densiteHabKm2: 400,
    revenuMedian: 54_000, tauxEmploi: 74, tauxChomage: 3.3, pctEtrangers: 42,
    trancheAge: { jeunes: 20, actifs: 66, seniors: 14 },
    superficieKm2: 11.38,
  },
  "Schuttrange": {
    commune: "Schuttrange", canton: "Luxembourg",
    population: 5_200, croissancePct: 16, densiteHabKm2: 310,
    revenuMedian: 56_000, tauxEmploi: 75, tauxChomage: 3.1, pctEtrangers: 44,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 16.73,
  },
  "Kopstal": {
    commune: "Kopstal", canton: "Luxembourg",
    population: 4_200, croissancePct: 12, densiteHabKm2: 240,
    revenuMedian: 62_000, tauxEmploi: 77, tauxChomage: 2.8, pctEtrangers: 42,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 17.47,
  },
  "Steinsel": {
    commune: "Steinsel", canton: "Luxembourg",
    population: 5_600, croissancePct: 10, densiteHabKm2: 520,
    revenuMedian: 54_000, tauxEmploi: 74, tauxChomage: 3.4, pctEtrangers: 46,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 10.79,
  },
  "Contern": {
    commune: "Contern", canton: "Luxembourg",
    population: 4_300, croissancePct: 14, densiteHabKm2: 200,
    revenuMedian: 55_000, tauxEmploi: 75, tauxChomage: 3.2, pctEtrangers: 40,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 21.22,
  },

  // ──────────────────────────────────────────────
  // Canton de Capellen (8 communes)
  // ──────────────────────────────────────────────
  "Mamer": {
    commune: "Mamer", canton: "Capellen",
    population: 10_800, croissancePct: 20, densiteHabKm2: 500,
    revenuMedian: 56_000, tauxEmploi: 74, tauxChomage: 3.4, pctEtrangers: 52,
    trancheAge: { jeunes: 21, actifs: 65, seniors: 14 },
    superficieKm2: 21.62,
  },
  "Kehlen": {
    commune: "Kehlen", canton: "Capellen",
    population: 6_800, croissancePct: 18, densiteHabKm2: 200,
    revenuMedian: 55_000, tauxEmploi: 74, tauxChomage: 3.2, pctEtrangers: 44,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 33.62,
  },
  "Steinfort": {
    commune: "Steinfort", canton: "Capellen",
    population: 5_800, croissancePct: 12, densiteHabKm2: 250,
    revenuMedian: 48_000, tauxEmploi: 70, tauxChomage: 4.0, pctEtrangers: 38,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 23.42,
  },
  "Garnich": {
    commune: "Garnich", canton: "Capellen",
    population: 2_200, croissancePct: 10, densiteHabKm2: 120,
    revenuMedian: 52_000, tauxEmploi: 73, tauxChomage: 3.0, pctEtrangers: 35,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 18.26,
  },
  "Habscht": {
    commune: "Habscht", canton: "Capellen",
    population: 3_800, croissancePct: 8, densiteHabKm2: 90,
    revenuMedian: 48_000, tauxEmploi: 70, tauxChomage: 3.6, pctEtrangers: 30,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 42.50,
  },
  "Koerich": {
    commune: "Koerich", canton: "Capellen",
    population: 3_000, croissancePct: 12, densiteHabKm2: 150,
    revenuMedian: 50_000, tauxEmploi: 72, tauxChomage: 3.3, pctEtrangers: 32,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 19.96,
  },
  "Septfontaines": {
    commune: "Septfontaines", canton: "Capellen",
    population: 2_600, croissancePct: 8, densiteHabKm2: 80,
    revenuMedian: 48_000, tauxEmploi: 71, tauxChomage: 3.4, pctEtrangers: 28,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 33.15,
  },

  // ──────────────────────────────────────────────
  // Canton d'Esch-sur-Alzette (14 communes)
  // ──────────────────────────────────────────────
  "Esch-sur-Alzette": {
    commune: "Esch-sur-Alzette", canton: "Esch-sur-Alzette",
    population: 38_000, croissancePct: 18, densiteHabKm2: 2_800,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 7.2, pctEtrangers: 58,
    trancheAge: { jeunes: 19, actifs: 67, seniors: 14 },
    superficieKm2: 14.35,
  },
  "Differdange": {
    commune: "Differdange", canton: "Esch-sur-Alzette",
    population: 30_000, croissancePct: 20, densiteHabKm2: 1_400,
    revenuMedian: 37_000, tauxEmploi: 62, tauxChomage: 7.5, pctEtrangers: 60,
    trancheAge: { jeunes: 20, actifs: 67, seniors: 13 },
    superficieKm2: 22.18,
  },
  "Dudelange": {
    commune: "Dudelange", canton: "Esch-sur-Alzette",
    population: 22_000, croissancePct: 12, densiteHabKm2: 850,
    revenuMedian: 39_000, tauxEmploi: 65, tauxChomage: 6.8, pctEtrangers: 55,
    trancheAge: { jeunes: 19, actifs: 66, seniors: 15 },
    superficieKm2: 21.38,
  },
  "Pétange": {
    commune: "Pétange", canton: "Esch-sur-Alzette",
    population: 20_500, croissancePct: 15, densiteHabKm2: 1_100,
    revenuMedian: 36_000, tauxEmploi: 63, tauxChomage: 7.0, pctEtrangers: 55,
    trancheAge: { jeunes: 20, actifs: 67, seniors: 13 },
    superficieKm2: 18.62,
  },
  "Sanem": {
    commune: "Sanem", canton: "Esch-sur-Alzette",
    population: 18_500, croissancePct: 25, densiteHabKm2: 700,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 5.5, pctEtrangers: 52,
    trancheAge: { jeunes: 21, actifs: 66, seniors: 13 },
    superficieKm2: 26.44,
  },
  "Schifflange": {
    commune: "Schifflange", canton: "Esch-sur-Alzette",
    population: 12_500, croissancePct: 16, densiteHabKm2: 1_800,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 6.5, pctEtrangers: 52,
    trancheAge: { jeunes: 20, actifs: 67, seniors: 13 },
    superficieKm2: 6.93,
  },
  "Bettembourg": {
    commune: "Bettembourg", canton: "Esch-sur-Alzette",
    population: 11_500, croissancePct: 14, densiteHabKm2: 480,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 5.0, pctEtrangers: 48,
    trancheAge: { jeunes: 21, actifs: 65, seniors: 14 },
    superficieKm2: 23.87,
  },
  "Käerjeng": {
    commune: "Käerjeng", canton: "Esch-sur-Alzette",
    population: 11_000, croissancePct: 10, densiteHabKm2: 350,
    revenuMedian: 42_000, tauxEmploi: 68, tauxChomage: 5.2, pctEtrangers: 40,
    trancheAge: { jeunes: 21, actifs: 65, seniors: 14 },
    superficieKm2: 31.42,
  },
  "Kayl": {
    commune: "Kayl", canton: "Esch-sur-Alzette",
    population: 10_500, croissancePct: 12, densiteHabKm2: 700,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 6.0, pctEtrangers: 42,
    trancheAge: { jeunes: 21, actifs: 66, seniors: 13 },
    superficieKm2: 14.98,
  },
  "Mondercange": {
    commune: "Mondercange", canton: "Esch-sur-Alzette",
    population: 9_500, croissancePct: 16, densiteHabKm2: 650,
    revenuMedian: 43_000, tauxEmploi: 68, tauxChomage: 5.3, pctEtrangers: 45,
    trancheAge: { jeunes: 22, actifs: 65, seniors: 13 },
    superficieKm2: 14.65,
  },
  "Roeser": {
    commune: "Roeser", canton: "Esch-sur-Alzette",
    population: 6_200, croissancePct: 14, densiteHabKm2: 250,
    revenuMedian: 48_000, tauxEmploi: 71, tauxChomage: 4.2, pctEtrangers: 42,
    trancheAge: { jeunes: 22, actifs: 65, seniors: 13 },
    superficieKm2: 24.69,
  },
  "Leudelange": {
    commune: "Leudelange", canton: "Esch-sur-Alzette",
    population: 3_200, croissancePct: 18, densiteHabKm2: 360,
    revenuMedian: 52_000, tauxEmploi: 73, tauxChomage: 3.6, pctEtrangers: 48,
    trancheAge: { jeunes: 21, actifs: 65, seniors: 14 },
    superficieKm2: 8.82,
  },
  "Reckange-sur-Mess": {
    commune: "Reckange-sur-Mess", canton: "Esch-sur-Alzette",
    population: 4_200, croissancePct: 16, densiteHabKm2: 220,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 4.5, pctEtrangers: 38,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 18.84,
  },
  "Frisange": {
    commune: "Frisange", canton: "Esch-sur-Alzette",
    population: 4_800, croissancePct: 15, densiteHabKm2: 260,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 4.3, pctEtrangers: 44,
    trancheAge: { jeunes: 22, actifs: 65, seniors: 13 },
    superficieKm2: 18.27,
  },
  "Dippach": {
    commune: "Dippach", canton: "Esch-sur-Alzette",
    population: 4_500, croissancePct: 14, densiteHabKm2: 250,
    revenuMedian: 47_000, tauxEmploi: 71, tauxChomage: 4.2, pctEtrangers: 40,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 17.84,
  },

  // ──────────────────────────────────────────────
  // Canton de Mersch (10 communes)
  // ──────────────────────────────────────────────
  "Mersch": {
    commune: "Mersch", canton: "Mersch",
    population: 10_000, croissancePct: 15, densiteHabKm2: 250,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 4.5, pctEtrangers: 35,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 39.76,
  },
  "Lintgen": {
    commune: "Lintgen", canton: "Mersch",
    population: 3_500, croissancePct: 14, densiteHabKm2: 350,
    revenuMedian: 50_000, tauxEmploi: 72, tauxChomage: 3.8, pctEtrangers: 38,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 10.03,
  },
  "Lorentzweiler": {
    commune: "Lorentzweiler", canton: "Mersch",
    population: 4_200, croissancePct: 15, densiteHabKm2: 280,
    revenuMedian: 50_000, tauxEmploi: 72, tauxChomage: 3.7, pctEtrangers: 36,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 14.85,
  },
  "Bissen": {
    commune: "Bissen", canton: "Mersch",
    population: 3_800, croissancePct: 12, densiteHabKm2: 200,
    revenuMedian: 46_000, tauxEmploi: 69, tauxChomage: 4.2, pctEtrangers: 32,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 19.06,
  },
  "Colmar-Berg": {
    commune: "Colmar-Berg", canton: "Mersch",
    population: 2_600, croissancePct: 10, densiteHabKm2: 280,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.5, pctEtrangers: 38,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 9.36,
  },
  "Feulen": {
    commune: "Feulen", canton: "Mersch",
    population: 2_200, croissancePct: 8, densiteHabKm2: 100,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.3, pctEtrangers: 25,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 22.56,
  },
  "Larochette": {
    commune: "Larochette", canton: "Mersch",
    population: 2_600, croissancePct: 10, densiteHabKm2: 120,
    revenuMedian: 42_000, tauxEmploi: 66, tauxChomage: 4.8, pctEtrangers: 35,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 21.46,
  },
  "Nommern": {
    commune: "Nommern", canton: "Mersch",
    population: 1_600, croissancePct: 6, densiteHabKm2: 55,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 3.5, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 62, seniors: 18 },
    superficieKm2: 28.94,
  },
  "Helperknapp": {
    commune: "Helperknapp", canton: "Mersch",
    population: 2_000, croissancePct: 8, densiteHabKm2: 75,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 3.6, pctEtrangers: 24,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 26.70,
  },
  "Schieren": {
    commune: "Schieren", canton: "Mersch",
    population: 2_000, croissancePct: 10, densiteHabKm2: 380,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.4, pctEtrangers: 30,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 5.26,
  },

  // ──────────────────────────────────────────────
  // Canton de Diekirch (8 communes)
  // ──────────────────────────────────────────────
  "Diekirch": {
    commune: "Diekirch", canton: "Diekirch",
    population: 7_200, croissancePct: 10, densiteHabKm2: 400,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 5.5, pctEtrangers: 38,
    trancheAge: { jeunes: 19, actifs: 64, seniors: 17 },
    superficieKm2: 17.96,
  },
  "Ettelbruck": {
    commune: "Ettelbruck", canton: "Diekirch",
    population: 9_500, croissancePct: 12, densiteHabKm2: 350,
    revenuMedian: 42_000, tauxEmploi: 68, tauxChomage: 5.2, pctEtrangers: 42,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 27.14,
  },
  "Erpeldange-sur-Sûre": {
    commune: "Erpeldange-sur-Sûre", canton: "Diekirch",
    population: 3_200, croissancePct: 14, densiteHabKm2: 160,
    revenuMedian: 44_000, tauxEmploi: 69, tauxChomage: 4.5, pctEtrangers: 35,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 20.06,
  },
  "Bourscheid": {
    commune: "Bourscheid", canton: "Diekirch",
    population: 1_800, croissancePct: 6, densiteHabKm2: 45,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.0, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 39.92,
  },
  "Reisdorf": {
    commune: "Reisdorf", canton: "Diekirch",
    population: 1_500, croissancePct: 5, densiteHabKm2: 70,
    revenuMedian: 40_000, tauxEmploi: 65, tauxChomage: 4.2, pctEtrangers: 22,
    trancheAge: { jeunes: 18, actifs: 62, seniors: 20 },
    superficieKm2: 21.62,
  },
  "Vallée de l'Ernz": {
    commune: "Vallée de l'Ernz", canton: "Diekirch",
    population: 3_200, croissancePct: 8, densiteHabKm2: 60,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 52.42,
  },
  "Tandel": {
    commune: "Tandel", canton: "Diekirch",
    population: 2_400, croissancePct: 7, densiteHabKm2: 65,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.2, pctEtrangers: 24,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 37.08,
  },
  "Putscheid": {
    commune: "Putscheid", canton: "Diekirch",
    population: 1_000, croissancePct: 4, densiteHabKm2: 30,
    revenuMedian: 40_000, tauxEmploi: 64, tauxChomage: 4.5, pctEtrangers: 20,
    trancheAge: { jeunes: 18, actifs: 61, seniors: 21 },
    superficieKm2: 33.00,
  },

  // ──────────────────────────────────────────────
  // Canton de Grevenmacher (8 communes)
  // ──────────────────────────────────────────────
  "Grevenmacher": {
    commune: "Grevenmacher", canton: "Grevenmacher",
    population: 5_200, croissancePct: 10, densiteHabKm2: 250,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 5.0, pctEtrangers: 35,
    trancheAge: { jeunes: 20, actifs: 64, seniors: 16 },
    superficieKm2: 20.93,
  },
  "Junglinster": {
    commune: "Junglinster", canton: "Grevenmacher",
    population: 8_500, croissancePct: 18, densiteHabKm2: 200,
    revenuMedian: 50_000, tauxEmploi: 72, tauxChomage: 3.8, pctEtrangers: 32,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 42.22,
  },
  "Betzdorf": {
    commune: "Betzdorf", canton: "Grevenmacher",
    population: 3_800, croissancePct: 14, densiteHabKm2: 150,
    revenuMedian: 50_000, tauxEmploi: 72, tauxChomage: 3.6, pctEtrangers: 34,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 24.86,
  },
  "Mertert": {
    commune: "Mertert", canton: "Grevenmacher",
    population: 4_500, croissancePct: 10, densiteHabKm2: 310,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 5.0, pctEtrangers: 38,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 14.46,
  },
  "Wormeldange": {
    commune: "Wormeldange", canton: "Grevenmacher",
    population: 3_200, croissancePct: 8, densiteHabKm2: 120,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.2, pctEtrangers: 32,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 27.15,
  },
  "Flaxweiler": {
    commune: "Flaxweiler", canton: "Grevenmacher",
    population: 2_200, croissancePct: 10, densiteHabKm2: 120,
    revenuMedian: 46_000, tauxEmploi: 70, tauxChomage: 3.8, pctEtrangers: 28,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 18.52,
  },
  "Biwer": {
    commune: "Biwer", canton: "Grevenmacher",
    population: 2_000, croissancePct: 8, densiteHabKm2: 100,
    revenuMedian: 44_000, tauxEmploi: 69, tauxChomage: 4.0, pctEtrangers: 26,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 20.23,
  },
  "Manternach": {
    commune: "Manternach", canton: "Grevenmacher",
    population: 2_100, croissancePct: 8, densiteHabKm2: 80,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.2, pctEtrangers: 25,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 26.32,
  },

  // ──────────────────────────────────────────────
  // Canton de Remich (8 communes)
  // ──────────────────────────────────────────────
  "Remich": {
    commune: "Remich", canton: "Remich",
    population: 3_800, croissancePct: 8, densiteHabKm2: 600,
    revenuMedian: 42_000, tauxEmploi: 66, tauxChomage: 4.8, pctEtrangers: 38,
    trancheAge: { jeunes: 19, actifs: 63, seniors: 18 },
    superficieKm2: 5.29,
  },
  "Mondorf-les-Bains": {
    commune: "Mondorf-les-Bains", canton: "Remich",
    population: 5_500, croissancePct: 12, densiteHabKm2: 300,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.5, pctEtrangers: 42,
    trancheAge: { jeunes: 20, actifs: 64, seniors: 16 },
    superficieKm2: 18.26,
  },
  "Schengen": {
    commune: "Schengen", canton: "Remich",
    population: 5_000, croissancePct: 14, densiteHabKm2: 200,
    revenuMedian: 42_000, tauxEmploi: 66, tauxChomage: 4.8, pctEtrangers: 50,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 24.56,
  },
  "Bous": {
    commune: "Bous", canton: "Remich",
    population: 2_200, croissancePct: 10, densiteHabKm2: 250,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.2, pctEtrangers: 35,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 8.76,
  },
  "Dalheim": {
    commune: "Dalheim", canton: "Remich",
    population: 2_200, croissancePct: 8, densiteHabKm2: 110,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 30,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 19.78,
  },
  "Lenningen": {
    commune: "Lenningen", canton: "Remich",
    population: 2_000, croissancePct: 10, densiteHabKm2: 130,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 32,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 15.52,
  },
  "Stadtbredimus": {
    commune: "Stadtbredimus", canton: "Remich",
    population: 1_800, croissancePct: 8, densiteHabKm2: 150,
    revenuMedian: 42_000, tauxEmploi: 66, tauxChomage: 4.2, pctEtrangers: 30,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 12.09,
  },
  "Waldbredimus": {
    commune: "Waldbredimus", canton: "Remich",
    population: 1_600, croissancePct: 6, densiteHabKm2: 130,
    revenuMedian: 46_000, tauxEmploi: 69, tauxChomage: 3.8, pctEtrangers: 28,
    trancheAge: { jeunes: 21, actifs: 64, seniors: 15 },
    superficieKm2: 12.52,
  },
  "Weiler-la-Tour": {
    commune: "Weiler-la-Tour", canton: "Remich",
    population: 2_500, croissancePct: 12, densiteHabKm2: 170,
    revenuMedian: 48_000, tauxEmploi: 71, tauxChomage: 3.6, pctEtrangers: 35,
    trancheAge: { jeunes: 22, actifs: 64, seniors: 14 },
    superficieKm2: 14.48,
  },

  // ──────────────────────────────────────────────
  // Canton d'Echternach (5 communes)
  // ──────────────────────────────────────────────
  "Echternach": {
    commune: "Echternach", canton: "Echternach",
    population: 5_800, croissancePct: 8, densiteHabKm2: 200,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 5.5, pctEtrangers: 32,
    trancheAge: { jeunes: 19, actifs: 63, seniors: 18 },
    superficieKm2: 20.49,
  },
  "Rosport-Mompach": {
    commune: "Rosport-Mompach", canton: "Echternach",
    population: 3_000, croissancePct: 6, densiteHabKm2: 60,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 4.5, pctEtrangers: 26,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 50.18,
  },
  "Beaufort": {
    commune: "Beaufort", canton: "Echternach",
    population: 3_000, croissancePct: 6, densiteHabKm2: 55,
    revenuMedian: 40_000, tauxEmploi: 66, tauxChomage: 4.5, pctEtrangers: 25,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 54.56,
  },
  "Berdorf": {
    commune: "Berdorf", canton: "Echternach",
    population: 1_500, croissancePct: 4, densiteHabKm2: 50,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.0, pctEtrangers: 22,
    trancheAge: { jeunes: 18, actifs: 62, seniors: 20 },
    superficieKm2: 29.96,
  },
  "Bech": {
    commune: "Bech", canton: "Echternach",
    population: 1_200, croissancePct: 4, densiteHabKm2: 45,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 3.8, pctEtrangers: 20,
    trancheAge: { jeunes: 18, actifs: 62, seniors: 20 },
    superficieKm2: 26.65,
  },
  "Waldbillig": {
    commune: "Waldbillig", canton: "Echternach",
    population: 1_800, croissancePct: 5, densiteHabKm2: 50,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.0, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 36.52,
  },

  // ──────────────────────────────────────────────
  // Canton de Redange (9 communes)
  // ──────────────────────────────────────────────
  "Redange": {
    commune: "Redange", canton: "Redange",
    population: 3_200, croissancePct: 10, densiteHabKm2: 130,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.5, pctEtrangers: 28,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 25.14,
  },
  "Beckerich": {
    commune: "Beckerich", canton: "Redange",
    population: 2_800, croissancePct: 8, densiteHabKm2: 100,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 25,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 28.50,
  },
  "Ell": {
    commune: "Ell", canton: "Redange",
    population: 1_400, croissancePct: 6, densiteHabKm2: 65,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 3.8, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 22.06,
  },
  "Grosbous": {
    commune: "Grosbous", canton: "Redange",
    population: 1_600, croissancePct: 6, densiteHabKm2: 75,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 24,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 21.52,
  },
  "Préizerdaul": {
    commune: "Préizerdaul", canton: "Redange",
    population: 2_000, croissancePct: 8, densiteHabKm2: 60,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.2, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 33.74,
  },
  "Rambrouch": {
    commune: "Rambrouch", canton: "Redange",
    population: 4_200, croissancePct: 8, densiteHabKm2: 55,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.2, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 76.14,
  },
  "Saeul": {
    commune: "Saeul", canton: "Redange",
    population: 1_100, croissancePct: 6, densiteHabKm2: 70,
    revenuMedian: 44_000, tauxEmploi: 69, tauxChomage: 3.8, pctEtrangers: 22,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 16.06,
  },
  "Useldange": {
    commune: "Useldange", canton: "Redange",
    population: 2_200, croissancePct: 8, densiteHabKm2: 70,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 4.0, pctEtrangers: 24,
    trancheAge: { jeunes: 21, actifs: 63, seniors: 16 },
    superficieKm2: 31.02,
  },
  "Vichten": {
    commune: "Vichten", canton: "Redange",
    population: 1_300, croissancePct: 5, densiteHabKm2: 75,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 3.8, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 17.24,
  },
  "Wahl": {
    commune: "Wahl", canton: "Redange",
    population: 1_600, croissancePct: 6, densiteHabKm2: 60,
    revenuMedian: 42_000, tauxEmploi: 67, tauxChomage: 4.0, pctEtrangers: 22,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 26.88,
  },

  // ──────────────────────────────────────────────
  // Canton de Clervaux (6 communes)
  // ──────────────────────────────────────────────
  "Clervaux": {
    commune: "Clervaux", canton: "Clervaux",
    population: 5_500, croissancePct: 6, densiteHabKm2: 50,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 5.0, pctEtrangers: 28,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 86.38,
  },
  "Troisvierges": {
    commune: "Troisvierges", canton: "Clervaux",
    population: 4_200, croissancePct: 6, densiteHabKm2: 70,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 5.2, pctEtrangers: 30,
    trancheAge: { jeunes: 20, actifs: 63, seniors: 17 },
    superficieKm2: 59.32,
  },
  "Weiswampach": {
    commune: "Weiswampach", canton: "Clervaux",
    population: 2_600, croissancePct: 5, densiteHabKm2: 50,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.8, pctEtrangers: 25,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 51.56,
  },
  "Wincrange": {
    commune: "Wincrange", canton: "Clervaux",
    population: 5_200, croissancePct: 6, densiteHabKm2: 40,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.8, pctEtrangers: 24,
    trancheAge: { jeunes: 20, actifs: 62, seniors: 18 },
    superficieKm2: 130.58,
  },
  "Parc Hosingen": {
    commune: "Parc Hosingen", canton: "Clervaux",
    population: 3_400, croissancePct: 5, densiteHabKm2: 40,
    revenuMedian: 40_000, tauxEmploi: 65, tauxChomage: 4.5, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 85.24,
  },
  "Munshausen": {
    commune: "Munshausen", canton: "Clervaux",
    population: 2_000, croissancePct: 4, densiteHabKm2: 40,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.5, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 50.16,
  },
  "Kiischpelt": {
    commune: "Kiischpelt", canton: "Clervaux",
    population: 1_200, croissancePct: 3, densiteHabKm2: 25,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.5, pctEtrangers: 20,
    trancheAge: { jeunes: 18, actifs: 61, seniors: 21 },
    superficieKm2: 47.32,
  },

  // ──────────────────────────────────────────────
  // Canton de Wiltz (5 communes)
  // ──────────────────────────────────────────────
  "Wiltz": {
    commune: "Wiltz", canton: "Wiltz",
    population: 7_500, croissancePct: 8, densiteHabKm2: 130,
    revenuMedian: 36_000, tauxEmploi: 62, tauxChomage: 6.0, pctEtrangers: 35,
    trancheAge: { jeunes: 20, actifs: 64, seniors: 16 },
    superficieKm2: 57.82,
  },
  "Winseler": {
    commune: "Winseler", canton: "Wiltz",
    population: 1_800, croissancePct: 4, densiteHabKm2: 35,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 5.0, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 52.18,
  },
  "Boulaide": {
    commune: "Boulaide", canton: "Wiltz",
    population: 1_500, croissancePct: 4, densiteHabKm2: 30,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.8, pctEtrangers: 22,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 50.34,
  },
  "Esch-sur-Sûre": {
    commune: "Esch-sur-Sûre", canton: "Wiltz",
    population: 3_200, croissancePct: 5, densiteHabKm2: 50,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 5.0, pctEtrangers: 24,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 64.42,
  },
  "Lac de la Haute-Sûre": {
    commune: "Lac de la Haute-Sûre", canton: "Wiltz",
    population: 2_200, croissancePct: 4, densiteHabKm2: 35,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.8, pctEtrangers: 20,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 62.86,
  },
  "Goesdorf": {
    commune: "Goesdorf", canton: "Wiltz",
    population: 1_800, croissancePct: 4, densiteHabKm2: 35,
    revenuMedian: 38_000, tauxEmploi: 64, tauxChomage: 4.8, pctEtrangers: 20,
    trancheAge: { jeunes: 19, actifs: 62, seniors: 19 },
    superficieKm2: 52.38,
  },

  // ──────────────────────────────────────────────
  // Canton de Vianden (1 commune)
  // ──────────────────────────────────────────────
  "Vianden": {
    commune: "Vianden", canton: "Vianden",
    population: 2_200, croissancePct: 5, densiteHabKm2: 130,
    revenuMedian: 36_000, tauxEmploi: 60, tauxChomage: 5.5, pctEtrangers: 30,
    trancheAge: { jeunes: 18, actifs: 62, seniors: 20 },
    superficieKm2: 17.15,
  },

  // ──────────────────────────────────────────────
  // Moyenne nationale pour référence
  // ──────────────────────────────────────────────
  "_national": {
    commune: "Luxembourg (pays)", canton: "",
    population: 672_000, croissancePct: 18, densiteHabKm2: 260,
    revenuMedian: 44_000, tauxEmploi: 68, tauxChomage: 5.2, pctEtrangers: 48,
    trancheAge: { jeunes: 20, actifs: 65, seniors: 15 },
    superficieKm2: 2_586.4,
  },
};

/**
 * Recherche les données démographiques d'une commune.
 * Accepte le nom exact ou une recherche insensible à la casse.
 */
export function getDemographics(commune: string): DemographicData | null {
  if (DEMOGRAPHICS[commune]) return DEMOGRAPHICS[commune];
  // Recherche insensible à la casse
  const key = Object.keys(DEMOGRAPHICS).find(
    (k) => k.toLowerCase() === commune.toLowerCase(),
  );
  return key ? DEMOGRAPHICS[key] : null;
}

/**
 * Retourne toutes les communes d'un canton donné.
 */
export function getCommunesByCanton(canton: string): DemographicData[] {
  return Object.values(DEMOGRAPHICS).filter(
    (d) => d.canton === canton && d.commune !== "Luxembourg (pays)",
  );
}

/**
 * Retourne la liste des 12 cantons.
 */
export function getCantons(): string[] {
  const cantons = new Set<string>();
  for (const d of Object.values(DEMOGRAPHICS)) {
    if (d.canton && d.canton !== "") cantons.add(d.canton);
  }
  return Array.from(cantons).sort();
}
