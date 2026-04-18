import { describe, it, expect } from "vitest";
import { offerVsAsking } from "../agency-offers";

describe("offerVsAsking", () => {
  it("offre > prix demandé : verdict above", () => {
    const r = offerVsAsking({ amount_eur: 510000 }, 500000);
    expect(r.diff).toBe(10000);
    expect(r.pct).toBeCloseTo(2, 2);
    expect(r.verdict).toBe("above");
  });
  it("offre au prix : at", () => {
    const r = offerVsAsking({ amount_eur: 500000 }, 500000);
    expect(r.verdict).toBe("at");
  });
  it("offre -3% : below_5", () => {
    const r = offerVsAsking({ amount_eur: 485000 }, 500000);
    expect(r.verdict).toBe("below_5");
  });
  it("offre -8% : below_10", () => {
    const r = offerVsAsking({ amount_eur: 460000 }, 500000);
    expect(r.verdict).toBe("below_10");
  });
  it("offre -15% : below", () => {
    const r = offerVsAsking({ amount_eur: 425000 }, 500000);
    expect(r.verdict).toBe("below");
  });
  it("asking null : pct null, verdict at", () => {
    const r = offerVsAsking({ amount_eur: 500000 }, null);
    expect(r.pct).toBeNull();
    expect(r.verdict).toBe("at");
  });
});
