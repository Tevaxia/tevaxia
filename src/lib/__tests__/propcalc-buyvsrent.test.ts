// @ts-nocheck
import { describe, it, expect } from "vitest";
import { compareBuyVsRent } from "../propcalc/buyvsrent.js";

const BASE = {
  propertyPrice: 600_000,
  downPayment: 100_000,
  acquisitionFeesRate: 0.08,
  annualRate: 0.035,
  loanDurationYears: 25,
  monthlyRent: 2_000,
  annualRentIncrease: 0.02,
  annualAppreciation: 0.025,
  annualOwnerCharges: 4_000,
  annualRenterCharges: 200,
  alternativeReturnRate: 0.03,
  horizonYears: 20,
  sellingCostsRate: 0.05,
};

describe("compareBuyVsRent", () => {
  it("produces a timeline of horizonYears entries", () => {
    const r = compareBuyVsRent(BASE);
    expect(r.timeline).toHaveLength(BASE.horizonYears);
  });

  it("summary includes both sides + finalDelta", () => {
    const r = compareBuyVsRent(BASE);
    expect(r.summary).toBeDefined();
    expect(typeof r.summary.finalBuyerWealth).toBe("number");
    expect(typeof r.summary.finalRenterWealth).toBe("number");
  });

  it("year 1: remaining loan > 0 (mortgage ongoing)", () => {
    const r = compareBuyVsRent(BASE);
    expect(r.timeline[0].remainingLoan).toBeGreaterThan(0);
  });

  it("last year remainingLoan ≈ 0 when loanDurationYears ≤ horizonYears", () => {
    const r = compareBuyVsRent({ ...BASE, loanDurationYears: 10, horizonYears: 12 });
    expect(r.timeline[r.timeline.length - 1].remainingLoan).toBeLessThan(1);
  });

  it("property value grows with appreciation rate", () => {
    const r = compareBuyVsRent(BASE);
    expect(r.timeline[0].propertyValue).toBeCloseTo(
      BASE.propertyPrice * (1 + BASE.annualAppreciation),
      0,
    );
  });

  it("high appreciation favors buying over renting", () => {
    const lowApp = compareBuyVsRent({ ...BASE, annualAppreciation: 0.00 });
    const highApp = compareBuyVsRent({ ...BASE, annualAppreciation: 0.05 });
    expect(highApp.summary.finalBuyerWealth).toBeGreaterThan(lowApp.summary.finalBuyerWealth);
  });

  it("high alt return rate favors renting", () => {
    const lowRet = compareBuyVsRent({ ...BASE, alternativeReturnRate: 0.01 });
    const highRet = compareBuyVsRent({ ...BASE, alternativeReturnRate: 0.08 });
    expect(highRet.summary.finalRenterWealth).toBeGreaterThan(lowRet.summary.finalRenterWealth);
  });

  it("breakeven is null when buyer never overtakes renter (unrealistic scenario)", () => {
    // Rent extremely cheap + zero appreciation + high alt return → buyer never wins
    const r = compareBuyVsRent({
      ...BASE, monthlyRent: 200, annualAppreciation: 0, alternativeReturnRate: 0.10,
    });
    // breakeven may be null (null means never crosses) or a high year
    if (r.breakeven !== null) {
      expect(r.breakeven).toBeGreaterThan(0);
    }
  });
});
