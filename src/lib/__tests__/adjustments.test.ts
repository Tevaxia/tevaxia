import { describe, it, expect } from "vitest";
import {
  AJUST_ETAGE,
  AJUST_ETAT,
  AJUST_EXTERIEUR,
  calculerAjustParking,
  calculerAjustDate,
  INDICES_PRIX_ANNUELS,
} from "../adjustments";

describe("AJUST_ETAGE", () => {
  it("has reference at 0% for 2e-3e etage", () => {
    const ref = AJUST_ETAGE.find((a) => a.value === 0);
    expect(ref).toBeDefined();
    expect(ref!.labelKey).toBe("adjEtage2e3eRef");
  });

  it("attique has highest premium", () => {
    const attique = AJUST_ETAGE.find((a) => a.labelKey === "adjEtageAttique");
    expect(attique!.value).toBe(10);
  });

  it("sous-sol has biggest discount", () => {
    const sousSol = AJUST_ETAGE.find((a) => a.labelKey === "adjEtageSousSol");
    expect(sousSol!.value).toBe(-12);
  });

  it("all suggestions have range containing value", () => {
    for (const adj of AJUST_ETAGE) {
      expect(adj.value).toBeGreaterThanOrEqual(adj.range[0]);
      expect(adj.value).toBeLessThanOrEqual(adj.range[1]);
    }
  });
});

describe("AJUST_ETAT", () => {
  it("reference bon etat is 0%", () => {
    const ref = AJUST_ETAT.find((a) => a.labelKey === "adjEtatBonRef");
    expect(ref!.value).toBe(0);
  });

  it("gros travaux is biggest discount", () => {
    const gros = AJUST_ETAT.find((a) => a.labelKey === "adjEtatGrosTravaux");
    expect(gros!.value).toBe(-20);
  });
});

describe("AJUST_EXTERIEUR", () => {
  it("balcon reference is 0%", () => {
    const ref = AJUST_EXTERIEUR.find((a) => a.labelKey === "adjExtBalconRef");
    expect(ref!.value).toBe(0);
  });

  it("pas d'exterieur is negative", () => {
    const pas = AJUST_EXTERIEUR.find((a) => a.labelKey === "adjExtPasExterieur");
    expect(pas!.value).toBeLessThan(0);
  });
});

describe("calculerAjustParking", () => {
  it("returns 0 when both have parking", () => {
    expect(calculerAjustParking(true, true, 500000, false)).toBe(0);
  });

  it("returns 0 when neither has parking", () => {
    expect(calculerAjustParking(false, false, 500000, false)).toBe(0);
  });

  it("returns negative when comparable has parking but subject doesn't", () => {
    const adj = calculerAjustParking(true, false, 500000, false);
    expect(adj).toBeLessThan(0);
  });

  it("returns positive when subject has parking but comparable doesn't", () => {
    const adj = calculerAjustParking(false, true, 500000, false);
    expect(adj).toBeGreaterThan(0);
  });

  it("Lux-Ville has higher parking value", () => {
    const luxVille = calculerAjustParking(true, false, 500000, true);
    const autre = calculerAjustParking(true, false, 500000, false);
    expect(Math.abs(luxVille)).toBeGreaterThan(Math.abs(autre));
  });
});

describe("calculerAjustDate", () => {
  it("returns 0 for same date", () => {
    const { ajustement } = calculerAjustDate("2025-06", "2025-06");
    expect(ajustement).toBe(0);
  });

  it("returns positive for older comparable in rising market", () => {
    // 2020 had +8.4%, so comparable sold in 2020 needs upward adjustment
    const { ajustement } = calculerAjustDate("2020-06", "2021-06");
    expect(ajustement).toBeGreaterThan(0);
  });

  it("returns negative for older comparable in falling market", () => {
    // 2023 had -7.8%
    const { ajustement } = calculerAjustDate("2022-06", "2023-06");
    expect(ajustement).toBeLessThan(0);
  });

  it("handles multi-year adjustment", () => {
    const { ajustement } = calculerAjustDate("2020-01", "2025-06");
    // Should accumulate several years of variation
    expect(Math.abs(ajustement)).toBeGreaterThan(5);
  });

  it("handles invalid date gracefully", () => {
    const { ajustement } = calculerAjustDate("invalid", "2025-06");
    expect(ajustement).toBe(0);
  });
});

describe("INDICES_PRIX_ANNUELS", () => {
  it("has data from 2015 to 2026", () => {
    expect(INDICES_PRIX_ANNUELS[2015]).toBeDefined();
    expect(INDICES_PRIX_ANNUELS[2026]).toBeDefined();
  });

  it("2021 was the peak year", () => {
    const max = Math.max(...Object.values(INDICES_PRIX_ANNUELS));
    expect(INDICES_PRIX_ANNUELS[2021]).toBe(max);
  });

  it("2023 was negative (market correction)", () => {
    expect(INDICES_PRIX_ANNUELS[2023]).toBeLessThan(0);
  });
});
