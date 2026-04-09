/**
 * Rental Yield Calculation Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Calculate gross rental yield.
 *
 * @param {number} annualRent - Annual gross rent
 * @param {number} purchasePrice - Property purchase price
 * @returns {number} Gross yield as decimal (e.g., 0.055 for 5.5%)
 */
export function calculateGrossYield(annualRent, purchasePrice) {
  if (purchasePrice <= 0 || annualRent <= 0) return 0;
  return annualRent / purchasePrice;
}

/**
 * Calculate net rental yield (before tax).
 *
 * @param {Object} params
 * @param {number} params.annualRent - Annual gross rent
 * @param {number} params.purchasePrice - Property purchase price
 * @param {number} params.monthlyCharges - Monthly condo/maintenance charges
 * @param {number} params.annualPropertyTax - Annual property tax (taxe foncière, Grundsteuer, IBI, etc.)
 * @param {number} params.annualInsurance - Annual landlord insurance (PNO)
 * @param {number} params.vacancyRate - Vacancy rate as decimal (e.g., 0.05 for 5%)
 * @param {number} params.managementRate - Management fee as % of rent (e.g., 0.08 for 8%)
 * @param {number} params.annualMaintenance - Annual maintenance/repairs budget
 * @returns {Object} { grossYield, netRent, netYield, expenses }
 */
export function calculateNetYield(params) {
  const {
    annualRent,
    purchasePrice,
    monthlyCharges = 0,
    annualPropertyTax = 0,
    annualInsurance = 0,
    vacancyRate = 0,
    managementRate = 0,
    annualMaintenance = 0,
  } = params;

  if (purchasePrice <= 0 || annualRent <= 0) {
    return {
      grossYield: 0,
      effectiveRent: 0,
      totalExpenses: 0,
      netRent: 0,
      netYield: 0,
      expenses: {},
    };
  }

  const grossYield = annualRent / purchasePrice;

  // Effective rent after vacancy
  const vacancyLoss = annualRent * vacancyRate;
  const effectiveRent = annualRent - vacancyLoss;

  // Expenses
  const chargesAnnual = monthlyCharges * 12;
  const managementFees = effectiveRent * managementRate;

  const totalExpenses =
    chargesAnnual +
    annualPropertyTax +
    annualInsurance +
    managementFees +
    annualMaintenance +
    vacancyLoss;

  const netRent = annualRent - totalExpenses;
  const netYield = netRent / purchasePrice;

  return {
    grossYield: Math.round(grossYield * 10000) / 10000,
    effectiveRent: Math.round(effectiveRent * 100) / 100,
    totalExpenses: Math.round(totalExpenses * 100) / 100,
    netRent: Math.round(netRent * 100) / 100,
    netYield: Math.round(netYield * 10000) / 10000,
    expenses: {
      vacancy: Math.round(vacancyLoss * 100) / 100,
      charges: Math.round(chargesAnnual * 100) / 100,
      propertyTax: Math.round(annualPropertyTax * 100) / 100,
      insurance: Math.round(annualInsurance * 100) / 100,
      management: Math.round(managementFees * 100) / 100,
      maintenance: Math.round(annualMaintenance * 100) / 100,
    },
  };
}

/**
 * Apply a simplified tax regime to compute after-tax return.
 *
 * Supports common European patterns:
 * - flat: fixed rate on gross/net
 * - deduction: percentage deduction then progressive rates
 * - progressive: apply income tax brackets to net rental income
 * - socialCharges: additional flat charge on taxable income
 *
 * @param {Object} params
 * @param {number} params.netRent - Net rent before income tax
 * @param {string} params.countryCode
 * @param {string} params.taxRegime - Regime code from country JSON
 * @param {number} params.marginalRate - User's marginal income tax rate (decimal)
 * @param {number} params.socialChargesRate - Social contributions rate (decimal)
 * @param {Object} params.countryData - Full country data JSON
 * @returns {Object} { taxableIncome, incomeTax, socialCharges, totalTax, netAfterTax, netNetYield }
 */
export function calculateTaxImpact(params) {
  const {
    netRent,
    purchasePrice,
    annualRent,
    countryCode,
    taxRegime,
    marginalRate = 0.30,
    socialChargesRate = 0,
    countryData,
    annualMortgageInterest = 0,
    annualDepreciation = 0,
  } = params;

  if (netRent <= 0 || !countryData) {
    return {
      taxableIncome: 0,
      depreciation: 0,
      mortgageInterestDeduction: 0,
      incomeTax: 0,
      socialCharges: 0,
      totalTax: 0,
      netAfterTax: netRent,
      netNetYield: purchasePrice > 0 ? netRent / purchasePrice : 0,
    };
  }

  const regimes = countryData.rentalTax?.regimes || [];
  const regime = regimes.find((r) => r.code === taxRegime) || regimes[0];

  let taxableIncome = netRent;
  let incomeTax = 0;
  let depreciationUsed = 0;
  let interestDeduction = 0;

  if (regime) {
    // Flat rate regimes (IT cedolare secca, PT flat 28%, ES IRNR, NL Box 3)
    // No deductions allowed under flat rate.
    if (regime.flatRate) {
      taxableIncome = netRent;
      incomeTax = taxableIncome * regime.flatRate;
    }
    // Deduction-based simplified regimes (FR micro-foncier, micro-BIC)
    // Standard deduction replaces actual expenses — no depreciation/interest.
    else if (regime.deductionRate != null) {
      taxableIncome = annualRent * (1 - regime.deductionRate);
      incomeTax = taxableIncome * marginalRate;
    }
    // Progressive / real regime — depreciation + mortgage interest deductible
    else {
      // Apply depreciation deduction (US 27.5y, DE AfA, FR réel LMNP, LU)
      depreciationUsed = annualDepreciation;

      // Apply mortgage interest deduction
      // UK: not deductible since 2020 (20% tax credit instead)
      if (countryCode === 'uk') {
        // Section 24: 20% tax credit on interest, not a deduction
        interestDeduction = 0;
      } else {
        // US, DE, FR (réel), LU, BE, ES, PT, IT (IRPEF): interest is deductible
        interestDeduction = annualMortgageInterest;
      }

      taxableIncome = Math.max(0, netRent - depreciationUsed - interestDeduction);
      incomeTax = taxableIncome * marginalRate;

      // UK: add 20% tax credit on mortgage interest
      if (countryCode === 'uk' && annualMortgageInterest > 0) {
        incomeTax = Math.max(0, incomeTax - annualMortgageInterest * 0.20);
      }

      // ES residents: 50% reduction on net rental income (Ley de Vivienda up to 90%)
      if (countryCode === 'es' && regime.reductionRate) {
        incomeTax = incomeTax * (1 - regime.reductionRate);
      }
    }
  }

  const socialCharges = taxableIncome * socialChargesRate;
  const totalTax = Math.max(0, incomeTax + socialCharges);
  const netAfterTax = netRent - totalTax;
  const netNetYield = purchasePrice > 0 ? netAfterTax / purchasePrice : 0;

  return {
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    depreciation: Math.round(depreciationUsed * 100) / 100,
    mortgageInterestDeduction: Math.round(interestDeduction * 100) / 100,
    incomeTax: Math.round(incomeTax * 100) / 100,
    socialCharges: Math.round(socialCharges * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
    netAfterTax: Math.round(netAfterTax * 100) / 100,
    netNetYield: Math.round(netNetYield * 10000) / 10000,
  };
}

/**
 * Calculate cash-on-cash return when the property is financed.
 *
 * @param {number} netAfterTax - Annual net income after all taxes
 * @param {number} annualMortgageCost - Annual mortgage payments (P+I)
 * @param {number} totalCashInvested - Down payment + acquisition fees
 * @returns {number} Cash-on-cash return as decimal
 */
export function calculateCashOnCash(netAfterTax, annualMortgageCost, totalCashInvested) {
  if (totalCashInvested <= 0) return 0;
  const cashFlow = netAfterTax - annualMortgageCost;
  return Math.round((cashFlow / totalCashInvested) * 10000) / 10000;
}
