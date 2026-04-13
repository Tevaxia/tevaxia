import { describe, it, expect } from "vitest";
import { estimerCoutsRenovation } from "../renovation-costs";

describe("estimerCoutsRenovation", () => {
  it("returns empty result for unknown class jump", () => {
    const result = estimerCoutsRenovation("A", "A", 100);
    expect(result.postes).toHaveLength(0);
    expect(result.totalMoyen).toBe(0);
  });

  it("calculates G→B renovation for 120m² (1980 build)", () => {
    const result = estimerCoutsRenovation("G", "B", 120, 1980);
    // G→B needs: facade, toiture, sol, fenetres, chauffage, ventilation, solaire_thermique
    expect(result.postes).toHaveLength(7);
    expect(result.totalMin).toBeGreaterThan(0);
    expect(result.totalMax).toBeGreaterThan(result.totalMin);
    expect(result.totalMoyen).toBeCloseTo((result.totalMin + result.totalMax) / 2, 0);
    // Honoraires = 10% of totalMoyen
    expect(result.honoraires).toBe(Math.round(result.totalMoyen * 0.10));
    expect(result.totalAvecHonoraires).toBe(result.totalMoyen + result.honoraires);
    expect(result.dureeEstimeeMois).toBeGreaterThanOrEqual(3);
  });

  it("applies age factor for pre-1945 buildings", () => {
    const recent = estimerCoutsRenovation("F", "D", 100, 2000);
    const old = estimerCoutsRenovation("F", "D", 100, 1930);
    // Pre-1945 → factor 1.30 vs post-1995 → factor 1.00
    expect(old.totalMoyen).toBeGreaterThan(recent.totalMoyen);
    // 30% more expensive
    expect(old.totalMoyen / recent.totalMoyen).toBeCloseTo(1.30, 1);
  });

  it("scales linearly with surface", () => {
    const small = estimerCoutsRenovation("E", "C", 80, 2000);
    const big = estimerCoutsRenovation("E", "C", 160, 2000);
    expect(big.totalMoyen).toBeCloseTo(small.totalMoyen * 2, -2);
  });

  it("B→A is minimal (only PV + ventilation)", () => {
    const result = estimerCoutsRenovation("B", "A", 100, 2010);
    expect(result.postes).toHaveLength(2);
    const labels = result.postes.map((p) => p.labelKey);
    expect(labels).toContain("renovSolairePV");
    expect(labels).toContain("renovVentilation");
  });

  it("D→C is a small jump (facade + fenetres only)", () => {
    const result = estimerCoutsRenovation("D", "C", 100, 2000);
    expect(result.postes).toHaveLength(2);
  });
});
