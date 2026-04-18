import type { PmsNightAudit, PmsReservation } from "./types";

/**
 * KPIs clés hôtellerie (définitions HOTREC / STR / Horwath).
 */
export interface PmsKpis {
  occupancyPct: number;
  adr: number;   // Average Daily Rate = room_revenue / rooms_sold
  revpar: number; // Revenue Per Available Room = room_revenue / rooms_available
  totalRoomNightsSold: number;
  totalRoomNightsAvailable: number;
  totalRoomRevenue: number;
}

export function aggregateKpis(audits: PmsNightAudit[]): PmsKpis {
  if (audits.length === 0) {
    return {
      occupancyPct: 0,
      adr: 0,
      revpar: 0,
      totalRoomNightsSold: 0,
      totalRoomNightsAvailable: 0,
      totalRoomRevenue: 0,
    };
  }
  const sold = audits.reduce((s, a) => s + a.occupied_rooms, 0);
  const avail = audits.reduce((s, a) => s + a.total_rooms, 0);
  const rev = audits.reduce((s, a) => s + Number(a.room_revenue || 0), 0);
  return {
    occupancyPct: avail > 0 ? (sold / avail) * 100 : 0,
    adr: sold > 0 ? rev / sold : 0,
    revpar: avail > 0 ? rev / avail : 0,
    totalRoomNightsSold: sold,
    totalRoomNightsAvailable: avail,
    totalRoomRevenue: rev,
  };
}

/**
 * Période pickup/pace : rythme de réservation dernière 30 jours.
 */
export function pickupLast30Days(reservations: PmsReservation[]): {
  reservationsLast30: number;
  roomNightsLast30: number;
  avgRevenuePerReservation: number;
} {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const recent = reservations.filter((r) => new Date(r.created_at) >= cutoff);
  const nights = recent.reduce((s, r) => s + r.nb_nights, 0);
  const rev = recent.reduce((s, r) => s + Number(r.total_amount || 0), 0);
  return {
    reservationsLast30: recent.length,
    roomNightsLast30: nights,
    avgRevenuePerReservation: recent.length > 0 ? rev / recent.length : 0,
  };
}
