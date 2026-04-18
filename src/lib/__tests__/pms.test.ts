import { describe, it, expect } from "vitest";
import { computeStayTotal, resolvePriceForDate } from "../pms/rates";
import { computeInvoiceTotals, ttcToHt } from "../pms/invoices";
import { aggregateKpis, pickupLast30Days } from "../pms/kpi";
import { peakConcurrentOccupancy } from "../pms/reservations";
import { reservationsToICal } from "../pms/ical";
import type { PmsNightAudit, PmsReservation, PmsSeasonalRate } from "../pms/types";

describe("PMS rates", () => {
  const sr: PmsSeasonalRate = {
    id: "s1",
    property_id: "p1",
    rate_plan_id: "rp1",
    room_type_id: "rt1",
    start_date: "2026-07-01",
    end_date: "2026-08-31",
    price: 200,
    min_los: 1,
    max_los: null,
    closed_to_arrival: false,
    closed_to_departure: false,
    stop_sell: false,
    created_at: "2026-01-01T00:00:00Z",
  };

  it("resolvePriceForDate uses seasonal rate when matching", () => {
    const price = resolvePriceForDate({
      date: "2026-07-15",
      roomTypeId: "rt1",
      ratePlanId: "rp1",
      baseRate: 120,
      ratePlanDiscountPct: 0,
      seasonalRates: [sr],
    });
    expect(price).toBe(200);
  });

  it("resolvePriceForDate falls back to baseRate × (1 - discount)", () => {
    const price = resolvePriceForDate({
      date: "2026-03-15",
      roomTypeId: "rt1",
      ratePlanId: "rp1",
      baseRate: 120,
      ratePlanDiscountPct: 10,
      seasonalRates: [sr],
    });
    expect(price).toBe(108);
  });

  it("computeStayTotal sums nights across seasonal transition", () => {
    const t = computeStayTotal({
      checkIn: "2026-06-30",
      checkOut: "2026-07-03",
      roomTypeId: "rt1",
      ratePlanId: "rp1",
      baseRate: 120,
      ratePlanDiscountPct: 0,
      seasonalRates: [sr],
    });
    expect(t.nights).toBe(3);
    expect(t.total).toBe(120 + 200 + 200); // 30 juin base, 1/2 juillet seasonal
  });

  it("computeStayTotal adds extra bed cost", () => {
    const t = computeStayTotal({
      checkIn: "2026-07-01",
      checkOut: "2026-07-03",
      roomTypeId: "rt1",
      ratePlanId: "rp1",
      baseRate: 120,
      ratePlanDiscountPct: 0,
      seasonalRates: [sr],
      extraBedCount: 1,
      extraBedPrice: 30,
    });
    expect(t.total).toBe(200 + 200 + 2 * 30);
  });
});

describe("PMS invoices", () => {
  it("computeInvoiceTotals applies TVA correctly", () => {
    const t = computeInvoiceTotals({
      hebergementHt: 300,
      hebergementTvaRate: 3,
      fbHt: 100,
      fbTvaRate: 17,
      otherHt: 0,
      otherTvaRate: 17,
      taxeSejour: 9,
    });
    expect(t.hebergementTva).toBe(9);
    expect(t.fbTva).toBe(17);
    expect(t.totalHt).toBe(400);
    expect(t.totalTva).toBe(26);
    expect(t.totalTtc).toBe(435); // 400 + 26 + 9 taxe séjour
  });

  it("ttcToHt rounds correctly", () => {
    expect(ttcToHt(103, 3)).toBe(100);
    expect(ttcToHt(117, 17)).toBe(100);
  });
});

describe("PMS KPIs", () => {
  const auditBase: Omit<PmsNightAudit, "audit_date" | "occupied_rooms" | "room_revenue"> = {
    id: "a1",
    property_id: "p1",
    total_rooms: 10,
    arrivals_count: 0,
    departures_count: 0,
    stayovers_count: 0,
    no_shows_count: 0,
    fb_revenue: 0,
    other_revenue: 0,
    total_revenue: 0,
    taxe_sejour_collected: 0,
    occupancy_pct: 0,
    adr: 0,
    revpar: 0,
    notes: null,
    closed: false,
    closed_at: null,
    closed_by: null,
    created_at: "",
    updated_at: "",
  };

  it("aggregateKpis computes ADR / RevPAR / occupancy", () => {
    const audits: PmsNightAudit[] = [
      { ...auditBase, audit_date: "2026-01-01", occupied_rooms: 5, room_revenue: 500 },
      { ...auditBase, audit_date: "2026-01-02", occupied_rooms: 8, room_revenue: 800 },
    ];
    const k = aggregateKpis(audits);
    expect(k.occupancyPct).toBeCloseTo(65, 1); // (13/20)*100
    expect(k.adr).toBeCloseTo(100, 1);
    expect(k.revpar).toBeCloseTo(65, 1);
  });

  it("aggregateKpis returns zeros on empty", () => {
    const k = aggregateKpis([]);
    expect(k.occupancyPct).toBe(0);
    expect(k.adr).toBe(0);
    expect(k.revpar).toBe(0);
  });

  it("pickupLast30Days counts recent reservations", () => {
    const today = new Date();
    const recent = new Date(today);
    recent.setDate(recent.getDate() - 5);
    const old = new Date(today);
    old.setDate(old.getDate() - 40);
    const reservations: PmsReservation[] = [
      makeReservation({ created_at: recent.toISOString(), nb_nights: 3, total_amount: 600 }),
      makeReservation({ created_at: old.toISOString(), nb_nights: 2, total_amount: 400 }),
    ];
    const p = pickupLast30Days(reservations);
    expect(p.reservationsLast30).toBe(1);
    expect(p.roomNightsLast30).toBe(3);
    expect(p.avgRevenuePerReservation).toBe(600);
  });
});

describe("PMS reservations overlap", () => {
  it("peakConcurrentOccupancy counts simultaneous", () => {
    const res = [
      makeReservation({ check_in: "2026-04-01", check_out: "2026-04-05", status: "confirmed" }),
      makeReservation({ check_in: "2026-04-03", check_out: "2026-04-08", status: "confirmed" }),
      makeReservation({ check_in: "2026-04-04", check_out: "2026-04-06", status: "checked_in" }),
    ];
    const peak = peakConcurrentOccupancy(res, "2026-04-01", "2026-04-10");
    expect(peak).toBe(3); // tous les 3 chevauchent le 4-5
  });

  it("peakConcurrentOccupancy ignores cancelled", () => {
    const res = [
      makeReservation({ check_in: "2026-04-01", check_out: "2026-04-05", status: "cancelled" }),
      makeReservation({ check_in: "2026-04-01", check_out: "2026-04-05", status: "confirmed" }),
    ];
    expect(peakConcurrentOccupancy(res, "2026-04-01", "2026-04-05")).toBe(1);
  });
});

describe("PMS iCal", () => {
  it("reservationsToICal produces valid VCALENDAR", () => {
    const r = makeReservation({
      check_in: "2026-07-01",
      check_out: "2026-07-05",
      status: "confirmed",
      reservation_number: "R-2026-00001",
    });
    const ical = reservationsToICal({
      reservations: [r],
      calendarName: "Test hotel",
      propertyId: "p1",
    });
    expect(ical).toContain("BEGIN:VCALENDAR");
    expect(ical).toContain("END:VCALENDAR");
    expect(ical).toContain("DTSTART;VALUE=DATE:20260701");
    expect(ical).toContain("DTEND;VALUE=DATE:20260705");
    expect(ical).toContain("R-2026-00001");
  });

  it("reservationsToICal excludes non-active statuses", () => {
    const r = makeReservation({
      check_in: "2026-07-01",
      check_out: "2026-07-05",
      status: "cancelled",
    });
    const ical = reservationsToICal({
      reservations: [r],
      calendarName: "Test hotel",
      propertyId: "p1",
    });
    expect(ical).not.toContain("VEVENT");
  });
});

function makeReservation(patch: Partial<PmsReservation>): PmsReservation {
  return {
    id: "r1",
    property_id: "p1",
    reservation_number: "R-2026-00001",
    status: "confirmed",
    source: "direct",
    external_ref: null,
    guest_id: null,
    booker_name: null,
    booker_email: null,
    booker_phone: null,
    check_in: "2026-04-01",
    check_out: "2026-04-03",
    nb_adults: 2,
    nb_children: 0,
    nb_nights: 2,
    total_amount: 0,
    amount_paid: 0,
    deposit_amount: 0,
    deposit_paid: false,
    currency: "EUR",
    cancellation_policy: null,
    notes: null,
    special_requests: null,
    internal_notes: null,
    confirmed_at: null,
    checked_in_at: null,
    checked_out_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...patch,
  };
}
