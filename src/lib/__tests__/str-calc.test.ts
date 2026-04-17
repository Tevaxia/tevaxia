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
  vacancyDaysBetween: 2,
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

  it("caps nights at 365", () => {
    const r = calculerRentabiliteSTR({ ...BASE_INPUT, nightsPerYear: 500 });
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
    strNet: 12_000,
    ltMonthlyRent: 1_800,
    ltMarginalTaxRate: 0.3,
    ltDeductibleChargesAnnual: 5_000,
    mixedStrDays: 60,
    mixedLtMonths: 9,
  };

  it("recommends STR if net is highest", () => {
    const r = calculerArbitrageSTR({ ...base, strNet: 30_000 });
    expect(r.recommendation).toBe("str");
  });

  it("recommends LT when STR net is lower than LT", () => {
    const r = calculerArbitrageSTR({ ...base, strNet: 3_000, ltMonthlyRent: 2_500 });
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
    expect(r.actions.some((a) => a.toLowerCase().includes("licence"))).toBe(true);
  });

  it("high-regulation commune = high risk", () => {
    const r = checkSTRCompliance({ ...base, commune: "Luxembourg" });
    expect(r.communeRegulationRisk).toBe("high");
  });

  it("medium-regulation commune = medium risk", () => {
    const r = checkSTRCompliance({ ...base, commune: "Mamer" });
    expect(r.communeRegulationRisk).toBe("medium");
  });

  it("unknown commune defaults to low risk", () => {
    const r = checkSTRCompliance({ ...base, commune: "Redange" });
    expect(r.communeRegulationRisk).toBe("low");
  });

  it("revenue > 600 triggers tax declaration", () => {
    const r = checkSTRCompliance({ ...base, annualRevenueEstimated: 700 });
    expect(r.requiresTaxDeclaration).toBe(true);
  });

  it("revenue ≤ 600 skips tax declaration flag", () => {
    const r = checkSTRCompliance({ ...base, annualRevenueEstimated: 400 });
    expect(r.requiresTaxDeclaration).toBe(false);
  });

  it("EU 2024/1028 applies to everyone from mid-2026", () => {
    const r = checkSTRCompliance(base);
    expect(r.euRegulationCompliance.registrationRequired).toBe(true);
    expect(r.euRegulationCompliance.effectiveDate).toContain("2026");
  });

  it("societe owner triggers TVA check action", () => {
    const r = checkSTRCompliance({ ...base, ownerType: "societe" });
    expect(r.actions.some((a) => a.toLowerCase().includes("tva"))).toBe(true);
  });
});
