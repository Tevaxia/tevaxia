import { describe, it, expect } from "vitest";
import {
  computeEstimatedCommission,
  computeCoMandateSplit,
  mandateDaysRemaining,
  mandateProgressPct,
  nextStatus,
  MANDATE_PIPELINE_ORDER,
} from "../agency-mandates";

describe("computeEstimatedCommission", () => {
  it("computes 3% of 750000 = 22500", () => {
    expect(computeEstimatedCommission({ prix_demande: 750000, commission_pct: 3 })).toBe(22500);
  });

  it("returns 0 when prix_demande is null", () => {
    expect(computeEstimatedCommission({ prix_demande: null, commission_pct: 3 })).toBe(0);
  });

  it("returns 0 when commission_pct is null", () => {
    expect(computeEstimatedCommission({ prix_demande: 500000, commission_pct: null })).toBe(0);
  });

  it("handles fractional commission", () => {
    expect(computeEstimatedCommission({ prix_demande: 500000, commission_pct: 2.5 })).toBe(12500);
  });
});

describe("mandateDaysRemaining", () => {
  it("returns null for null endDate", () => {
    expect(mandateDaysRemaining(null)).toBe(null);
  });

  it("returns positive for future date", () => {
    const future = new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const d = mandateDaysRemaining(future);
    expect(d).not.toBe(null);
    expect(d!).toBeGreaterThanOrEqual(9);
    expect(d!).toBeLessThanOrEqual(10);
  });

  it("returns negative for past date", () => {
    const past = new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString().slice(0, 10);
    const d = mandateDaysRemaining(past);
    expect(d).not.toBe(null);
    expect(d!).toBeLessThan(0);
  });

  it("returns ~0 for today", () => {
    const today = new Date().toISOString().slice(0, 10);
    const d = mandateDaysRemaining(today);
    expect(d).not.toBe(null);
    expect(Math.abs(d!)).toBeLessThanOrEqual(1);
  });
});

describe("computeCoMandateSplit", () => {
  it("sans co-mandat : tout au primaire", () => {
    const r = computeCoMandateSplit({
      prix_demande: 500000,
      commission_pct: 3,
      is_co_mandate: false,
      co_agency_commission_pct: null,
    });
    expect(r.total).toBe(15000);
    expect(r.primary).toBe(15000);
    expect(r.partner).toBe(0);
  });
  it("co-mandat sans répartition explicite : 50/50", () => {
    const r = computeCoMandateSplit({
      prix_demande: 500000,
      commission_pct: 3,
      is_co_mandate: true,
      co_agency_commission_pct: null,
    });
    expect(r.primary).toBe(7500);
    expect(r.partner).toBe(7500);
  });
  it("co-mandat avec part partenaire explicite : 1.5% sur 3% = 50%", () => {
    const r = computeCoMandateSplit({
      prix_demande: 500000,
      commission_pct: 3,
      is_co_mandate: true,
      co_agency_commission_pct: 1.5,
    });
    expect(r.partner).toBe(7500);
    expect(r.primary).toBe(7500);
  });
  it("clamp partner share ≤ 100%", () => {
    const r = computeCoMandateSplit({
      prix_demande: 500000,
      commission_pct: 3,
      is_co_mandate: true,
      co_agency_commission_pct: 10,
    });
    expect(r.partner).toBe(15000);
    expect(r.primary).toBe(0);
  });
});

describe("mandateProgressPct", () => {
  it("prospect = 0%", () => {
    expect(mandateProgressPct("prospect")).toBe(0);
  });
  it("vendu = 100%", () => {
    expect(mandateProgressPct("vendu")).toBe(100);
  });
  it("progression monotone entre les stages actifs", () => {
    const pcts = MANDATE_PIPELINE_ORDER.map((s) => mandateProgressPct(s));
    for (let i = 1; i < pcts.length; i++) {
      expect(pcts[i]).toBeGreaterThanOrEqual(pcts[i - 1]);
    }
  });
  it("abandonne / expire = 0", () => {
    expect(mandateProgressPct("abandonne")).toBe(0);
    expect(mandateProgressPct("expire")).toBe(0);
  });
});

describe("nextStatus", () => {
  it("prospect → mandat_signe", () => {
    expect(nextStatus("prospect")).toBe("mandat_signe");
  });
  it("mandat_signe → diffuse", () => {
    expect(nextStatus("mandat_signe")).toBe("diffuse");
  });
  it("vendu : pas de suivant", () => {
    expect(nextStatus("vendu")).toBeNull();
  });
  it("abandonne / expire : hors pipeline, null", () => {
    expect(nextStatus("abandonne")).toBeNull();
    expect(nextStatus("expire")).toBeNull();
  });
});
