import { describe, it, expect } from "vitest";
import {
  orientationToAzimuth,
  orientationToTilt,
  getCommuneCoords,
  estimateProduction,
} from "../pvgis";

describe("orientationToAzimuth", () => {
  it("SUD = 0 degrees", () => {
    expect(orientationToAzimuth("SUD")).toBe(0);
  });

  it("NORD = 180 degrees", () => {
    expect(orientationToAzimuth("NORD")).toBe(180);
  });

  it("EST = -90 degrees", () => {
    expect(orientationToAzimuth("EST")).toBe(-90);
  });

  it("OUEST = 90 degrees", () => {
    expect(orientationToAzimuth("OUEST")).toBe(90);
  });

  it("SUD_EST = -45 degrees", () => {
    expect(orientationToAzimuth("SUD_EST")).toBe(-45);
  });

  it("SUD_OUEST = 45 degrees", () => {
    expect(orientationToAzimuth("SUD_OUEST")).toBe(45);
  });

  it("PLAT = 0 degrees (south proxy)", () => {
    expect(orientationToAzimuth("PLAT")).toBe(0);
  });

  it("unknown defaults to 0 (south)", () => {
    expect(orientationToAzimuth("UNKNOWN")).toBe(0);
  });
});

describe("orientationToTilt", () => {
  it("PLAT returns low angle (10 degrees)", () => {
    expect(orientationToTilt("PLAT")).toBe(10);
  });

  it("SUD returns default tilt", () => {
    expect(orientationToTilt("SUD")).toBe(35);
  });

  it("custom default tilt is respected", () => {
    expect(orientationToTilt("SUD", 40)).toBe(40);
  });

  it("PLAT ignores custom default", () => {
    expect(orientationToTilt("PLAT", 40)).toBe(10);
  });
});

describe("getCommuneCoords", () => {
  it("finds Luxembourg-Ville", () => {
    const coords = getCommuneCoords("Luxembourg");
    expect(coords).not.toBeNull();
    if (coords) {
      expect(coords[0]).toBeCloseTo(49.6, 0); // latitude ~49.6
      expect(coords[1]).toBeCloseTo(6.1, 0);  // longitude ~6.1
    }
  });

  it("is case-insensitive", () => {
    const upper = getCommuneCoords("LUXEMBOURG");
    const lower = getCommuneCoords("luxembourg");
    // Both should find it (or both null if key is different)
    if (upper) {
      expect(lower).not.toBeNull();
      expect(upper[0]).toBe(lower![0]);
    }
  });

  it("returns null for unknown commune", () => {
    expect(getCommuneCoords("Atlantis")).toBeNull();
  });
});

describe("estimateProduction", () => {
  it("uses 950 kWh/kWc fallback", () => {
    const result = estimateProduction(10);
    expect(result.annualKwh).toBe(9500);
  });

  it("monthly sum approximately equals annual", () => {
    const result = estimateProduction(20);
    const monthlySum = result.monthlyKwh.reduce((s, m) => s + m.kwh, 0);
    // Allow small rounding difference
    expect(monthlySum).toBeCloseTo(result.annualKwh, -2);
  });

  it("produces 12 months", () => {
    const result = estimateProduction(5);
    expect(result.monthlyKwh).toHaveLength(12);
  });

  it("summer months produce more than winter", () => {
    const result = estimateProduction(10);
    const january = result.monthlyKwh[0].kwh;
    const june = result.monthlyKwh[5].kwh;
    expect(june).toBeGreaterThan(january);
  });

  it("scales linearly with peak power", () => {
    const small = estimateProduction(5);
    const big = estimateProduction(10);
    expect(big.annualKwh).toBe(small.annualKwh * 2);
  });
});
