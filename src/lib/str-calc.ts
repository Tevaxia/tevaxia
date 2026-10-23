/**
 * Short-Term Rental (STR) — calculs de rentabilité, conformité et arbitrage
 * Spécificités Luxembourg.
 */

// ── Seuils réglementaires LU ───────────────────────────────────
// Guichet.lu, exploitant d'un établissement d'hébergement, checked 2026-10-23:
// at least 90 nights, across ALL units of an operator, over one year from the last rental.
export const STR_LICENSE_THRESHOLD_DAYS = 90;
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
  availableDays?: number; // STR calendar allocation, including vacancies; defaults to 365
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
  effectiveNights: number;
  calendarDaysUsed: number;
  calendarLimited: boolean;
  revPAR: number; // revenu/jour disponible (365j)
  adrEffective: number; // ADR net après commissions OTA
}

export function calculerRentabiliteSTR(i: StrRentabiliteInputs): StrRentabiliteResult {
  const availableDays = i.availableDays ?? 365;
  for (const value of [i.adr, i.nightsPerYear, i.vacancyDaysBetween, availableDays,
    ...Object.values(i.variable), ...Object.values(i.fixed)]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError("STR inputs must be finite and non-negative");
  }
  if (i.variable.avgStayLengthDays <= 0 || availableDays > 365) throw new RangeError("Invalid STR stay length or calendar");
  const otaRate = i.otaCommissionOverride ?? OTA_COMMISSION[i.otaChannel];
  for (const rate of [otaRate, i.userMarginalTaxRate]) {
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) throw new RangeError("Invalid STR rate");
  }
  if (i.acquisitionPrice !== undefined && (!Number.isFinite(i.acquisitionPrice) || i.acquisitionPrice < 0)) throw new RangeError("Invalid acquisition price");
  // Requested nights are a demand target. Cap it to a feasible schedule, retaining
  // the final partial stay and no artificial vacancy after the last stay.
  let nights = Math.floor(Math.min(i.nightsPerYear, availableDays));
  const calendarDays = (n: number) => n + Math.max(0, Math.ceil(n / i.variable.avgStayLengthDays) - 1) * i.vacancyDaysBetween;
  while (nights > 0 && calendarDays(nights) > availableDays) nights--;
  const numberOfStays = Math.ceil(nights / i.variable.avgStayLengthDays);
  const grossRevenue = Math.round(i.adr * nights);

  // Commission OTA
  const otaCommission = Math.round(grossRevenue * otaRate);
  const revenueAfterOta = grossRevenue - otaCommission;

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
    effectiveNights: nights,
    calendarDaysUsed: calendarDays(nights),
    calendarLimited: nights < i.nightsPerYear,
    revPAR,
    adrEffective,
  };
}

// ── Arbitrage long terme vs STR ────────────────────────────────
export interface StrArbitrageInputs {
  strInputs: StrRentabiliteInputs;
  ltMonthlyRent: number; // loyer mensuel long terme
  ltMarginalTaxRate: number;
  ltDeductibleChargesAnnual: number; // intérêts emprunt, assurance, charges copro, taxe foncière, entretien
  mixedStrDays: number; // days AVAILABLE for STR, including vacant nights
  mixedLtMonths: number; // nb mois LT dans scénario mixte
}

export interface StrArbitrageResult {
  scenarioLT: { grossAnnual: number; charges: number; tax: number; netAnnual: number };
  scenarioSTR: { netAnnual: number };
  scenarioMixed: { strNet: number; ltNet: number; totalNet: number; effectiveStrNights: number };
  recommendation: "lt" | "str" | "mixed";
  deltaBestVsWorst: number;
}

export function calculerArbitrageSTR(i: StrArbitrageInputs): StrArbitrageResult {
  for (const value of [i.ltMonthlyRent, i.ltDeductibleChargesAnnual, i.mixedStrDays, i.mixedLtMonths, i.ltMarginalTaxRate]) {
    if (!Number.isFinite(value) || value < 0) throw new RangeError("Invalid STR arbitrage input");
  }
  if (i.ltMarginalTaxRate > 1 || i.mixedStrDays + i.mixedLtMonths * 365 / 12 > 365 + 1e-8) throw new RangeError("Mixed allocations exceed one year");
  if (!Number.isFinite(i.strInputs.occupancyPct) || i.strInputs.occupancyPct < 0 || i.strInputs.occupancyPct > 100) throw new RangeError("Invalid occupancy rate");
  // LT pur (12 mois)
  const ltGross = i.ltMonthlyRent * 12;
  const ltTaxable = Math.max(0, ltGross - i.ltDeductibleChargesAnnual);
  const ltTax = Math.round(ltTaxable * i.ltMarginalTaxRate);
  const ltNet = ltGross - i.ltDeductibleChargesAnnual - ltTax;

  // STR pur (réutilise le net déjà calculé en amont)
  const strNet = calculerRentabiliteSTR({ ...i.strInputs, availableDays: 365 }).netAfterTax;

  // Mixte (STR partiel + LT partiel)
  // Recompute nights, turnovers and taxes. Annual fixed costs are kept in full
  // for every active letting mode; callers must avoid entering a shared cost twice.
  const mixedStr = i.mixedStrDays > 0 ? calculerRentabiliteSTR({ ...i.strInputs,
    availableDays: i.mixedStrDays,
    nightsPerYear: Math.floor(i.mixedStrDays * i.strInputs.occupancyPct / 100),
  }) : null;
  const strPortion = mixedStr?.netAfterTax ?? 0;
  const mixedLtGross = i.ltMonthlyRent * i.mixedLtMonths;
  const mixedLtBeforeTax = mixedLtGross - (i.mixedLtMonths > 0 ? i.ltDeductibleChargesAnnual : 0);
  const ltPortion = Math.round(mixedLtBeforeTax - Math.max(0, mixedLtBeforeTax * i.ltMarginalTaxRate));
  const mixedTotal = strPortion + ltPortion;

  // Recommandation = scénario max
  const best = Math.max(ltNet, strNet, mixedTotal);
  const worst = Math.min(ltNet, strNet, mixedTotal);
  const recommendation: "lt" | "str" | "mixed"
    = best === ltNet ? "lt" : best === strNet ? "str" : "mixed";

  return {
    scenarioLT: { grossAnnual: ltGross, charges: i.ltDeductibleChargesAnnual, tax: ltTax, netAnnual: ltNet },
    scenarioSTR: { netAnnual: strNet },
    scenarioMixed: { strNet: strPortion, ltNet: ltPortion, totalNet: mixedTotal, effectiveStrNights: mixedStr?.effectiveNights ?? 0 },
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
  licenseThresholdMargin: number;
  requiresTaxDeclaration: null; // cannot infer household filing obligations from gross receipts
  communeRegulationRisk: "unverified";
  euRegulationCompliance: {
    registrationRequired: null; // depends on a competent authority's registration procedure
    dataTransmissionRequired: null;
    effectiveDate: string;
  };
  actions: string[]; // translation keys in strCompliance.actionItems
}

export function checkSTRCompliance(i: StrComplianceInputs): StrComplianceResult {
  if (!Number.isFinite(i.nightsPlannedPerYear) || i.nightsPlannedPerYear < 0
    || !Number.isFinite(i.annualRevenueEstimated) || i.annualRevenueEstimated < 0) {
    throw new RangeError("Invalid STR compliance input");
  }
  // The form requests operator-wide totals, not a single property's annual occupancy.
  const requiresLicense = i.nightsPlannedPerYear >= STR_LICENSE_THRESHOLD_DAYS;
  const actions = ["operatorTotal", "localRules", "tax", "registration", "insurance"];
  if (requiresLicense) actions.unshift("license");
  if (i.ownerType === "societe") actions.push("vat");
  return {
    requiresLicense,
    licenseThresholdMargin: STR_LICENSE_THRESHOLD_DAYS - i.nightsPlannedPerYear,
    requiresTaxDeclaration: null,
    communeRegulationRisk: "unverified",
    euRegulationCompliance: {
      registrationRequired: null,
      dataTransmissionRequired: null,
      effectiveDate: "2026-05-20",
    },
    actions,
  };
}
