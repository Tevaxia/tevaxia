// @ts-nocheck
import { describe, it, expect } from "vitest";
import { calculateMonthlyPayment, calculateBorrowingCapacity } from "../propcalc/mortgage.js";

const LU_RULES = {
  ltvResident: 0.90,
  ltvNonResident: 0.80,
  ltvNonEU: 0.70,
  maxDSTI: 0.45,
  insuranceIncludedInDSTI: false,
};

describe("calculateMonthlyPayment", () => {
  it("returns 0 for zero loan or zero duration", () => {
    expect(calculateMonthlyPayment(0, 0.035, 240)).toBe(0);
    expect(calculateMonthlyPayment(100_000, 0.035, 0)).toBe(0);
  });

  it("straight division when rate is 0", () => {
    const m = calculateMonthlyPayment(100_000, 0, 120);
    expect(m).toBeCloseTo(100_000 / 120, 4);
  });

  it("standard annuity 200k @ 3.5 % / 25 yrs ≈ €1001-1002", () => {
    const m = calculateMonthlyPayment(200_000, 0.035, 300);
    expect(m).toBeGreaterThan(990);
    expect(m).toBeLessThan(1020);
  });

  it("doubling duration lowers the monthly payment", () => {
    const short = calculateMonthlyPayment(200_000, 0.035, 120);
    const long = calculateMonthlyPayment(200_000, 0.035, 240);
    expect(long).toBeLessThan(short);
  });

  it("higher rate increases the monthly payment", () => {
    const low = calculateMonthlyPayment(200_000, 0.02, 240);
    const high = calculateMonthlyPayment(200_000, 0.05, 240);
    expect(high).toBeGreaterThan(low);
  });
});

describe("calculateBorrowingCapacity", () => {
  const BASE = {
    monthlyIncome: 6_000,
    existingDebts: 0,
    annualRate: 0.035,
    durationYears: 25,
    downPayment: 80_000,
    insuranceRate: 0,
    countryRules: LU_RULES,
    residencyStatus: "resident",
  };

  it("produces a loan + property price > 0 for normal case", () => {
    const r = calculateBorrowingCapacity(BASE);
    expect(r.maxLoanAmount).toBeGreaterThan(0);
    expect(r.maxPropertyPrice).toBeGreaterThan(r.maxLoanAmount);
  });

  it("zero income → zero capacity", () => {
    const r = calculateBorrowingCapacity({ ...BASE, monthlyIncome: 0 });
    expect(r.maxLoanAmount).toBe(0);
  });

  it("existing debts exceed DTI ceiling → zero capacity", () => {
    const r = calculateBorrowingCapacity({ ...BASE, existingDebts: 3_500 });
    expect(r.maxLoanAmount).toBe(0);
  });

  it("LTV constraint applied (loan ≤ ltv × price)", () => {
    const r = calculateBorrowingCapacity(BASE);
    expect(r.maxLoanAmount).toBeLessThanOrEqual(r.maxPropertyPrice * LU_RULES.ltvResident + 1);
  });

  it("non-resident uses lower LTV than resident", () => {
    const resident = calculateBorrowingCapacity({ ...BASE, residencyStatus: "resident" });
    const nonResident = calculateBorrowingCapacity({ ...BASE, residencyStatus: "nonResident" });
    expect(nonResident.ltvApplied).toBeLessThanOrEqual(resident.ltvApplied);
  });

  it("higher income yields higher capacity (everything else equal)", () => {
    const lo = calculateBorrowingCapacity({ ...BASE, monthlyIncome: 4_000 });
    const hi = calculateBorrowingCapacity({ ...BASE, monthlyIncome: 10_000 });
    expect(hi.maxLoanAmount).toBeGreaterThan(lo.maxLoanAmount);
  });

  it("dtiRatio stays ≤ maxDTI", () => {
    const r = calculateBorrowingCapacity(BASE);
    expect(r.dtiRatio).toBeLessThanOrEqual(LU_RULES.maxDSTI + 0.01);
  });

  it("zero down payment still works if income is high enough", () => {
    const r = calculateBorrowingCapacity({ ...BASE, monthlyIncome: 12_000, downPayment: 0 });
    expect(r.maxLoanAmount).toBeGreaterThan(0);
  });
});
