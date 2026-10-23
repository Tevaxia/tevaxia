import { describe, expect, it } from "vitest";
import { calculateCommercialLease, commercialLeaseBreakYears } from "../commercial-lease";
const input = { annualRent: 36000, referenceIndex: 100, targetIndex: 110, capPercent: null, years: 3, annualCharges: 2400, depositMonths: 6 };
describe("commercial lease arithmetic with supplied indices", () => {
  it("accepts a lease shorter than nine years and separates refundable security from cost", () => {
    const result = calculateCommercialLease(input);
    expect(result.indexedRent).toBeCloseTo(39600);
    expect(result.deposit).toBe(18000);
    expect(result.occupationTotal).toBeCloseTo(126000);
  });
  it("applies only an explicitly supplied contractual cap", () => {
    expect(calculateCommercialLease({ ...input, targetIndex: 130, capPercent: 10 }).indexedRent).toBe(39600);
    expect(calculateCommercialLease({ ...input, targetIndex: 130, capPercent: 0 }).indexedRent).toBe(36000);
    expect(calculateCommercialLease({ ...input, targetIndex: 130 }).indexedRent).toBe(46800);
  });
  it("preserves a fall in the index instead of imposing an implicit floor", () => {
    expect(calculateCommercialLease({ ...input, targetIndex: 90 }).indexedRent).toBe(32400);
  });
  it.each([6.01, 12, 24, -1, NaN])("rejects invalid security of %s months", depositMonths => {
    expect(() => calculateCommercialLease({ ...input, depositMonths })).toThrow();
  });
  it.each([0, -1, Infinity, NaN])("rejects invalid reference index %s", referenceIndex => {
    expect(() => calculateCommercialLease({ ...input, referenceIndex })).toThrow();
  });
  it("does not invent a three-year termination right", () => {
    expect(commercialLeaseBreakYears(2026, 9, null)).toEqual([]);
    expect(commercialLeaseBreakYears(2026, 9, 3)).toEqual([2029, 2032]);
    expect(commercialLeaseBreakYears(2026, 5, 2)).toEqual([2028, 2030]);
  });
  it("refuses arithmetic overflow instead of displaying an infinite cost", () => {
    expect(() => calculateCommercialLease({ ...input, annualRent: 1e308, years: 99 })).toThrow();
  });
});
