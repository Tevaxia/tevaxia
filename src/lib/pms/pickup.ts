// ============================================================
// PMS — PICKUP REPORT (Revenue Management)
// ============================================================
//
// Pickup = réservations ENCAISSÉES (créées) pendant une fenêtre récente
// pour des séjours futurs. KPI critique en revenue management hôtelier
// pour évaluer la dynamique commerciale à court terme.
//
// "On The Books" (OTB) = stock de réservations confirmées pour un horizon.
// "Pickup Daily" = variation quotidienne du OTB (entrées + modifications).

import { supabase, isSupabaseConfigured } from "../supabase";

export interface PickupBucket {
  stay_month: string;      // YYYY-MM
  reservations: number;
  room_nights: number;
  revenue_total: number;
  adr: number;
}

export interface PickupReport {
  property_id: string;
  property_name: string;
  window_days: number;
  window_start: string;
  window_end: string;
  total_reservations: number;
  total_room_nights: number;
  total_revenue: number;
  avg_adr: number;
  by_stay_month: PickupBucket[];
  by_source: Array<{ source: string; count: number; revenue: number }>;
  by_day_booked: Array<{ date: string; count: number; revenue: number }>;
}

export async function buildPickupReport(
  propertyId: string,
  windowDays = 30,
): Promise<PickupReport | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  const end = new Date();
  const start = new Date(end.getTime() - windowDays * 86400000);
  const window_start = start.toISOString().slice(0, 10);
  const window_end = end.toISOString().slice(0, 10);

  const { data: propData } = await supabase
    .from("pms_properties")
    .select("id, name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!propData) return null;

  // Toutes les réservations créées dans la fenêtre, avec séjour futur
  const { data: resData } = await supabase
    .from("pms_reservations")
    .select("id, created_at, check_in, check_out, nb_nights, total_amount, source, status")
    .eq("property_id", propertyId)
    .gte("created_at", window_start + "T00:00:00Z")
    .lte("created_at", window_end + "T23:59:59Z")
    .in("status", ["confirmed", "checked_in", "checked_out"]);

  type ResRow = {
    id: string; created_at: string; check_in: string; check_out: string;
    nb_nights: number; total_amount: number; source: string; status: string;
  };
  const reservations = (resData ?? []) as ResRow[];

  // Agrégation par mois de séjour
  const byMonthMap: Record<string, PickupBucket> = {};
  const bySourceMap: Record<string, { count: number; revenue: number }> = {};
  const byDayMap: Record<string, { count: number; revenue: number }> = {};

  let total_reservations = 0;
  let total_room_nights = 0;
  let total_revenue = 0;

  for (const r of reservations) {
    const stayMonth = r.check_in.slice(0, 7);
    const nights = Number(r.nb_nights);
    const rev = Number(r.total_amount);
    if (!byMonthMap[stayMonth]) {
      byMonthMap[stayMonth] = {
        stay_month: stayMonth,
        reservations: 0, room_nights: 0, revenue_total: 0, adr: 0,
      };
    }
    byMonthMap[stayMonth].reservations += 1;
    byMonthMap[stayMonth].room_nights += nights;
    byMonthMap[stayMonth].revenue_total += rev;

    if (!bySourceMap[r.source]) bySourceMap[r.source] = { count: 0, revenue: 0 };
    bySourceMap[r.source].count += 1;
    bySourceMap[r.source].revenue += rev;

    const bookedDay = r.created_at.slice(0, 10);
    if (!byDayMap[bookedDay]) byDayMap[bookedDay] = { count: 0, revenue: 0 };
    byDayMap[bookedDay].count += 1;
    byDayMap[bookedDay].revenue += rev;

    total_reservations += 1;
    total_room_nights += nights;
    total_revenue += rev;
  }

  // Calcul ADR par bucket
  for (const m of Object.values(byMonthMap)) {
    m.adr = m.room_nights > 0 ? Math.round((m.revenue_total / m.room_nights) * 100) / 100 : 0;
  }

  const by_stay_month = Object.values(byMonthMap).sort((a, b) => a.stay_month.localeCompare(b.stay_month));
  const by_source = Object.entries(bySourceMap)
    .map(([source, v]) => ({ source, count: v.count, revenue: v.revenue }))
    .sort((a, b) => b.revenue - a.revenue);
  const by_day_booked = Object.entries(byDayMap)
    .map(([date, v]) => ({ date, count: v.count, revenue: v.revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    property_id: propertyId,
    property_name: propData.name,
    window_days: windowDays,
    window_start, window_end,
    total_reservations, total_room_nights, total_revenue,
    avg_adr: total_room_nights > 0 ? Math.round((total_revenue / total_room_nights) * 100) / 100 : 0,
    by_stay_month, by_source, by_day_booked,
  };
}

// ============================================================
// Pure helpers (testables)
// ============================================================

/**
 * Booking lead time = jours entre la création de la résa et l'arrivée.
 */
export function bookingLeadDays(createdAt: string, checkIn: string): number {
  const c = new Date(createdAt);
  const i = new Date(checkIn);
  return Math.floor((i.getTime() - c.getTime()) / 86400000);
}

/**
 * Catégorise un lead time en buckets RM standards.
 */
export function leadTimeBucket(days: number): "same_day" | "short" | "medium" | "long" | "very_long" {
  if (days <= 0) return "same_day";
  if (days <= 7) return "short";
  if (days <= 30) return "medium";
  if (days <= 90) return "long";
  return "very_long";
}

export const LEAD_BUCKET_LABELS: Record<"same_day" | "short" | "medium" | "long" | "very_long", string> = {
  same_day: "Jour même",
  short: "1-7 jours",
  medium: "8-30 jours",
  long: "31-90 jours",
  very_long: "> 90 jours",
};
