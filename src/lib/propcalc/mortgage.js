/**
 * Mortgage / Borrowing Capacity Calculation Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Calculate monthly payment for a constant annuity mortgage (most common in Europe).
 * Formula: M = P * [r(1+r)^n] / [(1+r)^n - 1]
 *
 * @param {number} loanAmount - Loan principal
 * @param {number} annualRate - Annual interest rate as decimal (e.g., 0.035 for 3.5%)
 * @param {number} durationMonths - Loan duration in months
 * @returns {number} Monthly payment amount
 */
export function calculateMonthlyPayment(loanAmount, annualRate, durationMonths) {
  if (loanAmount <= 0 || durationMonths <= 0) {
    return 0;
  }

  if (annualRate === 0) {
    return loanAmount / durationMonths;
  }

  const r = annualRate / 12;
  const n = durationMonths;
  const compounded = Math.pow(1 + r, n);
  return loanAmount * (r * compounded) / (compounded - 1);
}

/**
 * Compute the maximum loan amount achievable for a given monthly payment.
 * Inverse of calculateMonthlyPayment: P = M * [(1+r)^n - 1] / [r(1+r)^n]
 *
 * @param {number} monthlyPayment - Maximum affordable monthly payment
 * @param {number} annualRate - Annual interest rate as decimal
 * @param {number} durationMonths - Loan duration in months
 * @returns {number} Maximum loan principal
 */
function maxLoanFromPayment(monthlyPayment, annualRate, durationMonths) {
  if (monthlyPayment <= 0 || durationMonths <= 0) {
    return 0;
  }

  if (annualRate === 0) {
    return monthlyPayment * durationMonths;
  }

  const r = annualRate / 12;
  const n = durationMonths;
  const compounded = Math.pow(1 + r, n);
  return monthlyPayment * (compounded - 1) / (r * compounded);
}

/**
 * Choose the applicable LTV ratio based on residency status and country rules.
 *
 * @param {Object} countryRules - Country borrowing rules from data JSON
 * @param {string} residencyStatus - 'resident' | 'nonResident' | 'nonEU'
 * @returns {number} LTV ratio (e.g., 0.90)
 */
function getLTV(countryRules, residencyStatus) {
  switch (residencyStatus) {
    case 'nonResident':
      return countryRules.ltvNonResident ?? countryRules.ltvResident;
    case 'nonEU':
      return countryRules.ltvNonEU ?? countryRules.ltvNonResident ?? countryRules.ltvResident;
    case 'resident':
    default:
      return countryRules.ltvResident;
  }
}

/**
 * Calculate maximum borrowing capacity.
 *
 * @param {Object} params
 * @param {number} params.monthlyIncome - Net monthly household income
 * @param {number} params.existingDebts - Current monthly debt payments
 * @param {number} params.annualRate - Annual interest rate as decimal
 * @param {number} params.durationYears - Loan duration in years
 * @param {number} params.downPayment - Available down payment
 * @param {number} params.insuranceRate - Monthly insurance rate as decimal of capital
 *   (e.g., 0.00025 per month, which corresponds to 0.3%/year)
 * @param {Object} params.countryRules - Country borrowing rules from data JSON
 * @param {string} params.residencyStatus - 'resident' | 'nonResident' | 'nonEU'
 * @returns {Object} {
 *   maxLoanAmount, maxPropertyPrice, monthlyPayment, monthlyInsurance,
 *   totalMonthly, dtiRatio, maxDTI, ltvApplied, estimatedFees
 * }
 */
export function calculateBorrowingCapacity(params) {
  const {
    monthlyIncome,
    existingDebts = 0,
    annualRate,
    durationYears,
    downPayment = 0,
    insuranceRate = 0,
    countryRules,
    residencyStatus = 'resident',
  } = params;

  const durationMonths = durationYears * 12;
  const maxDTI = countryRules.maxDSTI;
  const ltvApplied = getLTV(countryRules, residencyStatus);
  const insuranceIncludedInDSTI = countryRules.insuranceIncludedInDSTI ?? false;

  // Maximum total monthly obligations allowed by the DTI rule
  const maxAllowedMonthly = monthlyIncome * maxDTI - existingDebts;

  if (maxAllowedMonthly <= 0) {
    return {
      maxLoanAmount: 0,
      maxPropertyPrice: 0,
      monthlyPayment: 0,
      monthlyInsurance: 0,
      totalMonthly: 0,
      dtiRatio: existingDebts / monthlyIncome,
      maxDTI,
      ltvApplied,
      estimatedFees: 0,
    };
  }

  // Iteratively solve for the max property price.
  // We need to account for:
  //   - The loan payment + insurance must satisfy the DTI constraint
  //   - The loan is capped by LTV * propertyPrice
  //   - Fees (~8% of property price) must be funded from the down payment or loan
  //
  // Approach: iterate to converge on a stable property price.

  const feeRate = 0.08; // approximate acquisition fees as 8% of property price
  const maxIterations = 50;
  const tolerance = 1; // converge within 1 currency unit

  // Step 1: Determine the maximum loan purely from affordability (DTI)
  // If insurance is included in DTI (France), we need to solve simultaneously
  // because insurance depends on loan amount.

  let maxLoanDTI;

  if (insuranceIncludedInDSTI && insuranceRate > 0) {
    // monthlyPayment(L) + L * insuranceRate <= maxAllowedMonthly
    // For annuity: L * [r(1+r)^n / ((1+r)^n - 1)] + L * insuranceRate <= maxAllowedMonthly
    // L * (annuityFactor + insuranceRate) <= maxAllowedMonthly
    // L <= maxAllowedMonthly / (annuityFactor + insuranceRate)

    let annuityFactor;
    if (annualRate === 0) {
      annuityFactor = 1 / durationMonths;
    } else {
      const r = annualRate / 12;
      const compounded = Math.pow(1 + r, durationMonths);
      annuityFactor = (r * compounded) / (compounded - 1);
    }

    maxLoanDTI = maxAllowedMonthly / (annuityFactor + insuranceRate);
  } else {
    // Insurance is NOT included in DTI -- only the loan payment is constrained
    maxLoanDTI = maxLoanFromPayment(maxAllowedMonthly, annualRate, durationMonths);
  }

  if (maxLoanDTI <= 0) {
    return {
      maxLoanAmount: 0,
      maxPropertyPrice: 0,
      monthlyPayment: 0,
      monthlyInsurance: 0,
      totalMonthly: 0,
      dtiRatio: existingDebts / monthlyIncome,
      maxDTI,
      ltvApplied,
      estimatedFees: 0,
    };
  }

  // Step 2: Iterate to find the max property price
  // propertyPrice = (maxLoan + downPayment) / (1 + feeRate)
  // but maxLoan is also capped by LTV * propertyPrice
  // So we iterate until stable.

  let prevPropertyPrice = 0;
  let maxLoan = maxLoanDTI;
  let propertyPrice = (maxLoan + downPayment) / (1 + feeRate);

  for (let i = 0; i < maxIterations; i++) {
    // Apply LTV cap
    const ltvCappedLoan = propertyPrice * ltvApplied;
    maxLoan = Math.min(maxLoanDTI, ltvCappedLoan);

    // Recompute property price: price + fees = loan + downPayment
    // fees = feeRate * price
    // price * (1 + feeRate) = loan + downPayment
    propertyPrice = (maxLoan + downPayment) / (1 + feeRate);

    if (Math.abs(propertyPrice - prevPropertyPrice) < tolerance) {
      break;
    }
    prevPropertyPrice = propertyPrice;
  }

  // Ensure loan does not exceed LTV after convergence
  maxLoan = Math.min(maxLoan, propertyPrice * ltvApplied);

  // Final calculations
  const monthlyPayment = calculateMonthlyPayment(maxLoan, annualRate, durationMonths);
  const monthlyInsurance = maxLoan * insuranceRate;
  const totalMonthly = monthlyPayment + monthlyInsurance + existingDebts;
  const dtiRatio = monthlyIncome > 0 ? totalMonthly / monthlyIncome : 0;
  const estimatedFees = propertyPrice * feeRate;

  return {
    maxLoanAmount: Math.round(maxLoan * 100) / 100,
    maxPropertyPrice: Math.round(propertyPrice * 100) / 100,
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    monthlyInsurance: Math.round(monthlyInsurance * 100) / 100,
    totalMonthly: Math.round(totalMonthly * 100) / 100,
    dtiRatio: Math.round(dtiRatio * 10000) / 10000,
    maxDTI,
    ltvApplied,
    estimatedFees: Math.round(estimatedFees * 100) / 100,
  };
}
