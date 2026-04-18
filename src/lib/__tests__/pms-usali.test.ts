import { describe, it, expect } from "vitest";
import {
  computeOccupancy, computeADR, computeRevPAR, yoyDelta, monthLabel,
  USALI_DEPARTMENT_MAP, CATEGORY_LABELS_EN,
} from "../pms/usali";

describe("computeOccupancy", () => {
  it("50 rooms sold / 100 available → 50%", () => {
    expect(computeOccupancy(50, 100)).toBe(50);
  });
  it("arrondit à 2 décimales", () => {
    expect(computeOccupancy(1, 3)).toBe(33.33);
  });
  it("0 available → 0", () => {
    expect(computeOccupancy(50, 0)).toBe(0);
  });
});

describe("computeADR", () => {
  it("10 000€ / 50 = 200", () => {
    expect(computeADR(10000, 50)).toBe(200);
  });
  it("0 rooms → 0", () => {
    expect(computeADR(10000, 0)).toBe(0);
  });
});

describe("computeRevPAR", () => {
  it("10 000€ / 100 rooms available = 100", () => {
    expect(computeRevPAR(10000, 100)).toBe(100);
  });
  it("exemple avec ADR 150 occupancy 60%", () => {
    // 150 ADR × 60% = 90 RevPAR
    // 9000 revenue / 100 available = 90
    expect(computeRevPAR(9000, 100)).toBe(90);
  });
});

describe("yoyDelta", () => {
  it("+10% YoY", () => {
    const r = yoyDelta(110, 100);
    expect(r?.abs).toBe(10);
    expect(r?.pct).toBe(10);
  });
  it("-5% YoY", () => {
    const r = yoyDelta(95, 100);
    expect(r?.abs).toBe(-5);
    expect(r?.pct).toBe(-5);
  });
  it("previous null → null", () => {
    expect(yoyDelta(100, null)).toBeNull();
    expect(yoyDelta(100, undefined)).toBeNull();
  });
  it("previous 0 → pct null", () => {
    const r = yoyDelta(100, 0);
    expect(r?.abs).toBe(100);
    expect(r?.pct).toBeNull();
  });
});

describe("USALI_DEPARTMENT_MAP", () => {
  it("Rooms contient room + extra_bed", () => {
    expect(USALI_DEPARTMENT_MAP.Rooms).toContain("room");
    expect(USALI_DEPARTMENT_MAP.Rooms).toContain("extra_bed");
  });
  it("F&B ne contient pas room", () => {
    expect(USALI_DEPARTMENT_MAP["Food & Beverage"]).not.toContain("room");
    expect(USALI_DEPARTMENT_MAP["Food & Beverage"]).toContain("dinner");
  });
  it("Other taxes = taxe_sejour", () => {
    expect(USALI_DEPARTMENT_MAP["Other taxes"]).toEqual(["taxe_sejour"]);
  });
});

describe("CATEGORY_LABELS_EN", () => {
  it("labels anglais pour USALI (standard international)", () => {
    expect(CATEGORY_LABELS_EN.room).toBe("Room");
    expect(CATEGORY_LABELS_EN.breakfast).toBe("Breakfast");
    expect(CATEGORY_LABELS_EN.taxe_sejour).toBe("City tax");
  });
});

describe("monthLabel", () => {
  it("avril 2026 en fr-LU", () => {
    const l = monthLabel(2026, 4);
    expect(l.toLowerCase()).toContain("avril");
    expect(l).toContain("2026");
  });
});
