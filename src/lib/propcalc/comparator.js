/**
 * Cross-Border Comparator Engine
 * Compare investment potential across multiple countries.
 */

import { calculateAcquisitionFees } from './fees';
import { calculateNetYield, calculateTaxImpact } from './rental';
import { calculateMonthlyPayment } from './mortgage';

/**
 * Compare a property investment across all provided countries.
 *
 * @param {Object} params
 * @param {number} params.budget - Total available budget (down payment + fees budget)
 * @param {number} params.monthlyIncome - Monthly net income
 * @param {number} params.monthlyRent - Expected monthly rent (estimated)
 * @param {number} params.annualRate - Assumed mortgage rate (decimal)
 * @param {number} params.durationYears - Loan duration
 * @param {number} params.ltvRatio - Assumed LTV (decimal, e.g. 0.80)
 * @param {string} params.residencyStatus - 'resident' | 'nonResident' | 'nonEU'
 * @param {number} params.marginalTaxRate - Marginal tax rate (decimal)
 * @param {Object} params.countriesData - { fr: frData, de: deData, ... }
 * @param {string[]} params.countryCodes - e.g. ['fr','de','uk',...]
 * @returns {Array} Sorted array of country comparison results
 */
export function compareCountries(params) {
  const {
    budget,
    monthlyIncome = 4000,
    monthlyRent = 0,
    annualRate = 0,
    durationYears = 25,
    ltvRatio = 0.80,
    residencyStatus = 'resident',
    marginalTaxRate = 0.30,
    countriesData,
    countryCodes,
  } = params;

  const results = [];

  for (const code of countryCodes) {
    const countryData = countriesData[code];
    if (!countryData) continue;

    const borrowing = countryData.borrowing;
    const currency = countryData.currencySymbol;
    const rate = annualRate > 0 ? annualRate : borrowing.defaultRate / 100;
    const maxDuration = Math.min(durationYears, borrowing.maxDurationYears);

    // Step 1: Estimate max property price from budget
    // budget = downPayment + fees
    // downPayment = price * (1 - LTV)
    // fees ≈ price * feeRate
    // So: budget = price * (1 - LTV) + price * feeRate
    // => price = budget / (1 - LTV + feeRate)

    // First pass: estimate fee rate by calculating fees on a reference price
    const referencePrice = budget * 2; // rough estimate
    const firstRegion = countryData.acquisitionFees?.regions?.[0];
    const regionCode = firstRegion?.code || '';

    const refFees = calculateAcquisitionFees({
      propertyPrice: referencePrice,
      countryCode: code,
      regionCode,
      isNew: false,
      isPrimaryResidence: false,
      isFirstTimeBuyer: false,
      loanAmount: referencePrice * ltvRatio,
      countryData,
    });

    const feeRate = referencePrice > 0 ? refFees.total / referencePrice : 0.08;
    const downPaymentRate = 1 - ltvRatio;

    // price * (downPaymentRate + feeRate) = budget
    const estimatedPrice = budget / (downPaymentRate + feeRate);
    const propertyPrice = Math.round(estimatedPrice);

    // Step 2: Calculate actual fees
    const fees = calculateAcquisitionFees({
      propertyPrice,
      countryCode: code,
      regionCode,
      isNew: false,
      isPrimaryResidence: false,
      isFirstTimeBuyer: false,
      loanAmount: Math.round(propertyPrice * ltvRatio),
      countryData,
    });

    const loanAmount = Math.round(propertyPrice * ltvRatio);
    const downPayment = propertyPrice - loanAmount;
    const totalCashNeeded = downPayment + fees.total;

    // Step 3: Monthly mortgage
    const durationMonths = maxDuration * 12;
    const monthlyPayment = calculateMonthlyPayment(loanAmount, rate, durationMonths);

    // Step 4: Estimate rent (use provided or estimate as 0.4% of price / month = ~5% gross yield)
    const estimatedMonthlyRent = monthlyRent > 0 ? monthlyRent : Math.round(propertyPrice * 0.004);

    // Step 5: Rental yield
    const yieldResult = calculateNetYield({
      annualRent: estimatedMonthlyRent * 12,
      purchasePrice: propertyPrice,
      monthlyCharges: Math.round(propertyPrice * 0.001), // ~0.1% monthly charges estimate
      annualPropertyTax: Math.round(propertyPrice * 0.005), // ~0.5% property tax estimate
      annualInsurance: 300,
      vacancyRate: 0.05,
      managementRate: 0.08,
      annualMaintenance: 500,
    });

    // Step 6: Tax impact
    const taxResult = calculateTaxImpact({
      netRent: yieldResult.netRent,
      purchasePrice: propertyPrice,
      annualRent: estimatedMonthlyRent * 12,
      countryCode: code,
      taxRegime: countryData.rentalTax?.regimes?.[0]?.code || '',
      marginalRate: marginalTaxRate,
      socialChargesRate: code === 'fr' ? 0.172 : 0,
      countryData,
    });

    // Step 7: Monthly cash-flow
    const monthlyCashFlow = (taxResult.netAfterTax / 12) - monthlyPayment;

    results.push({
      code,
      name: countryData.name,
      flag: countryData.flag,
      currency: countryData.currency,
      currencySymbol: currency,
      propertyPrice,
      fees: fees.total,
      feesPercent: fees.totalPercent,
      loanAmount,
      downPayment,
      totalCashNeeded: Math.round(totalCashNeeded),
      monthlyPayment: Math.round(monthlyPayment),
      monthlyRent: estimatedMonthlyRent,
      grossYield: yieldResult.grossYield,
      netYield: yieldResult.netYield,
      netNetYield: taxResult.netNetYield,
      monthlyCashFlow: Math.round(monthlyCashFlow),
      annualNetIncome: taxResult.netAfterTax,
    });
  }

  // Sort by net-net yield descending
  results.sort((a, b) => b.netNetYield - a.netNetYield);

  // Add rank
  results.forEach((r, i) => { r.rank = i + 1; });

  return results;
}
