import { describe, it, expect } from "vitest";
import {
  rechercherCommune,
  getMarketDataCommune,
  getAllCommunes,
  getAllMarketData,
  getCommunesParCanton,
  suggestComparables,
} from "../market-data";

describe("rechercherCommune", () => {
  it("returns empty for short queries", () => {
    expect(rechercherCommune("")).toEqual([]);
    expect(rechercherCommune("a")).toEqual([]);
  });

  it("finds Luxembourg by exact name", () => {
    const r = rechercherCommune("Luxembourg");
    expect(r.length).toBeGreaterThan(0);
    expect(r[0].commune.commune.toLowerCase()).toContain("luxembourg");
  });

  it("is case-insensitive", () => {
    const lower = rechercherCommune("luxembourg").length;
    const upper = rechercherCommune("LUXEMBOURG").length;
    expect(lower).toBe(upper);
  });

  it("matches on quartier when applicable", () => {
    const r = rechercherCommune("Belair");
    // Belair est un quartier de Luxembourg-Ville
    if (r.length > 0) {
      expect(r.some((x) => x.isLocalite || x.quartier)).toBe(true);
    }
  });

  it("returns no results for gibberish", () => {
    const r = rechercherCommune("XYZFAKE_BLAH");
    expect(r).toEqual([]);
  });
});

describe("getMarketDataCommune", () => {
  it("finds a known commune case-insensitive", () => {
    const c = getMarketDataCommune("luxembourg");
    expect(c).toBeDefined();
  });

  it("returns undefined for unknown commune", () => {
    expect(getMarketDataCommune("FAKE_COMMUNE")).toBeUndefined();
  });
});

describe("getAllCommunes", () => {
  it("returns a non-empty sorted list", () => {
    const list = getAllCommunes();
    expect(list.length).toBeGreaterThan(50); // LU a 100 communes, on en a beaucoup
    const sorted = [...list].sort();
    expect(list).toEqual(sorted);
  });
});

describe("getCommunesParCanton", () => {
  it("groups communes by canton", () => {
    const map = getCommunesParCanton();
    expect(Object.keys(map).length).toBeGreaterThan(5);
    Object.values(map).forEach((arr) => {
      expect(arr.length).toBeGreaterThan(0);
    });
  });

  it("Luxembourg canton contains Luxembourg commune", () => {
    const map = getCommunesParCanton();
    expect(map["Luxembourg"]).toContain("Luxembourg");
  });
});

describe("suggestComparables", () => {
  it("returns at most nbMax comparables", () => {
    const r = suggestComparables("Luxembourg", 3);
    expect(r.length).toBeLessThanOrEqual(3);
  });

  it("returns empty for unknown commune", () => {
    expect(suggestComparables("FAKE_COMMUNE", 5)).toEqual([]);
  });

  it("each suggestion has commune, prixM2, source", () => {
    const r = suggestComparables("Luxembourg", 5);
    r.forEach((s) => {
      expect(s.commune).toBeTruthy();
      expect(typeof s.prixM2).toBe("number");
      expect(s.prixM2).toBeGreaterThan(0);
      expect(s.source).toBeTruthy();
    });
  });
});


describe("official snapshot published 24 September 2026", () => {
  it("reconciles all 100 communes and the workbook totals", () => {
    const rows = getAllMarketData();
    expect(rows).toHaveLength(100);
    expect(new Set(rows.map(r => r.commune)).size).toBe(100);
    expect(rows.reduce((s, r) => s + (r.nbTransactions ?? 0), 0)).toBe(3089);
    expect(rows.reduce((s, r) => s + (r.nbVEFA ?? 0), 0)).toBe(512);
    expect(rows.every(r => !r.quartiers && r.periode === "2025-07-01 — 2026-06-30")).toBe(true);
  });
  it("preserves actual figures and official suppression", () => {
    const lux = getMarketDataCommune("Luxembourg")!;
    expect(lux.prixM2Existant).toBeCloseTo(10268.67895, 4);
    expect(lux.prixM2ExistantHorsAnnexes).toBeCloseTo(8919.88, 4);
    expect(lux.nbTransactions).toBe(613);
    expect(getMarketDataCommune("Beaufort")!.prixM2Existant).toBeNull();
    expect(getMarketDataCommune("Beaufort")!.loyerM2Annonces).toBeNull();
  });
  it("maps localities to the municipality without inventing neighborhood prices", () => {
    const belair = rechercherCommune("Belair");
    expect(belair[0].commune.commune).toBe("Luxembourg");
    expect(belair[0].quartier).toBeUndefined();
  });
});


it("uses current municipal affiliation for Ingeldorf and Gilsdorf", () => {
  expect(rechercherCommune("Ingeldorf")[0].commune.commune).toBe("Erpeldange-sur-Sûre");
  expect(rechercherCommune("Gilsdorf")[0].commune.commune).toBe("Bettendorf");
  expect(rechercherCommune("Nördstad")).toEqual([]);
});
