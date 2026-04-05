// ============================================================
// COEFFICIENTS D'AJUSTEMENT — DONNÉES STATISTIQUES LUXEMBOURG
// ============================================================
// Sources :
// - Observatoire de l'Habitat — modèle hédonique (data.public.lu)
// - STATEC — indices des prix résidentiels
// - Publications presse luxembourgeoise — analyses marché
// - Pratique professionnelle évaluation LU

// Types (déclarés en premier pour être utilisés dans les constantes)
export interface AdjustmentSuggestion {
  labelKey: string;
  value: number;
  range: [number, number];
}

export interface AdjustmentGuide {
  critere: string;
  descriptionKey: string;
  referenceKey: string;
  sourceKey: string;
  suggestions: AdjustmentSuggestion[];
}

// Ajustements étage (résidentiel — appartements)
// Référence : 2ème-3ème étage avec ascenseur = 0%
// Source : modèle hédonique Observatoire de l'Habitat
export const AJUST_ETAGE: AdjustmentSuggestion[] = [
  { labelKey: "adjEtageSousSol", value: -12, range: [-15, -8] },
  { labelKey: "adjEtageRDC", value: -7, range: [-10, -5] },
  { labelKey: "adjEtage1er", value: -3, range: [-5, -1] },
  { labelKey: "adjEtage2e3eRef", value: 0, range: [0, 0] },
  { labelKey: "adjEtage4e5e", value: 3, range: [1, 5] },
  { labelKey: "adjEtageDernier", value: 5, range: [3, 8] },
  { labelKey: "adjEtageAttique", value: 10, range: [5, 15] },
];

// Ajustements état / condition
// Référence : bon état standard = 0%
export const AJUST_ETAT: AdjustmentSuggestion[] = [
  { labelKey: "adjEtatNeuf", value: 8, range: [5, 12] },
  { labelKey: "adjEtatRenove", value: 5, range: [3, 8] },
  { labelKey: "adjEtatBonRef", value: 0, range: [0, 0] },
  { labelKey: "adjEtatCorrect", value: -5, range: [-8, -3] },
  { labelKey: "adjEtatARenover", value: -12, range: [-15, -8] },
  { labelKey: "adjEtatGrosTravaux", value: -20, range: [-25, -15] },
];

// Ajustements extérieur
// Référence : balcon standard = 0%
export const AJUST_EXTERIEUR: AdjustmentSuggestion[] = [
  { labelKey: "adjExtPasExterieur", value: -4, range: [-6, -2] },
  { labelKey: "adjExtBalconRef", value: 0, range: [0, 0] },
  { labelKey: "adjExtGrandBalcon", value: 3, range: [2, 5] },
  { labelKey: "adjExtTerrasse", value: 6, range: [4, 10] },
  { labelKey: "adjExtJardin", value: 8, range: [5, 15] },
  { labelKey: "adjExtTerrasseJardin", value: 12, range: [8, 18] },
];

// Ajustements parking
// Valeur absolue d'un emplacement, convertie en % selon le prix du bien
// Source : transactions observées, publications marché LU
export const AJUST_PARKING = {
  interieur: { valeurLuxVille: 45000, valeurAutre: 30000, descriptionKey: "adjParkInterieur" },
  exterieur: { valeurLuxVille: 25000, valeurAutre: 18000, descriptionKey: "adjParkExterieur" },
  double: { valeurLuxVille: 80000, valeurAutre: 55000, descriptionKey: "adjParkDouble" },
};

export function calculerAjustParking(
  compAParking: boolean,
  bienAParking: boolean,
  prixComparable: number,
  estLuxVille: boolean
): number {
  if (compAParking === bienAParking) return 0;
  const valeur = estLuxVille ? AJUST_PARKING.interieur.valeurLuxVille : AJUST_PARKING.interieur.valeurAutre;
  const pct = prixComparable > 0 ? (valeur / prixComparable) * 100 : 0;
  // Comparable a parking mais pas le bien → comparable supérieur → ajustement négatif
  return compAParking ? -Math.round(pct) : Math.round(pct);
}

// Ajustements localisation intra-commune
// Très variable — fourchettes indicatives
export const AJUST_LOCALISATION: AdjustmentSuggestion[] = [
  { labelKey: "adjLocPremium", value: 8, range: [5, 15] },
  { labelKey: "adjLocBon", value: 3, range: [1, 5] },
  { labelKey: "adjLocMoyenRef", value: 0, range: [0, 0] },
  { labelKey: "adjLocMoinsPrise", value: -5, range: [-8, -3] },
  { labelKey: "adjLocPeripherie", value: -10, range: [-15, -5] },
];

// Indexation temporelle — variation annuelle des prix au Luxembourg
// Source : STATEC / Observatoire de l'Habitat
export const INDICES_PRIX_ANNUELS: Record<number, number> = {
  2015: 5.2,
  2016: 5.8,
  2017: 4.9,
  2018: 7.1,
  2019: 6.8,
  2020: 8.4,
  2021: 13.9,
  2022: 5.6,
  2023: -7.8,
  2024: -3.2,
  2025: 2.1,
  2026: 2.5, // estimation
};

// Calcul de l'ajustement date : ramener le comparable à la date de valeur
// Si le comparable a été vendu il y a 2 ans et les prix ont monté de 5%, ajust = +5%
export function calculerAjustDate(dateVenteComparable: string, dateValeur: string = "2025-06"): {
  ajustement: number;
  detail: string;
} {
  const [anneeVente, moisVente] = dateVenteComparable.split("-").map(Number);
  const [anneeValeur, moisValeur] = dateValeur.split("-").map(Number);

  if (!anneeVente || !anneeValeur) return { ajustement: 0, detail: "Date non valide" };

  // Calcul simplifié par année
  let totalVariation = 0;
  const details: string[] = [];

  if (anneeVente === anneeValeur) {
    const moisDiff = (moisValeur || 6) - (moisVente || 6);
    const variationAnnuelle = INDICES_PRIX_ANNUELS[anneeVente] || 2;
    const ajust = (variationAnnuelle / 12) * moisDiff;
    totalVariation = Math.round(ajust * 10) / 10;
    details.push(`${anneeVente}: ${variationAnnuelle > 0 ? "+" : ""}${variationAnnuelle}%/an`);
  } else {
    // Prorata première année (mois restants)
    const moisRestants1 = 12 - (moisVente || 6);
    const var1 = INDICES_PRIX_ANNUELS[anneeVente] || 2;
    totalVariation += (var1 / 12) * moisRestants1;
    details.push(`${anneeVente}: ${var1 > 0 ? "+" : ""}${var1}%`);

    // Années pleines
    for (let a = anneeVente + 1; a < anneeValeur; a++) {
      const v = INDICES_PRIX_ANNUELS[a] || 2;
      totalVariation += v;
      details.push(`${a}: ${v > 0 ? "+" : ""}${v}%`);
    }

    // Prorata dernière année
    const moisDernier = moisValeur || 6;
    const varDernier = INDICES_PRIX_ANNUELS[anneeValeur] || 2;
    totalVariation += (varDernier / 12) * moisDernier;
    details.push(`${anneeValeur}: ${varDernier > 0 ? "+" : ""}${varDernier}%`);
  }

  return {
    ajustement: Math.round(totalVariation * 10) / 10,
    detail: details.join(" → "),
  };
}

export const ALL_GUIDES: AdjustmentGuide[] = [
  {
    critere: "localisation",
    descriptionKey: "adjGuideLocDesc",
    referenceKey: "adjGuideLocRef",
    sourceKey: "adjGuideLocSource",
    suggestions: AJUST_LOCALISATION,
  },
  {
    critere: "etat",
    descriptionKey: "adjGuideEtatDesc",
    referenceKey: "adjGuideEtatRef",
    sourceKey: "adjGuideEtatSource",
    suggestions: AJUST_ETAT,
  },
  {
    critere: "etage",
    descriptionKey: "adjGuideEtageDesc",
    referenceKey: "adjGuideEtageRef",
    sourceKey: "adjGuideEtageSource",
    suggestions: AJUST_ETAGE,
  },
  {
    critere: "exterieur",
    descriptionKey: "adjGuideExtDesc",
    referenceKey: "adjGuideExtRef",
    sourceKey: "adjGuideExtSource",
    suggestions: AJUST_EXTERIEUR,
  },
  {
    critere: "parking",
    descriptionKey: "adjGuideParkDesc",
    referenceKey: "adjGuideParkRef",
    sourceKey: "adjGuideParkSource",
    suggestions: [
      { labelKey: "adjParkPasBienAUn", value: -5, range: [-7, -3] },
      { labelKey: "adjParkMemeSitRef", value: 0, range: [0, 0] },
      { labelKey: "adjParkPasBienNenAPas", value: 5, range: [3, 7] },
      { labelKey: "adjParkBoxFerme", value: 7, range: [5, 10] },
    ],
  },
];
