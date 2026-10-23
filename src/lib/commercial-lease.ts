export interface CommercialLeaseScenario {
  annualRent: number;
  referenceIndex: number;
  targetIndex: number;
  capPercent: number | null;
  years: number;
  annualCharges: number;
  depositMonths: number;
}

/** Arithmetic scenario only; index values and contractual clauses are supplied by the user. */
export function calculateCommercialLease(input: CommercialLeaseScenario) {
  if (![input.annualRent, input.referenceIndex, input.targetIndex, input.years, input.annualCharges, input.depositMonths].every(Number.isFinite)
    || input.annualRent <= 0 || input.referenceIndex <= 0 || input.targetIndex <= 0
    || !Number.isInteger(input.years) || input.years < 1 || input.years > 99
    || input.annualCharges < 0 || input.depositMonths < 0 || input.depositMonths > 6
    || (input.capPercent !== null && (!Number.isFinite(input.capPercent) || input.capPercent < 0 || input.capPercent > 100))) {
    throw new Error("Invalid commercial lease assumptions");
  }
  const coefficient = input.targetIndex / input.referenceIndex;
  const uncappedRent = input.annualRent * coefficient;
  const ceiling = input.capPercent === null ? Infinity : input.annualRent * (1 + input.capPercent / 100);
  const indexedRent = Math.min(uncappedRent, ceiling);
  if (![coefficient, uncappedRent, indexedRent, (indexedRent + input.annualCharges) * input.years].every(Number.isFinite)) throw new Error("Commercial lease result overflow");
  return {
    coefficient, uncappedRent, indexedRent, capped: uncappedRent > ceiling,
    monthlyRent: indexedRent / 12,
    deposit: input.annualRent / 12 * input.depositMonths,
    rentTotal: indexedRent * input.years,
    chargesTotal: input.annualCharges * input.years,
    occupationTotal: (indexedRent + input.annualCharges) * input.years,
  };
}

/** No assumed statutory 3-year break. An interval requires an explicit contractual clause. */
export function commercialLeaseBreakYears(startYear: number, years: number, interval: number | null): number[] {
  if (interval === null) return [];
  if (![startYear, years, interval].every(Number.isInteger) || startYear < 1900 || startYear > 2200 || years < 1 || years > 99 || interval < 1 || interval > 99) throw new Error("Invalid contractual break interval");
  const dates: number[] = [];
  for (let i = interval; i < years; i += interval) dates.push(startYear + i);
  return dates;
}
