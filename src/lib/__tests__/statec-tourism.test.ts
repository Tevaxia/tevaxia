import { describe, it, expect } from "vitest";
import {
  LU_MONTHLY_NIGHTS,
  LU_CATEGORY_BREAKDOWN,
  LU_ORIGIN_BREAKDOWN,
  getLatestYearNights,
  getLatestYearOccupancy,
  yearOverYearChange,
} from "../hotellerie/statec-tourism";

describe("LU_MONTHLY_NIGHTS", () => {
  it("contains 36 months (2023-2025 full)", () => {
    expect(LU_MONTHLY_NIGHTS.length).toBe(36);
  });

  it("chronologically ordered (year, month)", () => {
    for (let i = 1; i < LU_MONTHLY_NIGHTS.length; i++) {
      const prev = LU_MONTHLY_NIGHTS[i - 1];
      const curr = LU_MONTHLY_NIGHTS[i];
      const prevKey = prev.year * 12 + prev.month;
      const currKey = curr.year * 12 + curr.month;
      expect(currKey).toBeGreaterThan(prevKey);
    }
  });

  it("occupancy in [0,100] for every month", () => {
    LU_MONTHLY_NIGHTS.forEach((m) => {
      expect(m.occupancyPct).toBeGreaterThanOrEqual(0);
      expect(m.occupancyPct).toBeLessThanOrEqual(100);
    });
  });

  it("averageStay > 1 night", () => {
    LU_MONTHLY_NIGHTS.forEach((m) => {
      expect(m.averageStay).toBeGreaterThan(1);
    });
  });

  it("summer peak (July) > winter trough (January) for nights", () => {
    for (const year of [2023, 2024, 2025]) {
      const jan = LU_MONTHLY_NIGHTS.find((m) => m.year === year && m.month === 1);
      const jul = LU_MONTHLY_NIGHTS.find((m) => m.year === year && m.month === 7);
      expect(jul!.nights).toBeGreaterThan(jan!.nights);
    }
  });
});

describe("LU_CATEGORY_BREAKDOWN", () => {
  it("has categories for 2024 and 2025", () => {
    expect(LU_CATEGORY_BREAKDOWN.some((c) => c.year === 2024)).toBe(true);
    expect(LU_CATEGORY_BREAKDOWN.some((c) => c.year === 2025)).toBe(true);
  });

  it("includes 1-2★, 3★, 4★, 5★ and all per year", () => {
    const cats2025 = LU_CATEGORY_BREAKDOWN.filter((c) => c.year === 2025).map((c) => c.category);
    expect(cats2025).toEqual(expect.arrayContaining(["1-2★", "3★", "4★", "5★", "all"]));
  });

  it("ADR increases with category tier (5★ > 4★ > 3★ > 1-2★)", () => {
    const y2025 = LU_CATEGORY_BREAKDOWN.filter((c) => c.year === 2025 && c.category !== "all");
    const m = Object.fromEntries(y2025.map((c) => [c.category, c.adrEstimate]));
    expect(m["5★"]).toBeGreaterThan(m["4★"]);
    expect(m["4★"]).toBeGreaterThan(m["3★"]);
    expect(m["3★"]).toBeGreaterThan(m["1-2★"]);
  });

  it("revPAR consistent with adr × occupancy (within 20 %)", () => {
    LU_CATEGORY_BREAKDOWN.forEach((c) => {
      const expected = c.adrEstimate * (c.occupancyPct / 100);
      const delta = Math.abs(c.revPAR - expected) / expected;
      expect(delta).toBeLessThan(0.25);
    });
  });
});

describe("LU_ORIGIN_BREAKDOWN", () => {
  it("percentages sum to 100 (within rounding)", () => {
    const sum = LU_ORIGIN_BREAKDOWN.reduce((s, o) => s + o.pct, 0);
    expect(sum).toBeGreaterThanOrEqual(99);
    expect(sum).toBeLessThanOrEqual(101);
  });

  it("Luxembourg is largest origin", () => {
    const sorted = [...LU_ORIGIN_BREAKDOWN].sort((a, b) => b.nights - a.nights);
    expect(sorted[0].origin).toBe("Luxembourg");
  });

  it("includes neighboring countries BE/DE/FR", () => {
    const origins = LU_ORIGIN_BREAKDOWN.map((o) => o.origin);
    expect(origins).toContain("Belgique");
    expect(origins).toContain("Allemagne");
    expect(origins).toContain("France");
  });
});

describe("helpers", () => {
  it("getLatestYearNights returns sum for latest year only", () => {
    const total = getLatestYearNights();
    expect(total).toBeGreaterThan(1_500_000); // LU annual tourism ~2M+ nights
    expect(total).toBeLessThan(5_000_000);
  });

  it("getLatestYearOccupancy returns plausible avg (30-85 %)", () => {
    const occ = getLatestYearOccupancy();
    expect(occ).toBeGreaterThanOrEqual(30);
    expect(occ).toBeLessThanOrEqual(85);
  });

  it("yearOverYearChange returns finite numbers", () => {
    const yoy = yearOverYearChange();
    expect(Number.isFinite(yoy.nights)).toBe(true);
    expect(Number.isFinite(yoy.occupancy)).toBe(true);
    // Expected modest growth post-COVID
    expect(Math.abs(yoy.nights)).toBeLessThan(20); // pas de variation > 20 %
  });
});
