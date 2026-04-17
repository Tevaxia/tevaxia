import { describe, it, expect } from "vitest";
import { ASSET_TYPES, EVS_VALUE_TYPES, getAssetTypeConfig } from "../asset-types";

describe("EVS_VALUE_TYPES", () => {
  it("exposes 6 EVS bases of value (EVS1-EVS6)", () => {
    expect(EVS_VALUE_TYPES).toHaveLength(6);
    const evsLabels = EVS_VALUE_TYPES.map((v) => v.evs);
    expect(evsLabels).toEqual(["EVS1", "EVS2", "EVS3", "EVS4", "EVS5", "EVS6"]);
  });

  it("every entry has labelKey and descriptionKey", () => {
    EVS_VALUE_TYPES.forEach((v) => {
      expect(v.labelKey).toBeTruthy();
      expect(v.descriptionKey).toBeTruthy();
    });
  });
});

describe("ASSET_TYPES", () => {
  it("includes 8 canonical asset types", () => {
    const ids = ASSET_TYPES.map((a) => a.id);
    expect(ids).toContain("residential_apartment");
    expect(ids).toContain("residential_house");
    expect(ids).toContain("residential_building");
    expect(ids).toContain("office");
    expect(ids).toContain("retail");
    expect(ids).toContain("hotel");
    expect(ids).toContain("logistics");
    expect(ids).toContain("land");
  });

  it("cap rate ranges are ordered min ≤ default ≤ max (or all zero for land)", () => {
    ASSET_TYPES.forEach((a) => {
      const d = a.defaults;
      expect(d.capRateMin).toBeLessThanOrEqual(d.capRateDefault);
      expect(d.capRateDefault).toBeLessThanOrEqual(d.capRateMax);
    });
  });

  it("vacancy rates are percentages (0-100)", () => {
    ASSET_TYPES.forEach((a) => {
      expect(a.defaults.vacancyRate).toBeGreaterThanOrEqual(0);
      expect(a.defaults.vacancyRate).toBeLessThanOrEqual(100);
    });
  });

  it("hotel has highest cap rate + vacancy (seasonality + risk)", () => {
    const hotel = ASSET_TYPES.find((a) => a.id === "hotel")!;
    const apart = ASSET_TYPES.find((a) => a.id === "residential_apartment")!;
    expect(hotel.defaults.capRateDefault).toBeGreaterThan(apart.defaults.capRateDefault);
    expect(hotel.defaults.vacancyRate).toBeGreaterThan(apart.defaults.vacancyRate);
  });

  it("land has zero cap rate / vacancy (no income-producing)", () => {
    const land = ASSET_TYPES.find((a) => a.id === "land")!;
    expect(land.defaults.capRateDefault).toBe(0);
    expect(land.defaults.vacancyRate).toBe(0);
  });

  it("specificMetricKeys and recommendedMethodKeys are non-empty", () => {
    ASSET_TYPES.forEach((a) => {
      expect(a.specificMetricKeys.length).toBeGreaterThan(0);
      expect(a.recommendedMethodKeys.length).toBeGreaterThan(0);
    });
  });
});

describe("getAssetTypeConfig", () => {
  it("returns the requested asset config", () => {
    const c = getAssetTypeConfig("hotel");
    expect(c.id).toBe("hotel");
  });

  it("falls back to residential_apartment for unknown id", () => {
    const c = getAssetTypeConfig("unknown_xyz" as never);
    expect(c.id).toBe("residential_apartment");
  });
});
