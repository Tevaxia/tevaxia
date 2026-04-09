/**
 * Buy vs Rent Comparison Engine
 * Pure calculation functions - no UI dependencies.
 */

/**
 * Simulate buying vs renting over a given time horizon.
 *
 * @param {Object} params
 * @param {number} params.propertyPrice - Purchase price
 * @param {number} params.downPayment - Cash down payment
 * @param {number} params.acquisitionFeesRate - Total acquisition fees as % of price (e.g., 0.08)
 * @param {number} params.annualRate - Mortgage annual interest rate (decimal)
 * @param {number} params.loanDurationYears - Mortgage duration in years
 * @param {number} params.monthlyRent - Current monthly rent
 * @param {number} params.annualRentIncrease - Annual rent increase rate (decimal, e.g., 0.02)
 * @param {number} params.annualAppreciation - Annual property appreciation rate (decimal)
 * @param {number} params.annualOwnerCharges - Annual owner charges (tax, insurance, maintenance, condo)
 * @param {number} params.annualRenterCharges - Annual renter charges (renter insurance, etc.)
 * @param {number} params.alternativeReturnRate - Annual return on savings if renting (decimal)
 * @param {number} params.horizonYears - Comparison horizon in years
 * @param {number} params.sellingCostsRate - Cost to sell (agent fees) as % of value (e.g., 0.05)
 * @returns {Object} { timeline, breakeven, summary }
 */
export function compareBuyVsRent(params) {
  const {
    propertyPrice,
    downPayment,
    acquisitionFeesRate = 0.08,
    annualRate,
    loanDurationYears,
    monthlyRent,
    annualRentIncrease = 0.02,
    annualAppreciation = 0.02,
    annualOwnerCharges = 0,
    annualRenterCharges = 0,
    alternativeReturnRate = 0.03,
    horizonYears = 20,
    sellingCostsRate = 0.05,
  } = params;

  const acquisitionFees = propertyPrice * acquisitionFeesRate;
  const loanAmount = propertyPrice + acquisitionFees - downPayment;
  const loanDurationMonths = loanDurationYears * 12;

  // Monthly mortgage payment
  let monthlyPayment = 0;
  if (loanAmount > 0 && loanDurationMonths > 0) {
    if (annualRate === 0) {
      monthlyPayment = loanAmount / loanDurationMonths;
    } else {
      const r = annualRate / 12;
      const c = Math.pow(1 + r, loanDurationMonths);
      monthlyPayment = loanAmount * (r * c) / (c - 1);
    }
  }

  const timeline = [];

  // Buyer state
  let propertyValue = propertyPrice;
  let remainingLoan = loanAmount;
  let totalBuyerSpent = downPayment + acquisitionFees;

  // Renter state
  let renterSavings = downPayment + acquisitionFees; // Renter keeps the cash
  let currentMonthlyRent = monthlyRent;
  let totalRenterSpent = 0;

  let breakeven = null;

  for (let year = 1; year <= horizonYears; year++) {
    // Property appreciation
    propertyValue *= (1 + annualAppreciation);

    // Buyer annual costs
    const annualMortgage = year <= loanDurationYears ? monthlyPayment * 12 : 0;

    // Pay down principal
    let principalPaid = 0;
    if (year <= loanDurationYears && remainingLoan > 0) {
      for (let m = 0; m < 12; m++) {
        if (remainingLoan <= 0) break;
        const monthlyInterest = remainingLoan * (annualRate / 12);
        const monthlyPrincipal = Math.min(monthlyPayment - monthlyInterest, remainingLoan);
        principalPaid += monthlyPrincipal;
        remainingLoan -= monthlyPrincipal;
      }
    }
    remainingLoan = Math.max(0, remainingLoan);

    const buyerAnnualCost = annualMortgage + annualOwnerCharges;
    totalBuyerSpent += buyerAnnualCost;

    // Buyer net wealth: property value - remaining loan - selling costs
    const sellingCosts = propertyValue * sellingCostsRate;
    const buyerWealth = propertyValue - remainingLoan - sellingCosts;

    // Renter annual costs
    const annualRentCost = currentMonthlyRent * 12;
    const renterAnnualCost = annualRentCost + annualRenterCharges;
    totalRenterSpent += renterAnnualCost;

    // Renter saves the difference
    const monthlySavings = (buyerAnnualCost - renterAnnualCost) / 12;
    if (monthlySavings > 0) {
      // Renter can save the extra each month
      for (let m = 0; m < 12; m++) {
        renterSavings += monthlySavings;
        renterSavings *= (1 + alternativeReturnRate / 12);
      }
    } else {
      // Buyer pays less — renter draws down savings or no extra savings
      renterSavings *= (1 + alternativeReturnRate);
    }

    // Renter net wealth: savings
    const renterWealth = renterSavings;

    // Rent increases for next year
    currentMonthlyRent *= (1 + annualRentIncrease);

    timeline.push({
      year,
      buyerWealth: Math.round(buyerWealth),
      renterWealth: Math.round(renterWealth),
      propertyValue: Math.round(propertyValue),
      remainingLoan: Math.round(remainingLoan),
      annualBuyerCost: Math.round(buyerAnnualCost),
      annualRenterCost: Math.round(renterAnnualCost),
      monthlyRent: Math.round(currentMonthlyRent / (1 + annualRentIncrease)),
    });

    // Detect breakeven
    if (!breakeven && buyerWealth >= renterWealth) {
      breakeven = year;
    }
  }

  const lastYear = timeline[timeline.length - 1];
  const advantage = lastYear.buyerWealth - lastYear.renterWealth;

  return {
    timeline,
    breakeven,
    summary: {
      totalBuyerSpent: Math.round(totalBuyerSpent),
      totalRenterSpent: Math.round(totalRenterSpent),
      finalBuyerWealth: lastYear.buyerWealth,
      finalRenterWealth: lastYear.renterWealth,
      advantage: Math.round(advantage),
      verdict: advantage > 0 ? 'buy' : 'rent',
      monthlyMortgage: Math.round(monthlyPayment),
    },
  };
}
