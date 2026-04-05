// ============================================================
// ESTIMATION AUTOMATIQUE DES COÛTS DE RÉNOVATION ÉNERGÉTIQUE
// ============================================================
// Source : moyennes marché luxembourgeois, guides Klimabonus,
// barèmes professionnels estimés.
// Tous les montants sont des fourchettes indicatives €/m².

export interface RenovationEstimate {
  postes: { labelKey: string; coutMin: number; coutMax: number; coutMoyen: number }[];
  totalMin: number;
  totalMax: number;
  totalMoyen: number;
  honoraires: number; // ~10% du total travaux
  totalAvecHonoraires: number;
  dureeEstimeeMois: number;
}

// Coûts unitaires par poste (€/m² habitable)
// Fourchettes indicatives — marché luxembourgeois 2025
const POSTES_RENOVATION: Record<string, { labelKey: string; min: number; max: number }> = {
  isolation_facade: { labelKey: "renovIsolFacade", min: 120, max: 220 },
  isolation_toiture: { labelKey: "renovIsolToiture", min: 80, max: 160 },
  isolation_sol: { labelKey: "renovIsolSol", min: 40, max: 90 },
  fenetres: { labelKey: "renovFenetres", min: 80, max: 150 },
  chauffage: { labelKey: "renovChauffage", min: 100, max: 200 },
  ventilation: { labelKey: "renovVentilation", min: 40, max: 80 },
  solaire_thermique: { labelKey: "renovSolaireTherm", min: 30, max: 60 },
  solaire_pv: { labelKey: "renovSolairePV", min: 50, max: 100 },
  electricite: { labelKey: "renovElectricite", min: 30, max: 60 },
};

// Quels postes sont nécessaires selon le saut de classe
const POSTES_PAR_SAUT: Record<string, string[]> = {
  "G_F": ["isolation_facade", "fenetres"],
  "G_E": ["isolation_facade", "fenetres", "chauffage"],
  "G_D": ["isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"],
  "G_C": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"],
  "G_B": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique"],
  "G_A": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_thermique", "solaire_pv"],
  "F_E": ["isolation_facade", "fenetres"],
  "F_D": ["isolation_facade", "fenetres", "chauffage"],
  "F_C": ["isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"],
  "F_B": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation"],
  "F_A": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv"],
  "E_D": ["isolation_facade", "fenetres"],
  "E_C": ["isolation_facade", "fenetres", "chauffage"],
  "E_B": ["isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation"],
  "E_A": ["isolation_facade", "isolation_toiture", "isolation_sol", "fenetres", "chauffage", "ventilation", "solaire_pv"],
  "D_C": ["isolation_facade", "fenetres"],
  "D_B": ["isolation_facade", "isolation_toiture", "fenetres", "chauffage"],
  "D_A": ["isolation_facade", "isolation_toiture", "fenetres", "chauffage", "ventilation", "solaire_pv"],
  "C_B": ["isolation_toiture", "chauffage"],
  "C_A": ["isolation_toiture", "chauffage", "ventilation", "solaire_pv"],
  "B_A": ["solaire_pv", "ventilation"],
};

// Facteur d'âge : les bâtiments plus anciens coûtent plus cher à rénover
function facteurAge(anneeConstruction: number): number {
  const age = new Date().getFullYear() - anneeConstruction;
  if (age > 80) return 1.30; // Pré-1945
  if (age > 50) return 1.15; // 1945-1975
  if (age > 30) return 1.05; // 1975-1995
  return 1.00;
}

export function estimerCoutsRenovation(
  classeActuelle: string,
  classeCible: string,
  surface: number,
  anneeConstruction: number = 1980
): RenovationEstimate {
  const key = `${classeActuelle}_${classeCible}`;
  const postesNecessaires = POSTES_PAR_SAUT[key] || [];

  if (postesNecessaires.length === 0) {
    return {
      postes: [],
      totalMin: 0, totalMax: 0, totalMoyen: 0,
      honoraires: 0, totalAvecHonoraires: 0, dureeEstimeeMois: 0,
    };
  }

  const facteur = facteurAge(anneeConstruction);
  const postes = postesNecessaires.map((id) => {
    const p = POSTES_RENOVATION[id];
    if (!p) return { labelKey: id, coutMin: 0, coutMax: 0, coutMoyen: 0 };
    const min = Math.round(p.min * surface * facteur);
    const max = Math.round(p.max * surface * facteur);
    return { labelKey: p.labelKey, coutMin: min, coutMax: max, coutMoyen: Math.round((min + max) / 2) };
  });

  const totalMin = postes.reduce((s, p) => s + p.coutMin, 0);
  const totalMax = postes.reduce((s, p) => s + p.coutMax, 0);
  const totalMoyen = postes.reduce((s, p) => s + p.coutMoyen, 0);
  const honoraires = Math.round(totalMoyen * 0.10); // 10% pour architecte + BET + audit

  // Durée estimée : 1 mois par 2 postes, min 3 mois
  const dureeEstimeeMois = Math.max(3, Math.round(postesNecessaires.length * 1.5));

  return {
    postes,
    totalMin, totalMax, totalMoyen,
    honoraires,
    totalAvecHonoraires: totalMoyen + honoraires,
    dureeEstimeeMois,
  };
}
