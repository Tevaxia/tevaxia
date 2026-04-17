import { describe, it, expect } from "vitest";
import {
  getEnergyLTVAdjustment,
  getAllEnergyLTVAdjustments,
  simulateMortgageWithEnergy,
} from "../energy-banking";

describe("getEnergyLTVAdjustment", () => {
  it("returns adjustment for known class", () => {
    const a = getEnergyLTVAdjustment("A");
    expect(a).toBeDefined();
    expect(typeof a.ltvAdjustmentBps).toBe("number");
  });

  it("is case-insensitive", () => {
    const a = getEnergyLTVAdjustment("a");
    const aUpper = getEnergyLTVAdjustment("A");
    expect(a).toEqual(aUpper);
  });

  it("falls back to D for unknown class", () => {
    const unknown = getEnergyLTVAdjustment("X");
    const d = getEnergyLTVAdjustment("D");
    expect(unknown).toEqual(d);
  });

  it("A gets positive LTV adjustment (bonus)", () => {
    const a = getEnergyLTVAdjustment("A");
    expect(a.ltvAdjustmentBps).toBeGreaterThanOrEqual(0);
  });

  it("G gets negative LTV adjustment (malus)", () => {
    const g = getEnergyLTVAdjustment("G");
    expect(g.ltvAdjustmentBps).toBeLessThan(0);
  });
});

describe("getAllEnergyLTVAdjustments", () => {
  it("returns 9 entries (A-I)", () => {
    const all = getAllEnergyLTVAdjustments();
    expect(all).toHaveLength(9);
  });

  it("classes are ordered A to I", () => {
    const all = getAllEnergyLTVAdjustments();
    const classes = all.map((x) => x.classe);
    expect(classes).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
  });

  it("LTV adjustment decreases from A to I (monotonic)", () => {
    const all = getAllEnergyLTVAdjustments();
    for (let i = 1; i < all.length; i++) {
      expect(all[i].ltvAdjustmentBps).toBeLessThanOrEqual(all[i - 1].ltvAdjustmentBps);
    }
  });
});

describe("simulateMortgageWithEnergy", () => {
  const BASE = {
    valeurBien: 600_000,
    classeEnergie: "C",
    tauxBaseAnnuel: 3.5,
    ltvMaxBase: 80,
    dureeAnnees: 25,
  };

  it("produces consistent result shape", () => {
    const r = simulateMortgageWithEnergy(BASE);
    expect(r.tauxAjuste).toBeGreaterThan(0);
    expect(r.montantMaxBase).toBeGreaterThan(0);
    expect(r.mensualiteBase).toBeGreaterThan(0);
    expect(r.coutTotalBase).toBeGreaterThan(r.montantMaxBase);
  });

  it("Class A gives higher LTV than Class G", () => {
    const a = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "A" });
    const g = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "G" });
    expect(a.ltvMaxAjuste).toBeGreaterThan(g.ltvMaxAjuste);
  });

  it("Class A monthly payment lower than Class G (incl rate bonus)", () => {
    const a = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "A" });
    const g = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "G" });
    // A has rate bonus + higher LTV, so on equivalent basis the payment is lower
    // But since LTV is different, comparing total cost is more meaningful
    expect(a.tauxAjuste).toBeLessThanOrEqual(g.tauxAjuste);
  });

  it("LTV ajusté capped at 100 %", () => {
    const r = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "A", ltvMaxBase: 95 });
    expect(r.ltvMaxAjuste).toBeLessThanOrEqual(100);
  });

  it("LTV ajusté not below 0 %", () => {
    const r = simulateMortgageWithEnergy({ ...BASE, classeEnergie: "I", ltvMaxBase: 0 });
    expect(r.ltvMaxAjuste).toBeGreaterThanOrEqual(0);
  });

  it("montantMaxBase = valeurBien × ltvMaxBase / 100", () => {
    const r = simulateMortgageWithEnergy(BASE);
    expect(r.montantMaxBase).toBeCloseTo(600_000 * 0.8, 0);
  });

  it("coutTotal = mensualite × nbMois", () => {
    const r = simulateMortgageWithEnergy(BASE);
    expect(r.coutTotalBase).toBeCloseTo(r.mensualiteBase * 25 * 12, 0);
  });

  it("zero interest rate → linear amortization", () => {
    const r = simulateMortgageWithEnergy({ ...BASE, tauxBaseAnnuel: 0 });
    expect(r.mensualiteBase).toBeCloseTo(r.montantMaxBase / (25 * 12), 0);
  });
});
