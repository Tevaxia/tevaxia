// ============================================================
// TERRES AGRICOLES — Évaluation Luxembourg
// ============================================================
// Sources : Chambre d'Agriculture, Service d'Économie Rurale,
// transactions observées
//
// Prix moyen des terres agricoles au Luxembourg : ~50 000 €/ha
// (forte variation selon localisation, qualité du sol, accessibilité)
//
// Particularité LU : la constructibilité des bâtiments agricoles
// est souvent liée à l'exploitation. Si l'activité cesse, les
// bâtiments peuvent devoir être démolis (selon PAG).

export interface TerreAgricoleInput {
  surfaceHa: number; // Hectares
  qualiteSol: "bonne" | "moyenne" | "faible";
  localisation: "centre_sud" | "centre" | "nord" | "est";
  batimentsExistants: boolean;
  surfaceBatiments: number; // m²
  amiantePresume: boolean;
  exploitationActive: boolean;
  bailRuralEnCours: boolean; // Terre louée = décote ~30%
}

export interface TerreAgricoleResult {
  prixHaEstime: number;
  valeurTerres: number;
  valeurBatiments: number;
  coutDemolition: number;
  coutDesamiantage: number;
  valeurNette: number;
  alertes: string[];
}

// Prix moyens par hectare selon zone et qualité
// Source : estimations basées sur transactions observées LU
const PRIX_HA: Record<string, Record<string, number>> = {
  centre_sud: { bonne: 65000, moyenne: 50000, faible: 35000 },
  centre: { bonne: 55000, moyenne: 42000, faible: 30000 },
  nord: { bonne: 40000, moyenne: 32000, faible: 22000 },
  est: { bonne: 50000, moyenne: 38000, faible: 28000 },
};

export function evaluerTerreAgricole(input: TerreAgricoleInput): TerreAgricoleResult {
  const prixHaEstime = PRIX_HA[input.localisation]?.[input.qualiteSol] || 40000;
  // Terres louées : décote ~30% (bail rural en cours = occupation, moindre liquidité)
  const decoteBail = input.bailRuralEnCours ? 0.70 : 1.0;
  const valeurTerres = prixHaEstime * input.surfaceHa * decoteBail;
  const alertes: string[] = [];

  // Bâtiments agricoles
  let valeurBatiments = 0;
  let coutDemolition = 0;
  let coutDesamiantage = 0;

  if (input.batimentsExistants && input.surfaceBatiments > 0) {
    if (input.exploitationActive) {
      // Bâtiments en usage = valeur d'usage
      valeurBatiments = input.surfaceBatiments * 150; // ~150 €/m² pour bâtiments agricoles fonctionnels
    } else {
      // Exploitation cessée = démolition probable (selon PAG zone AGR)
      alertes.push("Exploitation cessée — les bâtiments agricoles en zone AGR peuvent devoir être démolis selon le PAG");
      coutDemolition = input.surfaceBatiments * 80; // ~80 €/m² démolition

      if (input.amiantePresume) {
        coutDesamiantage = input.surfaceBatiments * 45; // ~45 €/m² désamiantage
        alertes.push("Amiante présumé — diagnostic obligatoire avant démolition. Coût de désamiantage estimé.");
      }

      valeurBatiments = 0; // Pas de valeur si démolition requise
    }
  }

  if (!input.exploitationActive && input.batimentsExistants) {
    alertes.push("Vérifier le PAG : en zone agricole, la constructibilité est liée à l'exploitation. Sans exploitation active, le reclassement peut imposer la remise en état.");
  }

  const valeurNette = valeurTerres + valeurBatiments - coutDemolition - coutDesamiantage;

  return {
    prixHaEstime,
    valeurTerres,
    valeurBatiments,
    coutDemolition,
    coutDesamiantage,
    valeurNette,
    alertes,
  };
}
