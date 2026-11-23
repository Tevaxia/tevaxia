import { describe, expect, it } from "vitest";
import { VEFA_LEGAL_CAPS, VEFA_MILESTONES, defaultVefaSchedule } from "@/lib/vefa-schedule";

const sum = (values: number[]) => Math.round(values.reduce((total, value) => total + value, 0) * 10) / 10;

describe("default VEFA payment schedule (Civil Code art. 1601-9)", () => {
  it("calls the land at the deed and the constructions as works progress", () => {
    // 650 000 € dont 195 000 € de terrain : 30 % à l'acte.
    expect(defaultVefaSchedule(650_000, 195_000)).toEqual([30, 10.5, 14, 10.5, 14, 17.5, 3.5]);
  });

  it("always totals 100 %", () => {
    for (const [price, land] of [[650_000, 195_000], [500_000, 50_000], [799_999, 233_333], [1_000_000, 0], [420_000, 420_000]]) {
      expect(sum(defaultVefaSchedule(price, land))).toBe(100);
    }
  });

  it("keeps the construction share within the legal ceilings at each stage", () => {
    const cumulative = VEFA_MILESTONES.map((_, index) =>
      VEFA_MILESTONES.slice(0, index + 1).reduce((total, milestone) => total + milestone.constructionPct, 0));
    const at = (labelKey: string) => cumulative[VEFA_MILESTONES.findIndex(milestone => milestone.labelKey === labelKey)];
    expect(at("milestoneSignature")).toBe(0);
    expect(at("milestoneFondations")).toBeLessThanOrEqual(VEFA_LEGAL_CAPS.foundations);
    // La dalle supérieure précède la toiture : le plafond de 50 % n'est atteint qu'au hors d'air.
    expect(at("milestoneHorsAir")).toBeLessThanOrEqual(VEFA_LEGAL_CAPS.topSlab);
    expect(at("milestoneFinition")).toBeLessThanOrEqual(VEFA_LEGAL_CAPS.completion);
    expect(at("milestoneLivraison")).toBe(100);
  });

  it("handles a missing price or an out-of-range land share", () => {
    expect(defaultVefaSchedule(0, 100_000)).toEqual([0, 15, 20, 15, 20, 25, 5]);
    expect(defaultVefaSchedule(500_000, 900_000)).toEqual([100, 0, 0, 0, 0, 0, 0]);
    expect(defaultVefaSchedule(500_000, -10)).toEqual([0, 15, 20, 15, 20, 25, 5]);
  });
});
