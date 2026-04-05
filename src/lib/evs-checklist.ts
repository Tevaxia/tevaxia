// ============================================================
// CHECKLIST CONFORMITÉ EVS 2025 / RED BOOK 2025
// ============================================================
// Vérifie les éléments requis par les standards d'évaluation.

export interface ChecklistItem {
  id: string;
  categorie: "identification" | "methodes" | "esg" | "marche" | "reconciliation" | "rapport";
  labelKey: string;
  obligatoire: boolean;
  reference: string; // EVS / Red Book reference
  verifie: boolean;
}

export interface ChecklistInput {
  communeSelectionnee: boolean;
  surfaceRenseignee: boolean;
  assetTypeSelectionne: boolean;
  evsTypeSelectionne: boolean;
  // Méthodes
  comparaisonFaite: boolean;
  nbComparables: number;
  capitalisationFaite: boolean;
  dcfFait: boolean;
  // ESG
  esgEvalue: boolean;
  classeEnergieRenseignee: boolean;
  // Marché
  donnesMarcheConsultees: boolean;
  // Réconciliation
  reconciliationFaite: boolean;
  scenariosAnalyses: boolean;
  narrativeGeneree: boolean;
  // MLV
  mlvCalculee: boolean;
}

export function evaluerChecklist(input: ChecklistInput): ChecklistItem[] {
  return [
    // IDENTIFICATION
    {
      id: "commune", categorie: "identification", labelKey: "checkCommune",
      obligatoire: true, reference: "EVS1 §4.1", verifie: input.communeSelectionnee,
    },
    {
      id: "surface", categorie: "identification", labelKey: "checkSurface",
      obligatoire: true, reference: "EVS1 §4.2", verifie: input.surfaceRenseignee,
    },
    {
      id: "asset_type", categorie: "identification", labelKey: "checkAssetType",
      obligatoire: true, reference: "EVS1 §4.3", verifie: input.assetTypeSelectionne,
    },
    {
      id: "evs_type", categorie: "identification", labelKey: "checkEvsType",
      obligatoire: true, reference: "EVS1 §3", verifie: input.evsTypeSelectionne,
    },

    // MÉTHODES
    {
      id: "min_2_methodes", categorie: "methodes", labelKey: "checkMin2Methodes",
      obligatoire: true, reference: "EVS1 §5.8",
      verifie: [input.comparaisonFaite, input.capitalisationFaite, input.dcfFait].filter(Boolean).length >= 2,
    },
    {
      id: "comparaison", categorie: "methodes", labelKey: "checkComparaison",
      obligatoire: false, reference: "EVS1 §5.4", verifie: input.comparaisonFaite,
    },
    {
      id: "nb_comparables", categorie: "methodes", labelKey: "checkNbComparables",
      obligatoire: false, reference: "EVS1 §5.4.2", verifie: input.nbComparables >= 3,
    },
    {
      id: "capitalisation", categorie: "methodes", labelKey: "checkCapitalisation",
      obligatoire: false, reference: "EVS1 §5.5", verifie: input.capitalisationFaite,
    },
    {
      id: "dcf", categorie: "methodes", labelKey: "checkDCF",
      obligatoire: false, reference: "EVS1 §5.6", verifie: input.dcfFait,
    },

    // ESG
    {
      id: "esg_evaluation", categorie: "esg", labelKey: "checkESG",
      obligatoire: true, reference: "EVS 2025 / Red Book 2025 / EBA Art. 208",
      verifie: input.esgEvalue,
    },
    {
      id: "classe_energie", categorie: "esg", labelKey: "checkClasseEnergie",
      obligatoire: true, reference: "EVS 2025 §ESG", verifie: input.classeEnergieRenseignee,
    },

    // MARCHÉ
    {
      id: "donnees_marche", categorie: "marche", labelKey: "checkDonneesMarche",
      obligatoire: true, reference: "EVS1 §5.3", verifie: input.donnesMarcheConsultees,
    },

    // RÉCONCILIATION
    {
      id: "reconciliation", categorie: "reconciliation", labelKey: "checkReconciliation",
      obligatoire: true, reference: "EVS1 §5.8", verifie: input.reconciliationFaite,
    },
    {
      id: "scenarios", categorie: "reconciliation", labelKey: "checkScenarios",
      obligatoire: false, reference: "Bonne pratique", verifie: input.scenariosAnalyses,
    },
    {
      id: "narrative", categorie: "reconciliation", labelKey: "checkNarrative",
      obligatoire: false, reference: "EVS1 §6", verifie: input.narrativeGeneree,
    },

    // MLV (si demandé)
    {
      id: "mlv", categorie: "rapport", labelKey: "checkMLV",
      obligatoire: false, reference: "EVS3 / CRR Art. 229", verifie: input.mlvCalculee,
    },
  ];
}

export function scoreChecklist(items: ChecklistItem[]): {
  total: number;
  remplis: number;
  obligatoiresManquants: ChecklistItem[];
  pctCompletion: number;
} {
  const remplis = items.filter((i) => i.verifie).length;
  const obligatoiresManquants = items.filter((i) => i.obligatoire && !i.verifie);
  return {
    total: items.length,
    remplis,
    obligatoiresManquants,
    pctCompletion: items.length > 0 ? (remplis / items.length) * 100 : 0,
  };
}
