import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  sauvegarderEvaluation,
  listerEvaluations,
  chargerEvaluation,
  supprimerEvaluation,
  supprimerTout,
  listerCorbeille,
  restaurerEvaluation,
  supprimerDefinitivement,
  viderCorbeille,
  compterCorbeille,
} from "../storage";

// Polyfill minimal pour localStorage + crypto.randomUUID dans Vitest
beforeEach(() => {
  const store: Record<string, string> = {};
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => (k in store ? store[k] : null),
    setItem: (k: string, v: string) => { store[k] = v; },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    length: 0,
    key: () => null,
  });
  vi.stubGlobal("window", { localStorage: { getItem: () => null, setItem: () => {} } });
  // crypto.randomUUID est déjà disponible dans Node 20+ mais au cas où
  if (!globalThis.crypto?.randomUUID) {
    vi.stubGlobal("crypto", { randomUUID: () => `uuid-${Math.random().toString(36).slice(2)}` });
  }
});

describe("sauvegarderEvaluation", () => {
  it("saves a valuation with generated id and date", () => {
    const v = sauvegarderEvaluation({
      nom: "Test 1",
      type: "estimation",
      data: { foo: "bar" },
    });
    expect(v.id).toBeTruthy();
    expect(v.date).toBeTruthy();
    expect(v.nom).toBe("Test 1");
  });

  it("inserts newest at head", () => {
    sauvegarderEvaluation({ nom: "First", type: "estimation", data: {} });
    sauvegarderEvaluation({ nom: "Second", type: "estimation", data: {} });
    const list = listerEvaluations();
    expect(list[0].nom).toBe("Second");
    expect(list[1].nom).toBe("First");
  });
});

describe("listerEvaluations", () => {
  it("returns empty array for fresh storage", () => {
    expect(listerEvaluations()).toEqual([]);
  });

  it("returns all saved evaluations", () => {
    sauvegarderEvaluation({ nom: "A", type: "estimation", data: {} });
    sauvegarderEvaluation({ nom: "B", type: "frais", data: {} });
    expect(listerEvaluations()).toHaveLength(2);
  });
});

describe("chargerEvaluation", () => {
  it("retrieves by id", () => {
    const v = sauvegarderEvaluation({ nom: "X", type: "dcf", data: { k: 1 } });
    const found = chargerEvaluation(v.id);
    expect(found?.nom).toBe("X");
  });

  it("returns null for unknown id", () => {
    expect(chargerEvaluation("does-not-exist")).toBeNull();
  });
});

describe("supprimerEvaluation / corbeille", () => {
  it("moves to trash", () => {
    const v = sauvegarderEvaluation({ nom: "ToDelete", type: "estimation", data: {} });
    supprimerEvaluation(v.id);
    expect(listerEvaluations()).toHaveLength(0);
    expect(listerCorbeille()).toHaveLength(1);
    expect(listerCorbeille()[0].nom).toBe("ToDelete");
  });

  it("restaurerEvaluation brings back from trash", () => {
    const v = sauvegarderEvaluation({ nom: "R", type: "estimation", data: {} });
    supprimerEvaluation(v.id);
    restaurerEvaluation(v.id);
    expect(listerEvaluations().some((x) => x.id === v.id)).toBe(true);
    expect(listerCorbeille()).toHaveLength(0);
  });

  it("supprimerDefinitivement removes from trash permanently", () => {
    const v = sauvegarderEvaluation({ nom: "D", type: "estimation", data: {} });
    supprimerEvaluation(v.id);
    supprimerDefinitivement(v.id);
    expect(listerEvaluations()).toHaveLength(0);
    expect(listerCorbeille()).toHaveLength(0);
  });

  it("compterCorbeille returns the count", () => {
    sauvegarderEvaluation({ nom: "1", type: "estimation", data: {} });
    const v2 = sauvegarderEvaluation({ nom: "2", type: "estimation", data: {} });
    supprimerEvaluation(v2.id);
    expect(compterCorbeille()).toBe(1);
  });

  it("viderCorbeille empties the trash", () => {
    const v = sauvegarderEvaluation({ nom: "V", type: "estimation", data: {} });
    supprimerEvaluation(v.id);
    viderCorbeille();
    expect(listerCorbeille()).toHaveLength(0);
  });
});

describe("supprimerTout", () => {
  it("empties both valuations and trash", () => {
    sauvegarderEvaluation({ nom: "1", type: "estimation", data: {} });
    sauvegarderEvaluation({ nom: "2", type: "estimation", data: {} });
    supprimerTout();
    expect(listerEvaluations()).toHaveLength(0);
  });
});
