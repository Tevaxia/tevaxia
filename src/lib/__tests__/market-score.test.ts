import { describe, it, expect } from "vitest";
import { computeMarketScore, getScoreColor, getScoreBarColor } from "../market-score";
import type { MarketDataCommune } from "@/lib/market-data";

const mkCommune = (p: Partial<MarketDataCommune> = {}): MarketDataCommune => ({
  commune: "Test",
  canton: "Luxembourg",
  prixM2Existant: 8000,
  prixM2VEFA: 10000,
  prixM2Annonces: 8200,
  loyerM2Annonces: 25,
  nbTransactions: 60,
  periode: "2025-T4",
  source: "test",
  ...p,
});

describe("computeMarketScore", () => {
  it("returns score 0-100", () => {
    const r = computeMarketScore(mkCommune());
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("level matches score tier", () => {
    const veryActive = computeMarketScore(mkCommune({ nbTransactions: 200, loyerM2Annonces: 30 }));
    expect(veryActive.level).toBe("tres_actif");

    const calm = computeMarketScore(mkCommune({ nbTransactions: 5, prixM2Annonces: 7500, loyerM2Annonces: 15 }));
    expect(["calme", "modere"]).toContain(calm.level);
  });

  it("liquidity component scales with transactions", () => {
    const low = computeMarketScore(mkCommune({ nbTransactions: 10 }));
    const high = computeMarketScore(mkCommune({ nbTransactions: 200 }));
    const lowLiq = low.components.find((c) => c.key === "liquidite")?.score ?? 0;
    const highLiq = high.components.find((c) => c.key === "liquidite")?.score ?? 0;
    expect(highLiq).toBeGreaterThan(lowLiq);
  });

  it("positive price trend when annonces > existant + 2%", () => {
    const r = computeMarketScore(mkCommune({ prixM2Existant: 8000, prixM2Annonces: 9000 }));
    const trend = r.components.find((c) => c.key === "tendance_prix")?.score ?? 0;
    expect(trend).toBe(25);
  });

  it("negative price trend when annonces < existant - 2%", () => {
    const r = computeMarketScore(mkCommune({ prixM2Existant: 8000, prixM2Annonces: 7500 }));
    const trend = r.components.find((c) => c.key === "tendance_prix")?.score ?? 0;
    expect(trend).toBe(10);
  });

  it("yield > 4% → yield score 25", () => {
    const r = computeMarketScore(mkCommune({ prixM2Existant: 6000, loyerM2Annonces: 22 })); // 4.4%
    const y = r.components.find((c) => c.key === "rendement")?.score ?? 0;
    expect(y).toBe(25);
  });

  it("has quartiers boosts density score", () => {
    const withQ = computeMarketScore(mkCommune({
      quartiers: [{ nom: "Centre", prixM2: 9000, loyerM2: 30, tendance: "hausse", note: "CBD" }],
    }));
    const without = computeMarketScore(mkCommune({ quartiers: undefined }));
    const withScore = withQ.components.find((c) => c.key === "densite_donnees")?.score ?? 0;
    const withoutScore = without.components.find((c) => c.key === "densite_donnees")?.score ?? 0;
    expect(withScore).toBeGreaterThan(withoutScore);
  });

  it("score is sum of components", () => {
    const r = computeMarketScore(mkCommune());
    const sum = r.components.reduce((s, c) => s + c.score, 0);
    expect(r.score).toBe(sum);
  });
});

describe("getScoreColor", () => {
  it("returns a class string for every level", () => {
    for (const level of ["tres_actif", "actif", "modere", "calme"] as const) {
      expect(getScoreColor(level)).toMatch(/bg-\w+-\d+ text-\w+-\d+/);
    }
  });
});

describe("getScoreBarColor", () => {
  it("returns a bg class for every level", () => {
    for (const level of ["tres_actif", "actif", "modere", "calme"] as const) {
      expect(getScoreBarColor(level)).toMatch(/bg-\w+-\d+/);
    }
  });
});
