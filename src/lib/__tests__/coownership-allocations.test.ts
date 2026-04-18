import { describe, it, expect } from "vitest";
import {
  computeAllocation, validateKeyCode, LU_ALLOCATION_TEMPLATES,
} from "../coownership-allocations";

describe("computeAllocation", () => {
  it("répartit 10 000 € sur 3 lots (500/300/200 tantièmes → 1000 total)", () => {
    expect(computeAllocation({ totalAmount: 10000, unitShares: 500, totalShares: 1000 })).toBe(5000);
    expect(computeAllocation({ totalAmount: 10000, unitShares: 300, totalShares: 1000 })).toBe(3000);
    expect(computeAllocation({ totalAmount: 10000, unitShares: 200, totalShares: 1000 })).toBe(2000);
  });
  it("arrondit au centime", () => {
    const a = computeAllocation({ totalAmount: 1000, unitShares: 1, totalShares: 3 });
    expect(a).toBe(333.33);
  });
  it("retourne 0 si totalShares = 0", () => {
    expect(computeAllocation({ totalAmount: 1000, unitShares: 100, totalShares: 0 })).toBe(0);
  });
  it("unitShares = 0 → 0 €", () => {
    expect(computeAllocation({ totalAmount: 1000, unitShares: 0, totalShares: 1000 })).toBe(0);
  });
});

describe("validateKeyCode", () => {
  it("accepte les codes minuscules avec underscore", () => {
    expect(validateKeyCode("tantiemes_generaux")).toBeNull();
    expect(validateKeyCode("ascenseur_bat_a")).toBeNull();
    expect(validateKeyCode("escalier_1")).toBeNull();
  });
  it("rejette les majuscules", () => {
    expect(validateKeyCode("Tantiemes")).not.toBeNull();
  });
  it("rejette les espaces", () => {
    expect(validateKeyCode("ascenseur bat a")).not.toBeNull();
  });
  it("rejette les tirets", () => {
    expect(validateKeyCode("bat-a")).not.toBeNull();
  });
  it("rejette une chaîne vide", () => {
    expect(validateKeyCode("")).not.toBeNull();
    expect(validateKeyCode("   ")).not.toBeNull();
  });
  it("rejette si > 50 caractères", () => {
    expect(validateKeyCode("a".repeat(51))).not.toBeNull();
  });
});

describe("LU_ALLOCATION_TEMPLATES", () => {
  it("contient les clés LU classiques", () => {
    const codes = LU_ALLOCATION_TEMPLATES.map((t) => t.code);
    expect(codes).toContain("chauffage");
    expect(codes).toContain("ascenseur");
    expect(codes).toContain("espaces_verts");
    expect(codes).toContain("gros_travaux");
  });
  it("chaque template a un label et une description", () => {
    for (const t of LU_ALLOCATION_TEMPLATES) {
      expect(t.label.length).toBeGreaterThan(3);
      expect(t.description.length).toBeGreaterThan(10);
    }
  });
});
