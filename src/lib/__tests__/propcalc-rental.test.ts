// @ts-nocheck
import { describe, it, expect } from "vitest";
import {
  calculateGrossYield,
  calculateNetYield,
  calculateCashOnCash,
} from "../propcalc/rental.js";

describe("calculateGrossYield", () => {
  it("returns 0 for invalid inputs", () => {
    expect(calculateGrossYield(0, 500_000)).toBe(0);
    expect(calculateGrossYield(20_000, 0)).toBe(0);
    expect(calculateGrossYield(-1, 100)).toBe(0);
  });

  it("20 000 / 400 000 = 5 %", () => {
    expect(calculateGrossYield(20_000, 400_000)).toBeCloseTo(0.05, 4);
  });
});

describe("calculateNetYield", () => {
  it("all-zero expenses → net ≈ gross", () => {
    const r = calculateNetYield({ annualRent: 20_000, purchasePrice: 400_000 });
    expect(r.netYield).toBeCloseTo(r.grossYield, 4);
  });

  it("vacancy reduces effective rent proportionally", () => {
    const r = calculateNetYield({
      annualRent: 20_000, purchasePrice: 400_000, vacancyRate: 0.10,
    });
    expect(r.effectiveRent).toBeCloseTo(18_000, 0);
    expect(r.expenses.vacancy).toBeCloseTo(2_000, 0);
  });

  it("charges: monthly × 12 injected in expenses.charges", () => {
    const r = calculateNetYield({
      annualRent: 20_000, purchasePrice: 400_000, monthlyCharges: 150,
    });
    expect(r.expenses.charges).toBeCloseTo(1_800, 0);
  });

  it("management fee is percentage of effective rent", () => {
    const r = calculateNetYield({
      annualRent: 20_000, purchasePrice: 400_000, vacancyRate: 0.10, managementRate: 0.08,
    });
    expect(r.expenses.management).toBeCloseTo(18_000 * 0.08, 0);
  });

  it("high charges produce negative netRent", () => {
    const r = calculateNetYield({
      annualRent: 12_000, purchasePrice: 400_000, annualMaintenance: 30_000,
    });
    expect(r.netRent).toBeLessThan(0);
    expect(r.netYield).toBeLessThan(0);
  });

  it("returns zeros for invalid inputs", () => {
    const r = calculateNetYield({ annualRent: 0, purchasePrice: 0 });
    expect(r.grossYield).toBe(0);
    expect(r.netYield).toBe(0);
  });
});

describe("calculateCashOnCash", () => {
  it("positive return for profitable investment", () => {
    const coc = calculateCashOnCash(15_000, 12_000, 100_000);
    expect(coc).toBeCloseTo((15_000 - 12_000) / 100_000, 4);
  });

  it("zero when cash invested is 0", () => {
    const coc = calculateCashOnCash(10_000, 5_000, 0);
    expect(coc).toBe(0);
  });

  it("negative when mortgage cost exceeds net", () => {
    const coc = calculateCashOnCash(5_000, 10_000, 50_000);
    expect(coc).toBeLessThan(0);
  });
});
