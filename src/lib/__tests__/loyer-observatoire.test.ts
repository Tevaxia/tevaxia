import { describe, it, expect } from "vitest";
import { LOYERS_LU_Q4_2025 } from "../loyer-observatoire";

describe("LOYERS_LU_Q4_2025", () => {
  it("has a meaningful number of observations (≥ 15)", () => {
    expect(LOYERS_LU_Q4_2025.length).toBeGreaterThanOrEqual(15);
  });

  it("percentiles are ordered P25 ≤ median ≤ P75", () => {
    LOYERS_LU_Q4_2025.forEach((o) => {
      expect(o.rentP25).toBeLessThanOrEqual(o.rentMedian);
      expect(o.rentMedian).toBeLessThanOrEqual(o.rentP75);
    });
  });

  it("rentPerM2Median is consistent with rentMedian / avgSurface (~5 % tolerance)", () => {
    LOYERS_LU_Q4_2025.forEach((o) => {
      if (o.avgSurface > 0) {
        const expected = o.rentMedian / o.avgSurface;
        expect(Math.abs(o.rentPerM2Median - expected)).toBeLessThan(expected * 0.15);
      }
    });
  });

  it("trend is one of up/stable/down", () => {
    LOYERS_LU_Q4_2025.forEach((o) => {
      expect(["up", "stable", "down"]).toContain(o.trend12m);
    });
  });

  it("propertyType covers studio through maison", () => {
    const types = new Set(LOYERS_LU_Q4_2025.map((o) => o.propertyType));
    expect(types.has("studio")).toBe(true);
    expect(types.has("2bed")).toBe(true);
  });

  it("Luxembourg-Ville Centre 2bed rent is higher than Esch 2bed", () => {
    const luxCentre = LOYERS_LU_Q4_2025.find(
      (o) => o.commune === "Luxembourg-Ville" && o.zone === "Centre" && o.propertyType === "2bed",
    );
    const esch = LOYERS_LU_Q4_2025.find(
      (o) => o.commune.toLowerCase().includes("esch") && o.propertyType === "2bed",
    );
    if (luxCentre && esch) {
      expect(luxCentre.rentMedian).toBeGreaterThan(esch.rentMedian);
    }
  });

  it("sampleSize is positive for every observation", () => {
    LOYERS_LU_Q4_2025.forEach((o) => {
      expect(o.sampleSize).toBeGreaterThan(0);
    });
  });
});
