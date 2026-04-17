// @ts-nocheck
import { describe, it, expect } from "vitest";
import { generateAmortizationSchedule, generateYearlySummary } from "../propcalc/amortization.js";

describe("generateAmortizationSchedule", () => {
  it("empty for zero loan or zero duration", () => {
    const r = generateAmortizationSchedule({ loanAmount: 0, annualRate: 0.03, durationMonths: 240 });
    expect(r.schedule).toHaveLength(0);
    expect(r.summary.totalPayments).toBe(0);
  });

  it("constant annuity: schedule has durationMonths entries + balance = 0 at end", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 200_000, annualRate: 0.035, durationMonths: 240, type: "constant",
    });
    expect(r.schedule).toHaveLength(240);
    expect(r.schedule[239].remainingBalance).toBe(0);
  });

  it("constant annuity: payment is approximately constant", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 200_000, annualRate: 0.035, durationMonths: 240, type: "constant",
    });
    const payments = r.schedule.slice(0, -1).map((s) => s.payment);
    const min = Math.min(...payments);
    const max = Math.max(...payments);
    expect(Math.abs(max - min)).toBeLessThan(1); // constant annuity = flat
  });

  it("linear: principal is constant every month", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 120_000, annualRate: 0.03, durationMonths: 120, type: "linear",
    });
    const principals = r.schedule.map((s) => s.principal);
    const min = Math.min(...principals);
    const max = Math.max(...principals);
    expect(Math.abs(max - min)).toBeLessThan(0.01);
  });

  it("linear: total interest < constant annuity (classic property)", () => {
    const params = { loanAmount: 200_000, annualRate: 0.035, durationMonths: 240 };
    const linear = generateAmortizationSchedule({ ...params, type: "linear" });
    const constant = generateAmortizationSchedule({ ...params, type: "constant" });
    expect(linear.summary.totalInterest).toBeLessThan(constant.summary.totalInterest);
  });

  it("in-fine: monthly principal = 0 except last month", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 100_000, annualRate: 0.04, durationMonths: 60, type: "infine",
    });
    for (let i = 0; i < r.schedule.length - 1; i++) {
      expect(r.schedule[i].principal).toBe(0);
    }
    expect(r.schedule[r.schedule.length - 1].principal).toBeCloseTo(100_000, 0);
  });

  it("insurance: totalInsurance = insurance × duration", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 100_000, annualRate: 0.03, durationMonths: 120, type: "constant", monthlyInsurance: 20,
    });
    expect(r.summary.totalInsurance).toBeCloseTo(20 * 120, 0);
  });

  it("zero rate: principal = loan / duration each month", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 120_000, annualRate: 0, durationMonths: 120, type: "constant",
    });
    expect(r.schedule[0].principal).toBeCloseTo(1_000, 0);
    expect(r.summary.totalInterest).toBe(0);
  });
});

describe("generateYearlySummary", () => {
  it("returns [] for empty schedule", () => {
    expect(generateYearlySummary([])).toEqual([]);
  });

  it("aggregates 12 months into 1 year", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 100_000, annualRate: 0.03, durationMonths: 120, type: "constant",
    });
    const yearly = generateYearlySummary(r.schedule);
    expect(yearly).toHaveLength(10);
    expect(yearly[0].year).toBe(1);
    expect(yearly[yearly.length - 1].year).toBe(10);
    // Last year remainingBalance should be 0
    expect(yearly[yearly.length - 1].remainingBalance).toBe(0);
  });

  it("sum of yearly principals ≈ loan amount", () => {
    const r = generateAmortizationSchedule({
      loanAmount: 100_000, annualRate: 0.03, durationMonths: 120, type: "linear",
    });
    const yearly = generateYearlySummary(r.schedule);
    const totalPrincipal = yearly.reduce((s, y) => s + y.totalPrincipal, 0);
    expect(totalPrincipal).toBeCloseTo(100_000, 0);
  });
});
