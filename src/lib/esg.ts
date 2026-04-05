// ============================================================
// ESG / SUSTAINABILITY — EVS 2025 & Red Book 2025
// ============================================================

export interface ESGInput {
  classeEnergie: string; // A-G
  anneeConstruction: number;
  surfaceTerrain?: number;
  // Risques
  zoneInondable: boolean;
  risqueSecheresse: boolean;
  risqueGlissementTerrain: boolean;
  proximiteSitePollue: boolean;
  // Certifications
  certifications: string[];
  // Rénovation
  isolationRecente: boolean;
  panneauxSolaires: boolean;
  pompeAChaleur: boolean;
}

export interface ESGResult {
  score: number; // 0-100
  niveau: "A" | "B" | "C" | "D" | "E";
  niveauLabelKey: string;
  impactValeur: number; // % d'ajustement sur la valeur
  risques: { labelKey: string; niveau: "faible" | "moyen" | "eleve" }[];
  opportuniteKeys: string[];
  recommandationKeys: string[];
}

// Impact de la classe énergie sur le score ESG (0-40 points)
const SCORE_ENERGIE: Record<string, number> = {
  A: 40, B: 35, C: 28, D: 20, E: 12, F: 5, G: 0,
};

// Impact sur la valeur par classe (brown discount / green premium)
const IMPACT_VALEUR_ENERGIE: Record<string, number> = {
  A: 6, B: 4, C: 1, D: 0, E: -3, F: -7, G: -12,
};

export function evaluerESG(input: ESGInput): ESGResult {
  let score = 0;
  const risques: ESGResult["risques"] = [];
  const opportuniteKeys: string[] = [];
  const recommandationKeys: string[] = [];

  // 1. Performance énergétique (0-40 points)
  score += SCORE_ENERGIE[input.classeEnergie] || 0;
  let impactValeur = IMPACT_VALEUR_ENERGIE[input.classeEnergie] || 0;

  if (input.classeEnergie >= "F") {
    risques.push({ labelKey: "esgRisqueClasseFG", niveau: "eleve" });
    recommandationKeys.push("esgRecoRenovPrioritaire");
  } else if (input.classeEnergie >= "D") {
    risques.push({ labelKey: "esgRisqueClasseDE", niveau: "moyen" });
    recommandationKeys.push("esgRecoRenovBC");
  }

  // 2. Risques climatiques (0-20 points)
  let scoreClimatiqueMax = 20;
  if (input.zoneInondable) {
    scoreClimatiqueMax -= 10;
    risques.push({ labelKey: "esgRisqueInondable", niveau: "eleve" });
    impactValeur -= 5;
  }
  if (input.risqueSecheresse) {
    scoreClimatiqueMax -= 5;
    risques.push({ labelKey: "esgRisqueSecheresseLabel", niveau: "moyen" });
    impactValeur -= 2;
  }
  if (input.risqueGlissementTerrain) {
    scoreClimatiqueMax -= 5;
    risques.push({ labelKey: "esgRisqueGlissementLabel", niveau: "moyen" });
    impactValeur -= 2;
  }
  if (input.proximiteSitePollue) {
    scoreClimatiqueMax -= 8;
    risques.push({ labelKey: "esgRisquePollueLabel", niveau: "eleve" });
    impactValeur -= 4;
  }
  score += scoreClimatiqueMax;

  // 3. Équipements durables (0-20 points)
  if (input.isolationRecente) { score += 6; opportuniteKeys.push("esgOppoIsolation"); }
  if (input.panneauxSolaires) { score += 8; impactValeur += 2; opportuniteKeys.push("esgOppoSolaire"); }
  if (input.pompeAChaleur) { score += 6; impactValeur += 1; opportuniteKeys.push("esgOppoPAC"); }

  // 4. Certifications (0-10 points)
  if (input.certifications.length > 0) {
    score += Math.min(10, input.certifications.length * 4);
    impactValeur += Math.min(3, input.certifications.length);
    // For certifications, we use a special key + the raw certification names
    opportuniteKeys.push(`esgOppoCertifications:${input.certifications.join(", ")}`);
  }

  // 5. Âge du bâtiment (0-10 points)
  const age = new Date().getFullYear() - input.anneeConstruction;
  if (age < 5) score += 10;
  else if (age < 15) score += 8;
  else if (age < 30) score += 5;
  else if (age < 50) score += 2;
  else score += 0;

  // Niveau
  let niveau: ESGResult["niveau"];
  let niveauLabelKey: string;
  if (score >= 80) { niveau = "A"; niveauLabelKey = "esgNiveauExcellent"; }
  else if (score >= 60) { niveau = "B"; niveauLabelKey = "esgNiveauBon"; }
  else if (score >= 40) { niveau = "C"; niveauLabelKey = "esgNiveauMoyen"; }
  else if (score >= 20) { niveau = "D"; niveauLabelKey = "esgNiveauInsuffisant"; }
  else { niveau = "E"; niveauLabelKey = "esgNiveauCritique"; }

  if (risques.length === 0) {
    risques.push({ labelKey: "esgRisqueAucun", niveau: "faible" });
  }

  return { score, niveau, niveauLabelKey, impactValeur, risques, opportuniteKeys, recommandationKeys };
}
