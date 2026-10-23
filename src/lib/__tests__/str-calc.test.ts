import { describe, it, expect } from "vitest";
import {
  calculerRentabiliteSTR,
  calculerArbitrageSTR,
  checkSTRCompliance,
  STR_LICENSE_THRESHOLD_DAYS,
  STR_DEFAULT_COSTS,
  type StrRentabiliteInputs,
} from "../str-calc";

const BASE_INPUT: StrRentabiliteInputs = {
  commune: "Luxembourg",
  surface: 60,
  capacity: 4,
  adr: 130,
  occupancyPct: 65,
  nightsPerYear: 237, // ≈ 65 %
  otaChannel: "airbnb",
  variable: STR_DEFAULT_COSTS,
  fixed: {
    pnoInsuranceAnnual: 800,
    internetTvAnnual: 420,
    utilitiesAnnual: 2_400,
    furnitureAmortAnnual: 1_200,
    subscriptionFees: 360,
  },
  userMarginalTaxRate: 0.3,
  vacancyDaysBetween: 1,
};

describe("calculerRentabiliteSTR", () => {
  it("computes gross revenue as adr * nights", () => {
    const r = calculerRentabiliteSTR(BASE_INPUT);
    expect(r.grossRevenue).toBe(130 * 237);
  });

  it("applies airbnb 15% commission", () => {
    const r = calculerRentabiliteSTR(BASE_INPUT);
    expect(Math.abs(r.otaCommission - r.grossRevenue * 0.15)).toBeLessThanOrEqual(1);
  });

  it("direct channel has zero commission", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, otaChannel: "direct" });
    expect(r.otaCommission).toBe(0);
    expect(r.revenueAfterOta).toBe(r.grossRevenue);
  });

  it("allows commission override", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, otaCommissionOverride: 0.05 });
    expect(Math.abs(r.otaCommission - r.grossRevenue * 0.05)).toBeLessThanOrEqual(1);
  });

  it("caps nights at 365 with no gap between stays", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, nightsPerYear: 500, vacancyDaysBetween: 0 });
    expect(r.grossRevenue).toBe(130 * 365);
  });

  it("netAfterTax is below netBeforeTax when profitable", () => {
    const r = calculerRentabiliteSTR(BASE_INPUT);
    expect(r.netAfterTax).toBeLessThan(r.netBeforeTax);
    expect(r.estimatedTax).toBeGreaterThan(0);
  });

  it("applies zero tax on losses", () => {
    const r = calculerRentabiliteSTR({
      ...BASE_INPUT,
      nightsPerYear: 20,
      fixed: { ...BASE_INPUT.fixed, subscriptionFees: 10_000 },
    });
    expect(r.netBeforeTax).toBeLessThan(0);
    expect(r.estimatedTax).toBe(0);
  });

  it("computes yields when acquisitionPrice given", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, acquisitionPrice: 600_000 });
    expect(r.grossYieldPct).toBeDefined();
    expect(r.netYieldPct).toBeDefined();
    expect(r.grossYieldPct).toBeGreaterThan(r.netYieldPct!);
  });

  it("costRatioPct is 0 on zero revenue", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, adr: 0, nightsPerYear: 0 });
    expect(r.costRatioPct).toBe(0);
  });

  it("revPAR = grossRevenue / 365", () => {
    const r = calculerRentabiliteSTR(BASE_INPUT);
    expect(r.revPAR).toBeCloseTo(r.grossRevenue / 365, 2);
  });
});

describe("calculerArbitrageSTR", () => {
  const base = {
    strInputs: BASE_INPUT,
    ltMonthlyRent: 1_800,
    ltMarginalTaxRate: 0.3,
    ltDeductibleChargesAnnual: 5_000,
    mixedStrDays: 60,
    mixedLtMonths: 9,
  };

  it("recommends STR if net is highest", () => {
    const r = calculerArbitrageSTR({ ...base, strInputs: { ...BASE_INPUT, adr: 500 } });
    expect(r.recommendation).toBe("str");
  });

  it("recommends LT when STR net is lower than LT", () => {
    const r = calculerArbitrageSTR({ ...base, strInputs: { ...BASE_INPUT, adr: 30 }, ltMonthlyRent: 2_500 });
    expect(["lt", "mixed"]).toContain(r.recommendation);
    expect(r.scenarioLT.netAnnual).toBeGreaterThan(r.scenarioSTR.netAnnual);
  });

  it("mixedTotal is additive of STR + LT portions", () => {
    const r = calculerArbitrageSTR(base);
    expect(r.scenarioMixed.totalNet).toBe(
      r.scenarioMixed.strNet + r.scenarioMixed.ltNet,
    );
  });

  it("deltaBestVsWorst is non-negative", () => {
    const r = calculerArbitrageSTR(base);
    expect(r.deltaBestVsWorst).toBeGreaterThanOrEqual(0);
  });
});

describe("checkSTRCompliance", () => {
  const base = {
    nightsPlannedPerYear: 60,
    commune: "Strassen",
    isPrimaryResidence: false,
    ownerType: "particulier" as const,
    annualRevenueEstimated: 8_000,
  };

  it("below threshold does not require license", () => {
    const r = checkSTRCompliance(base);
    expect(r.requiresLicense).toBe(false);
    expect(r.licenseThresholdMargin).toBe(STR_LICENSE_THRESHOLD_DAYS - 60);
  });

  it("above 90 nights requires license", () => {
    const r = checkSTRCompliance({ ...base, nightsPlannedPerYear: 120 });
    expect(r.requiresLicense).toBe(true);
    expect(r.actions.some((a) => a === "license")).toBe(true);
  });

  it.each(["Luxembourg", "Mamer", "Redange"])("does not invent a local risk score for %s", commune => {
    expect(checkSTRCompliance({ ...base, commune }).communeRegulationRisk).toBe("unverified");
  });
  it.each([0, 400, 700, 8000])("does not decide household filing obligations from %s gross receipts", annualRevenueEstimated => {
    expect(checkSTRCompliance({ ...base, annualRevenueEstimated }).requiresTaxDeclaration).toBeNull();
  });
  it("uses the inclusive 90-night threshold for operator-wide totals", () => {
    expect(checkSTRCompliance({ ...base, nightsPlannedPerYear: 90 }).requiresLicense).toBe(true);
    expect(checkSTRCompliance({ ...base, nightsPlannedPerYear: 800 }).requiresLicense).toBe(true);
  });
  it("makes EU obligations conditional on local registration procedures", () => {
    const r = checkSTRCompliance(base);
    expect(r.euRegulationCompliance.registrationRequired).toBeNull();
    expect(r.euRegulationCompliance.dataTransmissionRequired).toBeNull();
    expect(r.euRegulationCompliance.effectiveDate).toBe("2026-05-20");
  });

  it("societe owner triggers TVA check action", () => {
    const r = checkSTRCompliance({ ...base, ownerType: "societe" });
    expect(r.actions.some((a) => a === "vat")).toBe(true);
  });
});


describe("STR audit financial/calendar invariants", () => {
  it("pays long-term charges once in economic net and once as a tax-base deduction", () => {
    const result = calculerArbitrageSTR({strInputs: BASE_INPUT, ltMonthlyRent: 2000,
      ltDeductibleChargesAnnual: 6000, ltMarginalTaxRate: .3, mixedStrDays: 60, mixedLtMonths: 9});
    expect(result.scenarioLT).toEqual({ grossAnnual: 24000, charges: 6000, tax: 5400, netAnnual: 12600 });
  });
  it("constrains every stay and intervening vacancy to the available calendar", () => {
    const normal = calculerRentabiliteSTR({ ...BASE_INPUT, nightsPerYear: 219, vacancyDaysBetween: 1 });
    const gaps = calculerRentabiliteSTR({ ...BASE_INPUT, nightsPerYear: 219, vacancyDaysBetween: 10 });
    expect(normal.effectiveNights).toBe(219);
    expect(gaps.effectiveNights).toBe(85); // 29 stays, 28 ten-day gaps = 365 days
    expect(gaps.calendarDaysUsed).toBeLessThanOrEqual(365);
    expect(gaps.calendarLimited).toBe(true);
    expect(gaps.grossRevenue).toBeLessThan(normal.grossRevenue);
  });
  it.each([0, -1, NaN, Infinity])("rejects invalid average stay %s", avgStayLengthDays => {
    expect(() => calculerRentabiliteSTR({...BASE_INPUT, variable:{ ...BASE_INPUT.variable, avgStayLengthDays }})).toThrow(RangeError);
  });
  it("rejects overlapping calendars", () => {
    expect(() => calculerArbitrageSTR({strInputs: BASE_INPUT, ltMonthlyRent:2000, ltDeductibleChargesAnnual:6000,
      ltMarginalTaxRate:.3, mixedStrDays:90, mixedLtMonths:12})).toThrow(/one year/);
  });
  it("recomputes mixed stays and retains annual fixed charges", () => {
    const strInputs = { ...BASE_INPUT, adr:100, occupancyPct:100, otaChannel:'direct' as const, vacancyDaysBetween:0,
      variable:{ cleaningPerStay:0, linenPerStay:0, consumablesPerStay:0, avgStayLengthDays:3 },
      fixed:{ pnoInsuranceAnnual:1000, internetTvAnnual:0, utilitiesAnnual:0, furnitureAmortAnnual:0, subscriptionFees:0 }, userMarginalTaxRate:0 };
    const r=calculerArbitrageSTR({strInputs,ltMonthlyRent:1000,ltDeductibleChargesAnnual:1000,ltMarginalTaxRate:0,mixedStrDays:90,mixedLtMonths:9});
    expect(r.scenarioMixed).toEqual({ strNet:8000, ltNet:8000, totalNet:16000, effectiveStrNights:90 });
  });
});
