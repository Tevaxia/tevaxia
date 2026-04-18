// ============================================================
// PMS — USALI v11 Monthly Report
// ============================================================
//
// Uniform System of Accounts for the Lodging Industry — standard
// mondial de reporting hôtelier adopté par HOTREC / AHLA.
// Version 11 (2014, révisions mineures 2024).
//
// Ce module construit un rapport mensuel consolidé à partir de :
//   - pms_night_audits (KPIs daily snapshots)
//   - pms_folio_charges (ventilation revenus par catégorie)
//   - pms_properties (capacité totale)

import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsNightAudit, PmsChargeCategory } from "./types";

export interface UsaliCategoryRow {
  category: string;
  label: string;
  revenue_ht: number;
  revenue_ttc: number;
  tva: number;
  nb_transactions: number;
}

export interface UsaliMonthlyReport {
  property_id: string;
  property_name: string;
  year: number;
  month: number;  // 1-12
  month_label: string;
  period_start: string; // YYYY-MM-01
  period_end: string;   // YYYY-MM-DD (last day)
  days_in_period: number;

  // Inventory
  rooms_available: number;   // total_rooms × days
  rooms_sold: number;          // sum occupied
  rooms_vacant: number;        // available - sold

  // KPIs de performance
  occupancy_pct: number;
  adr: number;          // Room Revenue / Rooms Sold
  revpar: number;        // Room Revenue / Rooms Available
  trevpar: number;       // Total Revenue / Rooms Available

  // Revenus USALI
  room_revenue_ht: number;
  room_revenue_tva: number;
  room_revenue_ttc: number;
  fb_revenue_ht: number;
  fb_revenue_tva: number;
  fb_revenue_ttc: number;
  other_revenue_ht: number;
  other_revenue_tva: number;
  other_revenue_ttc: number;
  taxe_sejour_collected: number;
  total_revenue_ht: number;
  total_revenue_tva: number;
  total_revenue_ttc: number;

  // Ventilation détaillée par catégorie (USALI operated departments)
  categories: UsaliCategoryRow[];

  // Flash activité
  arrivals_total: number;
  departures_total: number;
  stayovers_total: number;
  no_shows_total: number;

  // Comparatifs (si disponibles)
  prev_year_same_month: Pick<UsaliMonthlyReport,
    "room_revenue_ttc" | "occupancy_pct" | "adr" | "revpar"> | null;

  // Daily trend
  daily_audits: Pick<PmsNightAudit,
    "audit_date" | "occupancy_pct" | "adr" | "revpar" | "room_revenue" | "total_revenue" | "occupied_rooms">[];
}

// ============================================================
// Mapping USALI — catégories folio → departments
// ============================================================

export const USALI_DEPARTMENT_MAP: Record<string, PmsChargeCategory[]> = {
  Rooms: ["room", "extra_bed"],
  "Food & Beverage": ["breakfast", "lunch", "dinner", "room_service", "bar", "minibar"],
  "Meeting & Events": ["meeting_room"],
  "Other Operated Departments": [
    "spa", "parking", "laundry", "transport", "internet", "phone",
  ],
  "Minor Operating Revenue": ["cancellation_fee", "damage", "other"],
  "Other taxes": ["taxe_sejour"],
};

export const CATEGORY_LABELS_EN: Record<PmsChargeCategory, string> = {
  room: "Room",
  extra_bed: "Extra bed",
  taxe_sejour: "City tax",
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  bar: "Bar",
  minibar: "Minibar",
  room_service: "Room service",
  meeting_room: "Meeting room",
  parking: "Parking",
  laundry: "Laundry",
  spa: "Spa",
  phone: "Phone",
  internet: "Internet",
  transport: "Transport",
  cancellation_fee: "Cancellation",
  damage: "Damage",
  other: "Other",
};

// ============================================================
// Build report
// ============================================================

function pad2(n: number): string { return n < 10 ? `0${n}` : String(n); }

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function monthLabel(year: number, month: number, locale = "fr-LU"): string {
  return new Date(year, month - 1, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
}

export async function buildUsaliMonthly(
  propertyId: string,
  year: number,
  month: number,
): Promise<UsaliMonthlyReport | null> {
  if (!isSupabaseConfigured || !supabase) return null;

  // Plage de dates
  const days = daysInMonth(year, month);
  const period_start = `${year}-${pad2(month)}-01`;
  const period_end = `${year}-${pad2(month)}-${pad2(days)}`;

  // Property
  const { data: propData } = await supabase
    .from("pms_properties")
    .select("id, name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!propData) return null;

  // Night audits
  const { data: auditsData } = await supabase
    .from("pms_night_audits")
    .select("*")
    .eq("property_id", propertyId)
    .gte("audit_date", period_start)
    .lte("audit_date", period_end)
    .order("audit_date");
  const audits = (auditsData ?? []) as PmsNightAudit[];

  // Folio charges via folios appartenant à des réservations cette période
  const { data: foliosData } = await supabase
    .from("pms_folios")
    .select("id, reservation_id")
    .eq("property_id", propertyId);
  const folioIds = ((foliosData ?? []) as Array<{ id: string; reservation_id: string }>).map((f) => f.id);

  type ChargeAgg = { category: string; line_ht: number; line_tva: number; line_ttc: number; voided: boolean; folio_id: string; posted_at: string };
  const chargesAgg: ChargeAgg[] = [];
  if (folioIds.length > 0) {
    const { data: chargesData } = await supabase
      .from("pms_folio_charges")
      .select("category, line_ht, line_tva, line_ttc, voided, folio_id, posted_at")
      .in("folio_id", folioIds)
      .gte("posted_at", period_start)
      .lte("posted_at", `${period_end}T23:59:59Z`);
    chargesAgg.push(...((chargesData ?? []) as ChargeAgg[]).filter((c) => !c.voided));
  }

  // ========== Agrégations ==========

  const categoriesMap: Record<string, UsaliCategoryRow> = {};
  for (const c of chargesAgg) {
    if (!categoriesMap[c.category]) {
      categoriesMap[c.category] = {
        category: c.category,
        label: CATEGORY_LABELS_EN[c.category as PmsChargeCategory] ?? c.category,
        revenue_ht: 0, revenue_tva: 0, revenue_ttc: 0, nb_transactions: 0,
      } as unknown as UsaliCategoryRow;
      categoriesMap[c.category].tva = 0;
    }
    categoriesMap[c.category].revenue_ht += Number(c.line_ht);
    categoriesMap[c.category].tva += Number(c.line_tva);
    categoriesMap[c.category].revenue_ttc += Number(c.line_ttc);
    categoriesMap[c.category].nb_transactions += 1;
  }
  const categories = Object.values(categoriesMap).sort((a, b) => b.revenue_ttc - a.revenue_ttc);

  // Room revenue
  const roomHT = (categoriesMap["room"]?.revenue_ht ?? 0) + (categoriesMap["extra_bed"]?.revenue_ht ?? 0);
  const roomTVA = (categoriesMap["room"]?.tva ?? 0) + (categoriesMap["extra_bed"]?.tva ?? 0);
  const roomTTC = (categoriesMap["room"]?.revenue_ttc ?? 0) + (categoriesMap["extra_bed"]?.revenue_ttc ?? 0);

  // F&B
  const fbCats = ["breakfast", "lunch", "dinner", "bar", "minibar", "room_service", "meeting_room"];
  let fbHT = 0, fbTVA = 0, fbTTC = 0;
  for (const c of fbCats) {
    fbHT += categoriesMap[c]?.revenue_ht ?? 0;
    fbTVA += categoriesMap[c]?.tva ?? 0;
    fbTTC += categoriesMap[c]?.revenue_ttc ?? 0;
  }

  // Other
  const otherCats = ["spa", "parking", "laundry", "transport", "internet", "phone", "cancellation_fee", "damage", "other"];
  let otherHT = 0, otherTVA = 0, otherTTC = 0;
  for (const c of otherCats) {
    otherHT += categoriesMap[c]?.revenue_ht ?? 0;
    otherTVA += categoriesMap[c]?.tva ?? 0;
    otherTTC += categoriesMap[c]?.revenue_ttc ?? 0;
  }

  const taxeSejour = categoriesMap["taxe_sejour"]?.revenue_ttc ?? 0;
  const totalRevHT = roomHT + fbHT + otherHT + taxeSejour;
  const totalRevTVA = roomTVA + fbTVA + otherTVA;
  const totalRevTTC = roomTTC + fbTTC + otherTTC + taxeSejour;

  // KPIs rooms
  const total_rooms_inventory = audits.length > 0 ? Math.max(...audits.map((a) => a.total_rooms)) : 0;
  const rooms_available = total_rooms_inventory * days;
  const rooms_sold = audits.reduce((s, a) => s + Number(a.occupied_rooms), 0);
  const rooms_vacant = Math.max(0, rooms_available - rooms_sold);
  const occupancy_pct = rooms_available > 0 ? Math.round((rooms_sold / rooms_available) * 10000) / 100 : 0;

  // Utiliser les room_revenue audits (source officielle) plutôt que folios
  // → car certaines réservations ne créent pas de folio (ex. OTA).
  // Fallback sur folio si audits vides.
  const auditRoomRev = audits.reduce((s, a) => s + Number(a.room_revenue), 0);
  const usedRoomRev = auditRoomRev > 0 ? auditRoomRev : roomHT;
  const adr = rooms_sold > 0 ? Math.round((usedRoomRev / rooms_sold) * 100) / 100 : 0;
  const revpar = rooms_available > 0 ? Math.round((usedRoomRev / rooms_available) * 100) / 100 : 0;
  const trevpar = rooms_available > 0 ? Math.round((totalRevTTC / rooms_available) * 100) / 100 : 0;

  // Flash
  const arrivals_total = audits.reduce((s, a) => s + Number(a.arrivals_count), 0);
  const departures_total = audits.reduce((s, a) => s + Number(a.departures_count), 0);
  const stayovers_total = audits.reduce((s, a) => s + Number(a.stayovers_count), 0);
  const no_shows_total = audits.reduce((s, a) => s + Number(a.no_shows_count), 0);

  // Daily trend
  const daily_audits = audits.map((a) => ({
    audit_date: a.audit_date,
    occupancy_pct: Number(a.occupancy_pct),
    adr: Number(a.adr),
    revpar: Number(a.revpar),
    room_revenue: Number(a.room_revenue),
    total_revenue: Number(a.total_revenue),
    occupied_rooms: Number(a.occupied_rooms),
  }));

  // Comparatif année précédente
  let prev_year_same_month: UsaliMonthlyReport["prev_year_same_month"] = null;
  const prevYear = year - 1;
  const prevStart = `${prevYear}-${pad2(month)}-01`;
  const prevEnd = `${prevYear}-${pad2(month)}-${pad2(daysInMonth(prevYear, month))}`;
  const { data: prevAudits } = await supabase
    .from("pms_night_audits")
    .select("occupancy_pct, adr, revpar, room_revenue, total_rooms, occupied_rooms")
    .eq("property_id", propertyId)
    .gte("audit_date", prevStart)
    .lte("audit_date", prevEnd);
  if (prevAudits && prevAudits.length > 0) {
    const pAudits = prevAudits as Array<{
      occupancy_pct: number; adr: number; revpar: number;
      room_revenue: number; total_rooms: number; occupied_rooms: number;
    }>;
    const pRoomRev = pAudits.reduce((s, a) => s + Number(a.room_revenue), 0);
    const pTotalInv = pAudits.length > 0 ? Math.max(...pAudits.map((a) => a.total_rooms)) : 0;
    const pAvail = pTotalInv * daysInMonth(prevYear, month);
    const pSold = pAudits.reduce((s, a) => s + Number(a.occupied_rooms), 0);
    prev_year_same_month = {
      room_revenue_ttc: pRoomRev,
      occupancy_pct: pAvail > 0 ? Math.round((pSold / pAvail) * 10000) / 100 : 0,
      adr: pSold > 0 ? Math.round((pRoomRev / pSold) * 100) / 100 : 0,
      revpar: pAvail > 0 ? Math.round((pRoomRev / pAvail) * 100) / 100 : 0,
    };
  }

  return {
    property_id: propertyId,
    property_name: propData.name,
    year, month,
    month_label: monthLabel(year, month),
    period_start, period_end,
    days_in_period: days,

    rooms_available, rooms_sold, rooms_vacant,
    occupancy_pct, adr, revpar, trevpar,

    room_revenue_ht: roomHT,
    room_revenue_tva: roomTVA,
    room_revenue_ttc: roomTTC,
    fb_revenue_ht: fbHT,
    fb_revenue_tva: fbTVA,
    fb_revenue_ttc: fbTTC,
    other_revenue_ht: otherHT,
    other_revenue_tva: otherTVA,
    other_revenue_ttc: otherTTC,
    taxe_sejour_collected: taxeSejour,
    total_revenue_ht: totalRevHT,
    total_revenue_tva: totalRevTVA,
    total_revenue_ttc: totalRevTTC,

    categories,
    arrivals_total, departures_total, stayovers_total, no_shows_total,

    prev_year_same_month,
    daily_audits,
  };
}

// ============================================================
// Pure helpers
// ============================================================

export function yoyDelta(current: number, previous: number | null | undefined): { abs: number; pct: number | null } | null {
  if (previous == null) return null;
  const abs = current - previous;
  const pct = previous === 0 ? null : Math.round((abs / previous) * 1000) / 10;
  return { abs, pct };
}

export function computeOccupancy(roomsSold: number, roomsAvailable: number): number {
  if (roomsAvailable <= 0) return 0;
  return Math.round((roomsSold / roomsAvailable) * 10000) / 100;
}

export function computeADR(roomRevenue: number, roomsSold: number): number {
  if (roomsSold <= 0) return 0;
  return Math.round((roomRevenue / roomsSold) * 100) / 100;
}

export function computeRevPAR(roomRevenue: number, roomsAvailable: number): number {
  if (roomsAvailable <= 0) return 0;
  return Math.round((roomRevenue / roomsAvailable) * 100) / 100;
}
