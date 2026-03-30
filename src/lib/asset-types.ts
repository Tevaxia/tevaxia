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

export const EVS_VALUE_TYPES: { id: EVSValueType; label: string; evs: string; description: string }[] = [
  {
    id: "market_value",
    label: "Valeur de marché",
    evs: "EVS1",
    description: "Le montant estimé auquel un actif ou un passif devrait s'échanger à la date de l'évaluation entre un acheteur consentant et un vendeur consentant, dans une transaction équilibrée, après une commercialisation adéquate, les parties ayant chacune agi en connaissance de cause, prudemment et sans contrainte.",
  },
  {
    id: "market_rent",
    label: "Valeur locative de marché (ERV)",
    evs: "EVS2",
    description: "Le montant estimé auquel un bien immobilier devrait être loué à la date de l'évaluation entre un bailleur consentant et un preneur consentant, aux conditions du marché, après une commercialisation adéquate.",
  },
  {
    id: "mlv",
    label: "Valeur hypothécaire (MLV)",
    evs: "EVS3",
    description: "La valeur du bien telle que déterminée par un évaluateur prudent, tenant compte de la soutenabilité à long terme de la valeur, des conditions normales et locales du marché, de l'utilisation actuelle et des utilisations alternatives appropriées, en excluant tout élément spéculatif. CRR Art. 4(1)(74).",
  },
  {
    id: "investment_value",
    label: "Valeur d'investissement",
    evs: "EVS4",
    description: "La valeur d'un actif pour un investisseur particulier ou une catégorie d'investisseurs, compte tenu de leurs objectifs d'investissement spécifiques. Peut différer de la valeur de marché.",
  },
  {
    id: "fair_value",
    label: "Juste valeur (IFRS 13)",
    evs: "EVS5",
    description: "Le prix qui serait reçu pour la vente d'un actif ou payé pour le transfert d'un passif lors d'une transaction ordonnée entre des intervenants du marché à la date d'évaluation. Concept de 'highest and best use'.",
  },
  {
    id: "equitable_value",
    label: "Valeur équitable",
    evs: "EVS6",
    description: "Le prix estimé pour le transfert d'un actif entre des parties identifiées, bien informées et consentantes, qui reflète les intérêts respectifs de ces parties.",
  },
];

// Types d'actifs immobiliers
export type AssetType =
  | "residential_apartment"
  | "residential_house"
  | "residential_building" // Immeuble de rapport
  | "office"
  | "retail"
  | "hotel"
  | "logistics"
  | "mixed_use"
  | "land";

export interface AssetTypeConfig {
  id: AssetType;
  label: string;
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
  // Métriques spécifiques
  specificMetrics: string[];
  // Méthodes recommandées EVS
  recommendedMethods: string[];
  // Notes contextuelles
  notes: string;
}

export const ASSET_TYPES: AssetTypeConfig[] = [
  {
    id: "residential_apartment",
    label: "Résidentiel — Appartement",
    icon: "apartment",
    defaults: {
      capRateMin: 3.0, capRateMax: 5.5, capRateDefault: 4.0,
      vacancyRate: 3, managementFee: 5, maintenanceProvision: 3,
      insuranceRate: 3, propertyTax: 1.5,
      dcfPeriod: 10, discountRateDefault: 5.5, exitCapDefault: 4.5, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 3, mlvSpecifiqueDefault: 2,
    },
    specificMetrics: ["Prix/m²", "Loyer/m²/mois", "Capital investi (loi 2006)"],
    recommendedMethods: ["Comparaison (dominante)", "Capitalisation", "DCF (si investissement)"],
    notes: "Au Luxembourg, le marché résidentiel est dominé par la méthode par comparaison. Le loyer est plafonné à 5% du capital investi (loi 2006). Taux de vacance historiquement très bas (<3%).",
  },
  {
    id: "residential_house",
    label: "Résidentiel — Maison",
    icon: "house",
    defaults: {
      capRateMin: 2.5, capRateMax: 5.0, capRateDefault: 3.5,
      vacancyRate: 2, managementFee: 3, maintenanceProvision: 4,
      insuranceRate: 4, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 5.0, exitCapDefault: 4.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 2,
    },
    specificMetrics: ["Prix/m² habitable", "Prix terrain /m²", "Surface terrain"],
    recommendedMethods: ["Comparaison (dominante)", "Coût de remplacement (si atypique)"],
    notes: "Données de comparaison limitées au Luxembourg — l'Observatoire de l'Habitat ne publie pas de statistiques détaillées sur les maisons faute de données cadastrales suffisantes. Délai de commercialisation plus long que les appartements.",
  },
  {
    id: "residential_building",
    label: "Immeuble de rapport",
    icon: "building",
    defaults: {
      capRateMin: 3.5, capRateMax: 6.0, capRateDefault: 4.5,
      vacancyRate: 4, managementFee: 6, maintenanceProvision: 4,
      insuranceRate: 3, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 5.5, exitCapDefault: 5.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 5, mlvCommercialisationDefault: 3, mlvSpecifiqueDefault: 3,
    },
    specificMetrics: ["Nb logements", "Loyer total annuel", "Rendement brut/net", "WAULT (si baux en cours)"],
    recommendedMethods: ["Capitalisation (dominante)", "DCF", "Comparaison (vérification)"],
    notes: "L'immeuble de rapport se valorise principalement par le rendement. Analyser chaque lot : loyer en place vs ERV (loyer de marché), durée restante des baux, potentiel de réversion. Le plafond des 5% s'applique lot par lot.",
  },
  {
    id: "office",
    label: "Bureaux",
    icon: "office",
    defaults: {
      capRateMin: 4.0, capRateMax: 7.0, capRateDefault: 5.0,
      vacancyRate: 7, managementFee: 5, maintenanceProvision: 5,
      insuranceRate: 5, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 6.5, exitCapDefault: 5.5, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 8, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 3,
    },
    specificMetrics: ["Surface utile nette (SUN)", "Loyer facial vs effectif", "WAULT", "Taux d'occupation", "Incentives (mois gratuits)"],
    recommendedMethods: ["DCF (dominante)", "Capitalisation", "Comparaison (vérification)"],
    notes: "Luxembourg-Ville : marché de bureaux mature avec segmentation CBD / Kirchberg / Cloche d'Or / Gare. Prime rents ~50-55 €/m²/mois au Kirchberg. Vacance structurelle ~5-7%. Analyser les incentives (franchise de loyer, aménagements) qui réduisent le loyer effectif vs facial. Baux commerciaux 3/6/9 ou fermes.",
  },
  {
    id: "retail",
    label: "Commerces",
    icon: "retail",
    defaults: {
      capRateMin: 4.5, capRateMax: 8.0, capRateDefault: 5.5,
      vacancyRate: 5, managementFee: 5, maintenanceProvision: 3,
      insuranceRate: 4, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 7.0, exitCapDefault: 6.0, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 10, mlvCommercialisationDefault: 7, mlvSpecifiqueDefault: 5,
    },
    specificMetrics: ["Surface de vente (GLA)", "Loyer /m² Zone A", "Taux d'effort locataire", "Flux piétons", "Chiffre d'affaires locataire"],
    recommendedMethods: ["Capitalisation", "DCF", "Comparaison (high street uniquement)"],
    notes: "Distinguer high street (Grand-Rue, avenue de la Gare) des retail parks et centres commerciaux. Le loyer en Zone A est la référence pour la comparaison. Risque structurel e-commerce sur certains segments. Analyser le taux d'effort du locataire (loyer / CA) — au-delà de 8-10%, risque de non-renouvellement.",
  },
  {
    id: "hotel",
    label: "Hôtellerie",
    icon: "hotel",
    defaults: {
      capRateMin: 5.5, capRateMax: 9.0, capRateDefault: 6.5,
      vacancyRate: 25, managementFee: 3, maintenanceProvision: 4,
      insuranceRate: 6, propertyTax: 3,
      dcfPeriod: 10, discountRateDefault: 8.0, exitCapDefault: 7.0, indexationDefault: 2.0,
      mlvConjoncturelleDefault: 10, mlvCommercialisationDefault: 8, mlvSpecifiqueDefault: 5,
    },
    specificMetrics: ["Nb chambres", "RevPAR", "ADR", "Taux d'occupation", "GOP / GOPPAR", "EBITDA par chambre"],
    recommendedMethods: ["DCF (dominante)", "Capitalisation sur EBITDA", "Prix par chambre (vérification)"],
    notes: "L'hôtellerie se valorise sur la capacité bénéficiaire (EBITDA stabilisé), pas sur le loyer. Distinguer l'immobilier de l'exploitation (murs vs fonds). Luxembourg : marché institutionnel/affaires avec saisonnalité faible mais occupancy ~70-75%. ADR en hausse. Méthode des profits (EVS) recommandée.",
  },
  {
    id: "logistics",
    label: "Logistique / Industriel",
    icon: "logistics",
    defaults: {
      capRateMin: 5.0, capRateMax: 8.0, capRateDefault: 5.5,
      vacancyRate: 5, managementFee: 3, maintenanceProvision: 3,
      insuranceRate: 5, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 7.0, exitCapDefault: 6.0, indexationDefault: 1.5,
      mlvConjoncturelleDefault: 7, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 5,
    },
    specificMetrics: ["Surface utile (m²)", "Hauteur libre", "Nb quais", "Charge au sol", "Accessibilité PL"],
    recommendedMethods: ["Capitalisation", "DCF", "Coût de remplacement (si spécialisé)"],
    notes: "Luxembourg : stock logistique limité, concentré sur Eurohub Sud (Bettembourg/Dudelange) et zones d'activités. Loyers ~6-9 €/m²/mois. Baux longs (6-9 ans fermes). ESG de plus en plus important (certifications BREEAM, panneaux solaires toiture).",
  },
  {
    id: "mixed_use",
    label: "Mixte (commerces + logements)",
    icon: "mixed",
    defaults: {
      capRateMin: 4.0, capRateMax: 6.5, capRateDefault: 4.8,
      vacancyRate: 4, managementFee: 6, maintenanceProvision: 4,
      insuranceRate: 4, propertyTax: 2,
      dcfPeriod: 10, discountRateDefault: 6.0, exitCapDefault: 5.5, indexationDefault: 1.8,
      mlvConjoncturelleDefault: 7, mlvCommercialisationDefault: 5, mlvSpecifiqueDefault: 3,
    },
    specificMetrics: ["Ventilation surfaces par usage", "Loyers par composante", "Rendement pondéré"],
    recommendedMethods: ["Capitalisation par composante", "DCF", "Comparaison (pour la partie résidentielle)"],
    notes: "Évaluer chaque composante séparément (résidentiel, commercial, parkings) avec ses propres paramètres (cap rate, vacance, ERV), puis additionner. Le cap rate global est la moyenne pondérée par les loyers.",
  },
  {
    id: "land",
    label: "Terrain à bâtir",
    icon: "land",
    defaults: {
      capRateMin: 0, capRateMax: 0, capRateDefault: 0,
      vacancyRate: 0, managementFee: 0, maintenanceProvision: 0,
      insuranceRate: 0, propertyTax: 1,
      dcfPeriod: 5, discountRateDefault: 8.0, exitCapDefault: 0, indexationDefault: 0,
      mlvConjoncturelleDefault: 15, mlvCommercialisationDefault: 10, mlvSpecifiqueDefault: 5,
    },
    specificMetrics: ["Surface terrain", "COS/CMU", "Droits à construire (m² SB)", "Viabilisation", "Zone PAG"],
    recommendedMethods: ["Comparaison (dominante)", "Méthode résiduelle (compte à rebours promoteur)"],
    notes: "Au Luxembourg, rapport de 1 à 6 entre les prix des terrains à Luxembourg-Ville et le nord du pays. Vérifier le PAG/PAP : zone constructible, COS, servitudes CTV/CTL (délais de viabilisation/construction). La méthode résiduelle du promoteur déduit la valeur du terrain du prix de vente des logements construits, diminué des coûts de construction et de la marge.",
  },
];

export function getAssetTypeConfig(id: AssetType): AssetTypeConfig {
  return ASSET_TYPES.find((a) => a.id === id) || ASSET_TYPES[0];
}
