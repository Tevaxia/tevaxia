// ============================================================
// TYPES D'ACTIFS & PARAMÈTRES EVS 2025 / TEGOVA
// ============================================================

// EVS 2025 — Bases de valeur (10e édition)
export type EVSValueType =
  | "market_value"        // EVS1 — Valeur de marché
  | "market_rent"         // EVS2 — Valeur locative de marché (ERV)
  | "mlv"                 // EVS3 — Mortgage Lending Value
  | "investment_value"    // EVS4 — Valeur d'investissement (Worth)
  | "fair_value"          // EVS5 — Juste valeur (IFRS 13)
  | "equitable_value";    // EVS6 — Valeur équitable (IFRS / litiges)

export const EVS_VALUE_TYPES: { id: EVSValueType; labelKey: string; evs: string; descriptionKey: string }[] = [
  {
    id: "market_value",
    labelKey: "evsMarketValueLabel",
    evs: "EVS1",
    descriptionKey: "evsMarketValueDesc",
  },
  {
    id: "market_rent",
    labelKey: "evsMarketRentLabel",
    evs: "EVS2",
    descriptionKey: "evsMarketRentDesc",
  },
  {
    id: "mlv",
    labelKey: "evsMLVLabel",
    evs: "EVS3",
    descriptionKey: "evsMLVDesc",
  },
  {
    id: "investment_value",
    labelKey: "evsInvestmentValueLabel",
    evs: "EVS4",
    descriptionKey: "evsInvestmentValueDesc",
  },
  {
    id: "fair_value",
    labelKey: "evsFairValueLabel",
    evs: "EVS5",
    descriptionKey: "evsFairValueDesc",
  },
  {
    id: "equitable_value",
    labelKey: "evsEquitableValueLabel",
    evs: "EVS6",
    descriptionKey: "evsEquitableValueDesc",
  },
];

// Types d'actifs immobiliers
export type AssetType =
  | "residential_apartment"
  | "residential_house"
  | "residential_building" // Immeuble de rapport (pur résidentiel ou mixte)
  | "office"
  | "retail"
  | "hotel"
  | "logistics"
  | "land";

export interface AssetTypeConfig {
  id: AssetType;
  labelKey: string;
  icon: string;
  // Paramètres par défaut — tous configurables
  defaults: {
    capRateMin: number;
    capRateMax: number;
    capRateDefault: number;
    vacancyRate: number;
    managementFee: number; // % du loyer brut
    maintenanceProvision: number; // % du loyer brut
    insuranceRate: number; // €/m²/an estimation
    propertyTax: number; // €/m²/an estimation (très faible au LU)
    dcfPeriod: number; // Durée DCF standard
    discountRateDefault: number;
    exitCapDefault: number;
    indexationDefault: number;
    // MLV
    mlvConjoncturelleDefault: number;
    mlvCommercialisationDefault: number;
    mlvSpecifiqueDefault: number;
  };
  // Métriques spécifiques (translation keys)
  specificMetricKeys: string[];
  // Méthodes recommandées EVS (translation keys)
  recommendedMethodKeys: string[];
  // Notes contextuelles (translation key)
  notesKey: string;
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: "residential_apartment",
    labelKey: "assetResAppartement",
    icon: "apartment",
    defaults: {
      capRateMin: 3.0, capRateMax: 5.5, capRateDefault: 4.0,
      vacancyRate: 3, managementFee: 5, maintenanceProvision: 3,
      insuranceRate: 3, propertyTax: 1.5,
      dcfPeriod: 10, discountRateDefault: 5.5, exitCapDefault: 4.5, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 3, mlvSpecifiqueDefault: 2,
    },
    specificMetricKeys: ["metricPrixM2", "metricLoyerM2Mois", "metricCapitalInvesti"],
    recommendedMethodKeys: ["methodComparaisonDom", "methodCapitalisation", "methodDCFInvest"],
    notesKey: "notesResAppartement",
  },
  {
    id: "residential_house",
    labelKey: "assetResMaison",
    icon: "house",
    defaults: {
      capRateMin: 2.5, capRateMax: 5.0, capRateDefault: 3.5,
      vacancyRate: 2, managementFee: 3, maintenanceProvision: 4,
      insuranceRate: 4, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 5.0, exitCapDefault: 4.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 2,
    },
    specificMetricKeys: ["metricPrixM2Habitable", "metricPrixTerrainM2", "metricSurfaceTerrain"],
    recommendedMethodKeys: ["methodComparaisonDom", "methodCoutRemplacement"],
    notesKey: "notesResMaison",
  },
  {
    id: "residential_building",
    labelKey: "assetImmeubleRapport",
    icon: "building",
    defaults: {
      capRateMin: 3.5, capRateMax: 6.5, capRateDefault: 4.5,
      vacancyRate: 4, managementFee: 6, maintenanceProvision: 4,
      insuranceRate: 3, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 5.5, exitCapDefault: 5.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 3, mlvSpecifiqueDefault: 3,
    },
    specificMetricKeys: ["metricNbLots", "metricLoyerTotalAnnuel", "metricRendementBrutNet", "metricDureeRestanteBaux", "metricVentilationUsage"],
    recommendedMethodKeys: ["methodCapitalisationDom", "methodDCF", "methodComparaisonVerif"],
    notesKey: "notesImmeubleRapport",
  },
  {
    id: "office",
    labelKey: "assetBureaux",
    icon: "office",
    defaults: {
      capRateMin: 4.0, capRateMax: 7.0, capRateDefault: 5.0,
      vacancyRate: 7, managementFee: 5, maintenanceProvision: 5,
      insuranceRate: 5, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 6.5, exitCapDefault: 5.5, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 8, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 3,
    },
    specificMetricKeys: ["metricSurfaceUtileNette", "metricLoyerAfficheReelFranchises", "metricDureeRestanteBaux", "metricTauxOccupation", "metricAvantagesConsentis"],
    recommendedMethodKeys: ["methodDCFDom", "methodCapitalisation", "methodComparaisonVerif"],
    notesKey: "notesBureaux",
  },
  {
    id: "retail",
    labelKey: "assetCommerces",
    icon: "retail",
    defaults: {
      capRateMin: 4.5, capRateMax: 8.0, capRateDefault: 5.5,
      vacancyRate: 5, managementFee: 5, maintenanceProvision: 3,
      insuranceRate: 4, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 7.0, exitCapDefault: 6.0, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 10, mlvCommercialisationDefault: 7, mlvSpecifiqueDefault: 5,
    },
    specificMetricKeys: ["metricSurfaceVente", "metricLoyerM2N1", "metricTauxEffort", "metricFluxPietons", "metricCALocataire"],
    recommendedMethodKeys: ["methodCapitalisation", "methodDCF", "methodComparaisonHighStreet"],
    notesKey: "notesCommerces",
  },
  {
    id: "hotel",
    labelKey: "assetHotellerie",
    icon: "hotel",
    defaults: {
      capRateMin: 5.5, capRateMax: 9.0, capRateDefault: 6.5,
      vacancyRate: 25, managementFee: 3, maintenanceProvision: 4,
      insuranceRate: 6, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 8.0, exitCapDefault: 7.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 10, mlvCommercialisationDefault: 8, mlvSpecifiqueDefault: 5,
    },
    specificMetricKeys: ["metricNbChambres", "metricRevPAR", "metricADR", "metricTauxOccupation", "metricRBE", "metricRACFChambre"],
    recommendedMethodKeys: ["methodDCFDom", "methodCapitalisationEBITDA", "methodPrixChambreVerif"],
    notesKey: "notesHotellerie",
  },
  {
    id: "logistics",
    labelKey: "assetLogistique",
    icon: "logistics",
    defaults: {
      capRateMin: 5.0, capRateMax: 8.0, capRateDefault: 5.5,
      vacancyRate: 5, managementFee: 3, maintenanceProvision: 3,
      insuranceRate: 5, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 7.0, exitCapDefault: 6.0, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 7, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 5,
    },
    specificMetricKeys: ["metricSurfaceUtileM2", "metricHauteurLibre", "metricNbQuais", "metricChargeSol", "metricAccessibilitePL"],
    recommendedMethodKeys: ["methodCapitalisation", "methodDCF", "methodCoutRemplacementSpec"],
    notesKey: "notesLogistique",
  },
  {
    id: "land",
    labelKey: "assetTerrain",
    icon: "land",
    defaults: {
      capRateMin: 0, capRateMax: 0, capRateDefault: 0,
      vacancyRate: 0, managementFee: 0, maintenanceProvision: 0,
      insuranceRate: 0, propertyTax: 1,
      dcfPeriod: 5, discountRateDefault: 8.0, exitCapDefault: 0, indexationDefault: 0,
      mlvConjoncturelleDefault: 15, mlvCommercialisationDefault: 10, mlvSpecifiqueDefault: 5,
    },
    specificMetricKeys: ["metricSurfaceTerrain", "metricCOSCMU", "metricDroitsAConstruire", "metricViabilisation", "metricZonePAG"],
    recommendedMethodKeys: ["methodComparaisonDom", "methodResiduellePromoteur"],
    notesKey: "notesTerrain",
  },
];

export function getAssetTypeConfig(id: AssetType): AssetTypeConfig {
  return ASSET_TYPES.find((a) => a.id === id) || ASSET_TYPES[0];
}
