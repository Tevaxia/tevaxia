/**
 * Investor Cash-Flow Calculation Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Calculate investor cash-flow analysis.
 *
 * @param {Object} params
 * @param {number} params.propertyPrice - Purchase price
 * @param {number} params.acquisitionFees - Total acquisition fees
 * @param {number} params.downPayment - Cash down payment
 * @param {number} params.annualRate - Mortgage annual interest rate (decimal)
 * @param {number} params.loanDurationYears - Mortgage duration in years
 * @param {number} params.monthlyRent - Monthly rental income
 * @param {number} params.vacancyRate - Annual vacancy rate (decimal)
 * @param {number} params.monthlyCharges - Monthly condo / management charges
 * @param {number} params.annualPropertyTax - Annual property tax
 * @param {number} params.annualInsurance - Annual landlord insurance
 * @param {number} params.managementRate - Management fee as % of rent (decimal)
 * @param {number} params.annualMaintenance - Annual maintenance budget
 * @param {number} params.marginalTaxRate - Marginal income tax rate (decimal)
 * @param {number} params.socialChargesRate - Social charges rate (decimal)
 * @param {number} params.annualAppreciation - Annual property appreciation (decimal)
 * @returns {Object}
 */
export function calculateInvestorCashFlow(params) {
  const {
    propertyPrice,
    acquisitionFees = 0,
    downPayment,
    annualRate,
    loanDurationYears,
    monthlyRent,
    vacancyRate = 0,
    monthlyCharges = 0,
    annualPropertyTax = 0,
    annualInsurance = 0,
    managementRate = 0,
    annualMaintenance = 0,
    marginalTaxRate = 0.30,
    socialChargesRate = 0,
    annualAppreciation = 0.02,
    countryCode = '',
    countryData = null,
  } = params;

  const totalInvestment = propertyPrice + acquisitionFees;
  const loanAmount = totalInvestment - downPayment;
  const loanDurationMonths = loanDurationYears * 12;
  const cashInvested = downPayment;

  // Monthly mortgage
  let monthlyMortgage = 0;
  if (loanAmount > 0 && loanDurationMonths > 0) {
    if (annualRate === 0) {
      monthlyMortgage = loanAmount / loanDurationMonths;
    } else {
      const r = annualRate / 12;
      const c = Math.pow(1 + r, loanDurationMonths);
      monthlyMortgage = loanAmount * (r * c) / (c - 1);
    }
  }

  // Annual income
  const grossAnnualRent = monthlyRent * 12;
  const vacancyLoss = grossAnnualRent * vacancyRate;
  const effectiveRent = grossAnnualRent - vacancyLoss;

  // Annual expenses
  const managementFees = effectiveRent * managementRate;
  const totalAnnualExpenses =
    monthlyCharges * 12 +
    annualPropertyTax +
    annualInsurance +
    managementFees +
    annualMaintenance;

  // Net operating income (NOI)
  const noi = effectiveRent - totalAnnualExpenses;

  // Annual mortgage
  const annualMortgage = monthlyMortgage * 12;

  // Annual interest (first year approximation)
  const annualInterest = loanAmount * annualRate;
  const annualPrincipal = annualMortgage - annualInterest;

  // Depreciation: non-cash deduction that reduces taxable income
  // Building value is typically ~80% of property price (land is not depreciable)
  const buildingRatio = 0.80;
  const buildingValue = propertyPrice * buildingRatio;
  let depreciationYears = 0;

  // Country-specific depreciation rules
  const depreciation = countryData?.rentalTax?.depreciation;
  const regimes = countryData?.rentalTax?.regimes || [];
  if (depreciation) {
    // DE: AfA rules
    depreciationYears = depreciation.post1925?.years || depreciation.standard?.years || 50;
  } else if (regimes.some((r) => r.depreciationYears)) {
    // US: 27.5 years
    depreciationYears = regimes.find((r) => r.depreciationYears)?.depreciationYears || 0;
  }

  const annualDepreciation = depreciationYears > 0 ? buildingValue / depreciationYears : 0;

  // Cash-flow before tax
  const cashFlowBeforeTax = noi - annualMortgage;

  // Tax calculation with depreciation + interest deductions
  // Taxable income = NOI - depreciation - mortgage interest (for most countries)
  // Depreciation reduces TAX, not actual cash flow
  let taxableIncome;
  if (countryCode === 'uk') {
    // UK: interest not deductible (20% tax credit instead)
    taxableIncome = Math.max(0, noi - annualDepreciation);
  } else {
    // US, DE, FR, LU, ES, PT, IT, BE, NL: interest + depreciation deductible
    taxableIncome = Math.max(0, noi - annualDepreciation - annualInterest);
  }

  let incomeTax = Math.max(0, taxableIncome * marginalTaxRate);

  // UK: 20% tax credit on mortgage interest (Section 24)
  if (countryCode === 'uk' && annualInterest > 0) {
    incomeTax = Math.max(0, incomeTax - annualInterest * 0.20);
  }

  const socialCharges = Math.max(0, taxableIncome * socialChargesRate);
  const totalTax = incomeTax + socialCharges;

  // Cash-flow after tax (depreciation is non-cash, so NOT subtracted from cash flow)
  const cashFlowAfterTax = cashFlowBeforeTax - totalTax;

  // Returns
  const grossYield = propertyPrice > 0 ? grossAnnualRent / propertyPrice : 0;
  const netYield = propertyPrice > 0 ? noi / propertyPrice : 0;
  const cashOnCash = cashInvested > 0 ? cashFlowAfterTax / cashInvested : 0;

  // Leverage effect
  const returnWithoutLeverage = cashInvested > 0 && propertyPrice > 0
    ? (noi - totalTax) / totalInvestment
    : 0;
  const leverageEffect = cashOnCash - returnWithoutLeverage;

  // 10-year projection
  const projection = [];
  let projPropertyValue = propertyPrice;
  let projRemainingLoan = loanAmount;
  let projRent = monthlyRent;
  let cumulativeCashFlow = 0;

  for (let year = 1; year <= Math.min(20, loanDurationYears + 5); year++) {
    projPropertyValue *= (1 + annualAppreciation);
    projRent *= 1.02; // assume 2% rent indexation

    const yearRent = projRent * 12 * (1 - vacancyRate);
    const yearExpenses = totalAnnualExpenses * Math.pow(1.02, year - 1);
    const yearNOI = yearRent - yearExpenses;
    const yearMortgage = year <= loanDurationYears ? annualMortgage : 0;

    // Principal paydown
    if (year <= loanDurationYears && projRemainingLoan > 0) {
      const yearInterest = projRemainingLoan * annualRate;
      projRemainingLoan -= (yearMortgage - yearInterest);
      projRemainingLoan = Math.max(0, projRemainingLoan);
    }

    // Tax with depreciation deduction (depreciation reduces taxable income, not cash flow)
    const yearInterestForTax = projRemainingLoan > 0 ? projRemainingLoan * annualRate : 0;
    const yearTaxableIncome = Math.max(0, yearNOI - annualDepreciation - (countryCode === 'uk' ? 0 : yearInterestForTax));
    const yearTax = yearTaxableIncome * (marginalTaxRate + socialChargesRate);
    const yearCashFlow = yearNOI - yearMortgage - yearTax;
    cumulativeCashFlow += yearCashFlow;

    const equity = projPropertyValue - projRemainingLoan;

    projection.push({
      year,
      propertyValue: Math.round(projPropertyValue),
      equity: Math.round(equity),
      annualCashFlow: Math.round(yearCashFlow),
      cumulativeCashFlow: Math.round(cumulativeCashFlow),
      remainingLoan: Math.round(projRemainingLoan),
    });
  }

  return {
    monthlyMortgage: Math.round(monthlyMortgage * 100) / 100,
    grossAnnualRent: Math.round(grossAnnualRent),
    effectiveRent: Math.round(effectiveRent),
    noi: Math.round(noi),
    annualMortgage: Math.round(annualMortgage),
    annualDepreciation: Math.round(annualDepreciation),
    taxableIncome: Math.round(taxableIncome),
    cashFlowBeforeTax: Math.round(cashFlowBeforeTax),
    incomeTax: Math.round(incomeTax),
    socialCharges: Math.round(socialCharges),
    cashFlowAfterTax: Math.round(cashFlowAfterTax),
    monthlyCashFlow: Math.round(cashFlowAfterTax / 12),
    grossYield: Math.round(grossYield * 10000) / 10000,
    netYield: Math.round(netYield * 10000) / 10000,
    cashOnCash: Math.round(cashOnCash * 10000) / 10000,
    leverageEffect: Math.round(leverageEffect * 10000) / 10000,
    totalInvestment: Math.round(totalInvestment),
    cashInvested: Math.round(cashInvested),
    loanAmount: Math.round(loanAmount),
    projection,
  };
}
