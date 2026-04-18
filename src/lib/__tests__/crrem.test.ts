import { describe, it, expect } from "vitest";
import {
  analyzeStranding,
  simulateRetrofit,
  getPathway,
  LU_EMISSION_FACTORS,
  type AssetInput,
} from "../crrem";

describe("CRREM pathways", () => {
  it("interpolates pathway between 2020 anchor points", () => {
    const path = getPathway("office", 2020, 2030);
    expect(path).toHaveLength(11);
    expect(path[0].year).toBe(2020);
    expect(path[10].year).toBe(2030);
    // Monotonic decrease
    for (let i = 1; i < path.length; i++) {
      expect(path[i].energyKwhM2).toBeLessThanOrEqual(path[i - 1].energyKwhM2);
    }
  });

  it("linear interpolation respects anchor values exactly", () => {
    const p = getPathway("residential_mfh", 2020, 2050);
    const y2020 = p.find((x) => x.year === 2020);
    const y2030 = p.find((x) => x.year === 2030);
    const y2050 = p.find((x) => x.year === 2050);
    expect(y2020?.energyKwhM2).toBe(168);
    expect(y2030?.energyKwhM2).toBe(112);
    expect(y2050?.energyKwhM2).toBe(30);
  });
});

describe("CRREM stranding analysis", () => {
  const baselineAsset: AssetInput = {
    name: "Test property",
    assetType: "residential_mfh",
    floorAreaM2: 100,
    energyMix: {
      natural_gas: 15000, // 150 kWh/m² → dépasse pathway 2025 (150)
      electricity_grid: 3000,
    },
    currentYear: 2026,
  };

  it("computes current intensity correctly", () => {
    const r = analyzeStranding(baselineAsset);
    // 18000 kWh total / 100 m² = 180 kWh/m²
    expect(r.currentEnergyKwhM2).toBe(180);
    // 15000 * 0.201 + 3000 * 0.079 = 3015 + 237 = 3252 → 32.52 kgCO2/m²
    expect(r.currentCarbonKgM2).toBeCloseTo(32.52, 1);
  });

  it("detects stranding year", () => {
    const r = analyzeStranding(baselineAsset);
    // 180 kWh/m² vs pathway 2026 ~143 → stranded immediately
    expect(r.strandingYear).not.toBeNull();
    expect(r.strandingYear!).toBeLessThanOrEqual(2030);
  });

  it("computes gap vs 2030 correctly", () => {
    const r = analyzeStranding(baselineAsset);
    // pathway 2030 resi_mfh = 112, asset = 180, gap = 68
    expect(r.gapEnergy2030).toBeCloseTo(68, 0);
  });

  it("returns null stranding for aligned asset", () => {
    const green: AssetInput = {
      name: "Green",
      assetType: "residential_mfh",
      floorAreaM2: 100,
      energyMix: { heat_pump_geo_cop4: 2500 }, // 25 kWh/m² <= pathway 2050 (30)
      currentYear: 2026,
    };
    const r = analyzeStranding(green);
    expect(r.strandingYear).toBeNull();
    expect(r.gapEnergy2030).toBe(0);
    expect(r.gapEnergy2050).toBe(0);
  });
});

describe("Retrofit simulation", () => {
  const heavyAsset: AssetInput = {
    name: "Heavy",
    assetType: "office",
    floorAreaM2: 500,
    energyMix: { heating_oil: 120000, electricity_grid: 30000 }, // 300 kWh/m²
    currentYear: 2026,
  };

  it("reduces energy intensity proportionally", () => {
    const r50 = simulateRetrofit(heavyAsset, {
      label: "50% reduction",
      energyReductionPct: 0.5,
    });
    expect(r50.currentEnergyKwhM2).toBeCloseTo(150, 0); // 300 * 0.5
  });

  it("switching to heat pump cuts carbon drastically", () => {
    const base = analyzeStranding(heavyAsset);
    const withHp = simulateRetrofit(heavyAsset, {
      label: "−50% + HP geo",
      energyReductionPct: 0.5,
      newEnergyMix: { heat_pump_geo_cop4: 1 },
    });
    // Heat pump geo 0.020 vs fioul 0.264 → 90 %+ réduction carbone
    expect(withHp.currentCarbonKgM2).toBeLessThan(base.currentCarbonKgM2 * 0.2);
  });

  it("PV self-consumption reduces grid consumption", () => {
    const withoutPv = simulateRetrofit(heavyAsset, {
      label: "base",
      energyReductionPct: 0.5,
      newEnergyMix: { electricity_grid: 1 },
    });
    const withPv = simulateRetrofit(heavyAsset, {
      label: "with PV",
      energyReductionPct: 0.5,
      newEnergyMix: { electricity_grid: 1 },
      pvSelfConsumptionKwh: 10000,
    });
    expect(withPv.currentEnergyKwhM2).toBeLessThan(withoutPv.currentEnergyKwhM2);
  });
});

describe("LU emission factors", () => {
  it("grid is significantly lower than EU average (79 vs ~244 g/kWh)", () => {
    expect(LU_EMISSION_FACTORS.electricity_grid).toBeLessThan(0.1);
  });

  it("heat pump geo is ~25% of grid factor", () => {
    const cop4 = LU_EMISSION_FACTORS.heat_pump_geo_cop4;
    const grid = LU_EMISSION_FACTORS.electricity_grid;
    expect(cop4).toBeCloseTo(grid / 4, 2);
  });

  it("heating oil is highest fossil factor", () => {
    expect(LU_EMISSION_FACTORS.heating_oil).toBeGreaterThan(LU_EMISSION_FACTORS.natural_gas);
  });
});
