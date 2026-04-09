/**
 * Amortization Schedule Calculation Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Generate full amortization schedule.
 *
 * @param {Object} params
 * @param {number} params.loanAmount - Loan principal
 * @param {number} params.annualRate - Annual interest rate as decimal (e.g., 0.035)
 * @param {number} params.durationMonths - Loan duration in months
 * @param {string} params.type - 'constant' (annuity) | 'linear' (constant principal)
 * @param {number} params.monthlyInsurance - Fixed monthly insurance amount
 * @returns {Object} {
 *   schedule: [{month, payment, principal, interest, insurance, totalPayment, remainingBalance}],
 *   summary: {totalPayments, totalInterest, totalInsurance, totalCost, effectiveRate}
 * }
 */
export function generateAmortizationSchedule(params) {
  const {
    loanAmount,
    annualRate,
    durationMonths,
    type = 'constant',
    monthlyInsurance = 0,
  } = params;

  if (loanAmount <= 0 || durationMonths <= 0) {
    return {
      schedule: [],
      summary: {
        totalPayments: 0,
        totalInterest: 0,
        totalInsurance: 0,
        totalCost: 0,
        effectiveRate: 0,
      },
    };
  }

  const monthlyRate = annualRate / 12;
  const schedule = [];
  let remainingBalance = loanAmount;
  let totalInterest = 0;
  let totalPayments = 0;
  const totalInsurance = monthlyInsurance * durationMonths;

  if (type === 'infine') {
    // In-fine: interest only each month, principal repaid in full at maturity
    for (let month = 1; month <= durationMonths; month++) {
      const interest = remainingBalance * monthlyRate;
      const principal = month === durationMonths ? loanAmount : 0;
      const payment = interest + principal;
      const totalPayment = payment + monthlyInsurance;

      if (month === durationMonths) {
        remainingBalance = 0;
      }

      totalInterest += interest;
      totalPayments += payment;

      schedule.push({
        month,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      });
    }
  } else if (type === 'linear') {
    // Linear amortization: fixed principal portion each month
    const fixedPrincipal = loanAmount / durationMonths;

    for (let month = 1; month <= durationMonths; month++) {
      const interest = remainingBalance * monthlyRate;
      const principal = fixedPrincipal;
      const payment = principal + interest;
      const totalPayment = payment + monthlyInsurance;

      remainingBalance -= principal;
      // Avoid floating point artifacts on the last month
      if (month === durationMonths) {
        remainingBalance = 0;
      }

      totalInterest += interest;
      totalPayments += payment;

      schedule.push({
        month,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      });
    }
  } else {
    // Constant annuity: fixed total payment (principal + interest)
    let fixedPayment;
    if (annualRate === 0) {
      fixedPayment = loanAmount / durationMonths;
    } else {
      const compounded = Math.pow(1 + monthlyRate, durationMonths);
      fixedPayment = loanAmount * (monthlyRate * compounded) / (compounded - 1);
    }

    for (let month = 1; month <= durationMonths; month++) {
      const interest = remainingBalance * monthlyRate;
      let principal = fixedPayment - interest;

      // On the last month, adjust principal to zero out balance exactly
      if (month === durationMonths) {
        principal = remainingBalance;
      }

      const payment = principal + interest;
      const totalPayment = payment + monthlyInsurance;

      remainingBalance -= principal;
      if (month === durationMonths) {
        remainingBalance = 0;
      }

      totalInterest += interest;
      totalPayments += payment;

      schedule.push({
        month,
        payment: Math.round(payment * 100) / 100,
        principal: Math.round(principal * 100) / 100,
        interest: Math.round(interest * 100) / 100,
        insurance: Math.round(monthlyInsurance * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        remainingBalance: Math.max(0, Math.round(remainingBalance * 100) / 100),
      });
    }
  }

  // Calculate effective annual rate (TAEG) using total cost
  // Effective rate: the annualized rate that would produce the same total cost
  // including insurance. We use a simple approximation:
  // totalCost = totalPayments + totalInsurance
  // effectiveRate = 2 * (totalCost - loanAmount) / (loanAmount * (durationMonths + 1) / 12)
  // This is the APR approximation; a more precise Newton-Raphson could be added later.
  const totalCost = totalPayments + totalInsurance;
  let effectiveRate = 0;
  if (loanAmount > 0 && durationMonths > 0) {
    // Use the standard APR approximation
    const avgBalance = loanAmount / 2;
    const years = durationMonths / 12;
    const totalCostOverPrincipal = totalCost - loanAmount;
    effectiveRate = totalCostOverPrincipal / (avgBalance * years);
  }

  return {
    schedule,
    summary: {
      totalPayments: Math.round(totalPayments * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalInsurance: Math.round(totalInsurance * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      effectiveRate: Math.round(effectiveRate * 10000) / 10000,
    },
  };
}

/**
 * Generate yearly summary from monthly schedule.
 *
 * @param {Array} monthlySchedule - The schedule array from generateAmortizationSchedule
 * @returns {Array} [{year, totalPayment, totalPrincipal, totalInterest, totalInsurance, remainingBalance}]
 */
export function generateYearlySummary(monthlySchedule) {
  if (!monthlySchedule || monthlySchedule.length === 0) {
    return [];
  }

  const yearlyMap = new Map();

  for (const entry of monthlySchedule) {
    const year = Math.ceil(entry.month / 12);

    if (!yearlyMap.has(year)) {
      yearlyMap.set(year, {
        year,
        totalPayment: 0,
        totalPrincipal: 0,
        totalInterest: 0,
        totalInsurance: 0,
        remainingBalance: 0,
      });
    }

    const yearData = yearlyMap.get(year);
    yearData.totalPayment += entry.totalPayment;
    yearData.totalPrincipal += entry.principal;
    yearData.totalInterest += entry.interest;
    yearData.totalInsurance += entry.insurance;
    yearData.remainingBalance = entry.remainingBalance;
  }

  return Array.from(yearlyMap.values()).map((y) => ({
    year: y.year,
    totalPayment: Math.round(y.totalPayment * 100) / 100,
    totalPrincipal: Math.round(y.totalPrincipal * 100) / 100,
    totalInterest: Math.round(y.totalInterest * 100) / 100,
    totalInsurance: Math.round(y.totalInsurance * 100) / 100,
    remainingBalance: y.remainingBalance,
  }));
}
