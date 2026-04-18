import { describe, it, expect } from "vitest";
import { runScreening, evaluateSubstantialContribution, epcClassIsAorB } from "../taxonomy";

describe("EU Taxonomy — Substantial Contribution Climate Mitigation", () => {
  it("post-2020 passes with PED below nZEB - 10%", () => {
    const r = evaluateSubstantialContribution({
      activity: "7.7",
      buildYear: "after_2021",
      pedKwhM2: 40,
      nzebThresholdKwhM2: 45, // −10% = 40.5
    });
    expect(r.passed).toBe(true);
    expect(r.path).toBe("nzeb_minus_10");
  });

  it("post-2020 fails if PED above nZEB - 10%", () => {
    const r = evaluateSubstantialContribution({
      activity: "7.7",
      buildYear: "after_2021",
      pedKwhM2: 50,
      nzebThresholdKwhM2: 45,
    });
    expect(r.passed).toBe(false);
  });

  it("pre-2021 passes via top 15% local threshold", () => {
    const r = evaluateSubstantialContribution({
      activity: "7.7",
      buildYear: "before_2021_top15",
      pedKwhM2: 70,
      top15PctThresholdKwhM2: 75,
      epcClass: "D",
    });
    expect(r.passed).toBe(true);
    expect(r.path).toBe("top_15_pct");
  });

  it("pre-2021 passes via EPC A or B", () => {
    const r = evaluateSubstantialContribution({
      activity: "7.7",
      buildYear: "before_2021_epca",
      epcClass: "B",
    });
    expect(r.passed).toBe(true);
    expect(r.path).toBe("epc_a_b");
  });

  it("pre-2021 fails if EPC C/D and no top-15% proof", () => {
    const r = evaluateSubstantialContribution({
      activity: "7.7",
      buildYear: "before_2021_other",
      epcClass: "D",
      pedKwhM2: 120,
      top15PctThresholdKwhM2: 75,
    });
    expect(r.passed).toBe(false);
  });
});

describe("EPC helper", () => {
  it("identifies A+/A/B as A-or-B", () => {
    expect(epcClassIsAorB("A+")).toBe(true);
    expect(epcClassIsAorB("A")).toBe(true);
    expect(epcClassIsAorB("B")).toBe(true);
  });
  it("rejects C and below", () => {
    expect(epcClassIsAorB("C")).toBe(false);
    expect(epcClassIsAorB("G")).toBe(false);
    expect(epcClassIsAorB("I")).toBe(false);
  });
});

describe("Full Taxonomy screening", () => {
  const baseInput = {
    sc: {
      activity: "7.7" as const,
      buildYear: "after_2021" as const,
      pedKwhM2: 40,
      nzebThresholdKwhM2: 45,
      epcClass: "A" as const,
    },
    dnsh: {
      climateRiskAssessed: true,
      adaptationPlan: true,
      waterEfficient: true,
      circularCDWaste: true,
      pollutionControlled: true,
      biodiversityProtected: true,
    },
    minimumSafeguards: {
      oecdCompliance: true,
      unGuidingPrinciples: true,
      ilo: true,
      humanRights: true,
    },
  };

  it("aligns when all checks pass", () => {
    const r = runScreening(baseInput);
    expect(r.aligned).toBe(true);
    expect(r.score).toBe(100);
    expect(r.recommendations).toHaveLength(0);
  });

  it("not aligned if DNSH axis missing, adds recommendation", () => {
    const r = runScreening({
      ...baseInput,
      dnsh: { ...baseInput.dnsh, waterEfficient: false },
    });
    expect(r.aligned).toBe(false);
    expect(r.score).toBeLessThan(100);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it("score formula : 40 SC + 40 DNSH + 20 MS", () => {
    // SC pass + 0 DNSH + 0 MS = 40
    const r = runScreening({
      ...baseInput,
      dnsh: {
        climateRiskAssessed: false, adaptationPlan: false, waterEfficient: false,
        circularCDWaste: false, pollutionControlled: false, biodiversityProtected: false,
      },
      minimumSafeguards: {
        oecdCompliance: false, unGuidingPrinciples: false, ilo: false, humanRights: false,
      },
    });
    expect(r.score).toBe(40);
  });
});
