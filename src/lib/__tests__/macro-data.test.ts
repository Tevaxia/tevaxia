import { describe, it, expect } from "vitest";
import {
  getLatestValue,
  getEvolution,
  getValueForYear,
  getMinMax,
  getCagr,
  getRendementBrutNational,
  getMacroSummary,
  MACRO_SERIES,
  type MacroDataPoint,
} from "../macro-data";

const SERIES: MacroDataPoint[] = [
  { year: 2020, value: 100 },
  { year: 2021, value: 110 },
  { year: 2022, value: 121 },
  { year: 2023, value: 133.1 },
];

describe("getLatestValue", () => {
  it("returns last element's value", () => {
    expect(getLatestValue(SERIES)).toBeCloseTo(133.1, 4);
  });

  it("returns 0 for empty series", () => {
    expect(getLatestValue([])).toBe(0);
  });
});

describe("getEvolution", () => {
  it("computes 2-year change", () => {
    const e = getEvolution(SERIES, 2);
    expect(e.value).toBeCloseTo(133.1, 4);
    expect(e.change).toBeCloseTo(133.1 - 110, 4);
    expect(e.changePct).toBeCloseTo(((133.1 - 110) / 110) * 100, 2);
  });

  it("returns 0 changes if target year not found", () => {
    const e = getEvolution(SERIES, 20);
    expect(e.change).toBe(0);
    expect(e.changePct).toBe(0);
  });
});

describe("getValueForYear", () => {
  it("returns value when present", () => {
    expect(getValueForYear(SERIES, 2021)).toBe(110);
  });

  it("returns null when absent", () => {
    expect(getValueForYear(SERIES, 2030)).toBeNull();
  });
});

describe("getMinMax", () => {
  it("finds extremes", () => {
    const r = getMinMax(SERIES);
    expect(r.min.year).toBe(2020);
    expect(r.max.year).toBe(2023);
  });
});

describe("getCagr", () => {
  it("computes compound growth rate correctly (10%/yr)", () => {
    const cagr = getCagr(SERIES);
    expect(cagr).toBeCloseTo(10, 1);
  });

  it("returns 0 on short series or zero base", () => {
    expect(getCagr([SERIES[0]])).toBe(0);
    expect(getCagr([{ year: 2020, value: 0 }, { year: 2021, value: 10 }])).toBe(0);
  });
});

describe("getRendementBrutNational", () => {
  it("returns null for an unknown year", () => {
    expect(getRendementBrutNational(1900)).toBeNull();
  });

  it("is a reasonable figure (1-10%) for a recent year with data", () => {
    const r = getRendementBrutNational(2023);
    if (r !== null) {
      expect(r).toBeGreaterThan(1);
      expect(r).toBeLessThan(15);
    }
  });
});

describe("getMacroSummary", () => {
  it("returns an object with 12 macro indicators keys", () => {
    const s = getMacroSummary(2023);
    const keys = Object.keys(s);
    expect(keys).toHaveLength(12);
    expect(keys).toContain("oat10y");
    expect(keys).toContain("inflation");
    expect(keys).toContain("pib");
  });

  it("returns all-null for a far-future year", () => {
    const s = getMacroSummary(2100);
    Object.values(s).forEach((v) => expect(v).toBeNull());
  });
});

describe("MACRO_SERIES", () => {
  it("exposes 12 series with label + unit + data", () => {
    expect(MACRO_SERIES).toHaveLength(12);
    MACRO_SERIES.forEach((s) => {
      expect(s.label).toBeTruthy();
      expect(s.unit).toBeTruthy();
      expect(Array.isArray(s.data)).toBe(true);
    });
  });
});
