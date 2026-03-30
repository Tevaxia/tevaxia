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
  niveauLabel: string;
  impactValeur: number; // % d'ajustement sur la valeur
  risques: { label: string; niveau: "faible" | "moyen" | "eleve" }[];
  opportunites: string[];
  recommandations: string[];
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
  const opportunites: string[] = [];
  const recommandations: string[] = [];

  // 1. Performance énergétique (0-40 points)
  score += SCORE_ENERGIE[input.classeEnergie] || 0;
  let impactValeur = IMPACT_VALEUR_ENERGIE[input.classeEnergie] || 0;

  if (input.classeEnergie >= "F") {
    risques.push({ label: "Classe énergie F/G — risque réglementaire (interdiction location à terme)", niveau: "eleve" });
    recommandations.push("Rénovation énergétique prioritaire — éligible Klimabonus (jusqu'à 62,5% des travaux)");
  } else if (input.classeEnergie >= "D") {
    risques.push({ label: "Classe énergie D/E — performance énergétique insuffisante", niveau: "moyen" });
    recommandations.push("Envisager une rénovation pour atteindre la classe B/C");
  }

  // 2. Risques climatiques (0-20 points)
  let scoreClimatiqueMax = 20;
  if (input.zoneInondable) {
    scoreClimatiqueMax -= 10;
    risques.push({ label: "Zone inondable — risque assurantiel et dépréciation", niveau: "eleve" });
    impactValeur -= 5;
  }
  if (input.risqueSecheresse) {
    scoreClimatiqueMax -= 5;
    risques.push({ label: "Risque sécheresse — retrait-gonflement argiles possible", niveau: "moyen" });
    impactValeur -= 2;
  }
  if (input.risqueGlissementTerrain) {
    scoreClimatiqueMax -= 5;
    risques.push({ label: "Risque glissement de terrain", niveau: "moyen" });
    impactValeur -= 2;
  }
  if (input.proximiteSitePollue) {
    scoreClimatiqueMax -= 8;
    risques.push({ label: "Proximité site pollué — risque environnemental", niveau: "eleve" });
    impactValeur -= 4;
  }
  score += scoreClimatiqueMax;

  // 3. Équipements durables (0-20 points)
  if (input.isolationRecente) { score += 6; opportunites.push("Isolation récente — économies d'énergie"); }
  if (input.panneauxSolaires) { score += 8; impactValeur += 2; opportunites.push("Panneaux solaires — production d'énergie"); }
  if (input.pompeAChaleur) { score += 6; impactValeur += 1; opportunites.push("Pompe à chaleur — chauffage durable"); }

  // 4. Certifications (0-10 points)
  if (input.certifications.length > 0) {
    score += Math.min(10, input.certifications.length * 4);
    impactValeur += Math.min(3, input.certifications.length);
    opportunites.push(`Certifications : ${input.certifications.join(", ")}`);
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
  let niveauLabel: string;
  if (score >= 80) { niveau = "A"; niveauLabel = "Excellent"; }
  else if (score >= 60) { niveau = "B"; niveauLabel = "Bon"; }
  else if (score >= 40) { niveau = "C"; niveauLabel = "Moyen"; }
  else if (score >= 20) { niveau = "D"; niveauLabel = "Insuffisant"; }
  else { niveau = "E"; niveauLabel = "Critique"; }

  if (risques.length === 0) {
    risques.push({ label: "Aucun risque majeur identifié", niveau: "faible" });
  }

  return { score, niveau, niveauLabel, impactValeur, risques, opportunites, recommandations };
}
