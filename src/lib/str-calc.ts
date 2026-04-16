/**
 * Short-Term Rental (STR) — calculs de rentabilité, conformité et arbitrage
 * Spécificités Luxembourg.
 */

// ── Seuils réglementaires LU ───────────────────────────────────
export const STR_LICENSE_THRESHOLD_DAYS = 90; // > 3 mois cumulés/an = licence hébergement requise (art. 6 loi 17.07.2020)
export const STR_TAX_THRESHOLD_EUR = 600; // revenu > 600 €/an = déclaration IR
export const STR_MAX_MARGINAL_TAX_RATE = 0.4578; // 42% IR × 1,09 contribution emploi

// ── Commission OTA standard ───────────────────────────────────
export const OTA_COMMISSION: Record<string, number> = {
  airbnb: 0.15,
  booking: 0.17,
  vrbo: 0.08,
  direct: 0,
};

// ── Coûts variables par séjour (LU, approx 2026) ──────────────
export interface StrVariableCosts {
  cleaningPerStay: number; // €/séjour (ménage + linge)
  linenPerStay: number; // €/séjour (si location linge)
  consumablesPerStay: number; // €/séjour (café, savon, gel douche)
  avgStayLengthDays: number; // durée moyenne d'un séjour
}

export const STR_DEFAULT_COSTS: StrVariableCosts = {
  cleaningPerStay: 45,
  linenPerStay: 20,
  consumablesPerStay: 8,
  avgStayLengthDays: 3,
};

// ── Charges fixes annuelles ───────────────────────────────────
export interface StrFixedCosts {
  pnoInsuranceAnnual: number; // PNO courte durée majorée (~2× PNO classique)
  internetTvAnnual: number;
  utilitiesAnnual: number; // eau + électricité payées par l'hôte
  furnitureAmortAnnual: number; // amortissement mobilier/déco
  subscriptionFees: number; // Guesty/Hostaway/PriceLabs etc
}

// ── Input et output pour rentabilité STR ───────────────────────
export interface StrRentabiliteInputs {
  commune: string;
  surface: number;
  capacity: number; // nombre de voyageurs max
  adr: number; // Average Daily Rate en €
  occupancyPct: number; // taux d'occupation annuel 0-100
  nightsPerYear: number; // nuits louées / an (calculé ou imposé)
  otaChannel: "airbnb" | "booking" | "vrbo" | "direct";
  otaCommissionOverride?: number; // si différent du défaut
  variable: StrVariableCosts;
  fixed: StrFixedCosts;
  acquisitionPrice?: number; // si connu, calcule le yield
  userMarginalTaxRate: number; // taux marginal d'IR 0-0.4578
  vacancyDaysBetween: number; // nb jours vides entre 2 séjours
}

export interface StrRentabiliteResult {
  // Revenus
  grossRevenue: number;
  otaCommission: number;
  revenueAfterOta: number;
  // Charges
  cleaningTotal: number;
  linenTotal: number;
  consumablesTotal: number;
  variableTotal: number;
  fixedTotal: number;
  operatingCharges: number;
  // Résultat
  netBeforeTax: number;
  estimatedTax: number;
  netAfterTax: number;
  // Ratios
  grossYieldPct?: number;
  netYieldPct?: number;
  costRatioPct: number;
  // Métriques opérationnelles
  numberOfStays: number;
  revPAR: number; // revenu/jour disponible (365j)
  adrEffective: number; // ADR net après commissions OTA
}

export function calculerRentabiliteSTR(i: StrRentabiliteInputs): StrRentabiliteResult {
  const nights = Math.min(i.nightsPerYear, 365);
  const grossRevenue = Math.round(i.adr * nights);

  // Commission OTA
  const otaRate = i.otaCommissionOverride ?? OTA_COMMISSION[i.otaChannel] ?? 0;
  const otaCommission = Math.round(grossRevenue * otaRate);
  const revenueAfterOta = grossRevenue - otaCommission;

  // Nombre de séjours (estimation)
  const totalCycleDays = i.variable.avgStayLengthDays + Math.max(0, i.vacancyDaysBetween);
  const numberOfStays = totalCycleDays > 0 ? Math.ceil(nights / i.variable.avgStayLengthDays) : 0;

  // Charges variables
  const cleaningTotal = Math.round(i.variable.cleaningPerStay * numberOfStays);
  const linenTotal = Math.round(i.variable.linenPerStay * numberOfStays);
  const consumablesTotal = Math.round(i.variable.consumablesPerStay * numberOfStays);
  const variableTotal = cleaningTotal + linenTotal + consumablesTotal;

  // Charges fixes
  const fixedTotal = Math.round(
    i.fixed.pnoInsuranceAnnual + i.fixed.internetTvAnnual
    + i.fixed.utilitiesAnnual + i.fixed.furnitureAmortAnnual
    + i.fixed.subscriptionFees,
  );

  const operatingCharges = variableTotal + fixedTotal;
  const netBeforeTax = revenueAfterOta - operatingCharges;

  // Impôt (simplification : marginal × net)
  const estimatedTax = Math.max(0, Math.round(netBeforeTax * i.userMarginalTaxRate));
  const netAfterTax = netBeforeTax - estimatedTax;

  // Yields
  const grossYieldPct = i.acquisitionPrice && i.acquisitionPrice > 0
    ? (grossRevenue / i.acquisitionPrice) * 100
    : undefined;
  const netYieldPct = i.acquisitionPrice && i.acquisitionPrice > 0
    ? (netAfterTax / i.acquisitionPrice) * 100
    : undefined;

  const costRatioPct = grossRevenue > 0 ? (operatingCharges + otaCommission) / grossRevenue * 100 : 0;
  const revPAR = grossRevenue / 365;
  const adrEffective = nights > 0 ? revenueAfterOta / nights : 0;

  return {
    grossRevenue,
    otaCommission,
    revenueAfterOta,
    cleaningTotal,
    linenTotal,
    consumablesTotal,
    variableTotal,
    fixedTotal,
    operatingCharges,
    netBeforeTax,
    estimatedTax,
    netAfterTax,
    grossYieldPct,
    netYieldPct,
    costRatioPct,
    numberOfStays,
    revPAR,
    adrEffective,
  };
}

// ── Arbitrage long terme vs STR ────────────────────────────────
export interface StrArbitrageInputs {
  strNet: number; // net après impôt STR
  ltMonthlyRent: number; // loyer mensuel long terme
  ltMarginalTaxRate: number;
  ltDeductibleChargesAnnual: number; // intérêts emprunt, assurance, charges copro, taxe foncière, entretien
  mixedStrDays: number; // nb jours STR dans scénario mixte (0-90)
  mixedLtMonths: number; // nb mois LT dans scénario mixte
}

export interface StrArbitrageResult {
  scenarioLT: { grossAnnual: number; tax: number; netAnnual: number };
  scenarioSTR: { netAnnual: number };
  scenarioMixed: { strNet: number; ltNet: number; totalNet: number };
  recommendation: "lt" | "str" | "mixed";
  deltaBestVsWorst: number;
}

export function calculerArbitrageSTR(i: StrArbitrageInputs): StrArbitrageResult {
  // LT pur (12 mois)
  const ltGross = i.ltMonthlyRent * 12;
  const ltTaxable = Math.max(0, ltGross - i.ltDeductibleChargesAnnual);
  const ltTax = Math.round(ltTaxable * i.ltMarginalTaxRate);
  const ltNet = ltGross - ltTax;

  // STR pur (réutilise le net déjà calculé en amont)
  const strNet = i.strNet;

  // Mixte (STR partiel + LT partiel)
  const strPortion = i.mixedStrDays > 0 ? Math.round(strNet * (i.mixedStrDays / 365)) : 0;
  const ltPortion = i.mixedLtMonths > 0 ? Math.round(ltNet * (i.mixedLtMonths / 12)) : 0;
  const mixedTotal = strPortion + ltPortion;

  // Recommandation = scénario max
  const best = Math.max(ltNet, strNet, mixedTotal);
  const worst = Math.min(ltNet, strNet, mixedTotal);
  const recommendation: "lt" | "str" | "mixed"
    = best === ltNet ? "lt" : best === strNet ? "str" : "mixed";

  return {
    scenarioLT: { grossAnnual: ltGross, tax: ltTax, netAnnual: ltNet },
    scenarioSTR: { netAnnual: strNet },
    scenarioMixed: { strNet: strPortion, ltNet: ltPortion, totalNet: mixedTotal },
    recommendation,
    deltaBestVsWorst: best - worst,
  };
}

// ── Compliance checker ─────────────────────────────────────────
export interface StrComplianceInputs {
  nightsPlannedPerYear: number;
  commune: string;
  isPrimaryResidence: boolean;
  ownerType: "particulier" | "societe" | "non_resident";
  annualRevenueEstimated: number;
}

export interface StrComplianceResult {
  requiresLicense: boolean;
  licenseThresholdMargin: number; // jours avant seuil 90
  requiresTaxDeclaration: boolean;
  communeRegulationRisk: "low" | "medium" | "high";
  euRegulationCompliance: {
    registrationRequired: boolean;
    dataTransmissionRequired: boolean;
    effectiveDate: string;
  };
  actions: string[];
}

// Communes avec restrictions connues ou supposées (à raffiner avec règlements communaux réels)
const HIGH_REGULATION_COMMUNES = ["luxembourg", "esch-sur-alzette", "differdange", "dudelange"];
const MEDIUM_REGULATION_COMMUNES = ["strassen", "bertrange", "mamer", "sandweiler"];

export function checkSTRCompliance(i: StrComplianceInputs): StrComplianceResult {
  const communeNorm = i.commune.toLowerCase().trim();
  const requiresLicense = i.nightsPlannedPerYear > STR_LICENSE_THRESHOLD_DAYS;
  const licenseThresholdMargin = STR_LICENSE_THRESHOLD_DAYS - i.nightsPlannedPerYear;

  const communeRegulationRisk: "low" | "medium" | "high" =
    HIGH_REGULATION_COMMUNES.includes(communeNorm) ? "high"
    : MEDIUM_REGULATION_COMMUNES.includes(communeNorm) ? "medium"
    : "low";

  const actions: string[] = [];
  if (requiresLicense) {
    actions.push("Demander une licence d'hébergement (Ministère du Tourisme / commune)");
  }
  if (i.annualRevenueEstimated > STR_TAX_THRESHOLD_EUR) {
    actions.push("Déclarer le revenu au titre de l'impôt sur le revenu (IR, formulaire 100)");
  }
  if (communeRegulationRisk === "high") {
    actions.push("Vérifier règlement communal (Luxembourg-Ville notamment impose des restrictions)");
  }
  actions.push("S'enregistrer au registre EU des locations de courte durée (obligation EU Regulation 2024/1028, mi-2026)");
  actions.push("Souscrire une assurance PNO courte durée (RC locative + dommages voyageurs)");
  if (i.ownerType === "societe") {
    actions.push("Vérifier TVA (exonérée si logement meublé touristique ? à valider avec expert-comptable LU)");
  }

  return {
    requiresLicense,
    licenseThresholdMargin,
    requiresTaxDeclaration: i.annualRevenueEstimated > STR_TAX_THRESHOLD_EUR,
    communeRegulationRisk,
    euRegulationCompliance: {
      registrationRequired: true,
      dataTransmissionRequired: true,
      effectiveDate: "mi-2026",
    },
    actions,
  };
}
