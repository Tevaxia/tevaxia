import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsRatePlan, PmsSeasonalRate } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listRatePlans(propertyId: string): Promise<PmsRatePlan[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_rate_plans")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order")
    .order("code");
  if (error) return [];
  return (data ?? []) as PmsRatePlan[];
}

export async function createRatePlan(
  input: Partial<PmsRatePlan> & { property_id: string; code: string; name: string }
): Promise<PmsRatePlan> {
  const client = ensureClient();
  const { data, error } = await client.from("pms_rate_plans").insert(input).select("*").single();
  if (error) throw error;
  return data as PmsRatePlan;
}

export async function updateRatePlan(id: string, patch: Partial<PmsRatePlan>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_rate_plans").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRatePlan(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_rate_plans").delete().eq("id", id);
  if (error) throw error;
}

export async function listSeasonalRates(propertyId: string): Promise<PmsSeasonalRate[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_seasonal_rates")
    .select("*")
    .eq("property_id", propertyId)
    .order("start_date");
  if (error) return [];
  return (data ?? []) as PmsSeasonalRate[];
}

export async function createSeasonalRate(
  input: Partial<PmsSeasonalRate> & {
    property_id: string;
    rate_plan_id: string;
    room_type_id: string;
    start_date: string;
    end_date: string;
    price: number;
  }
): Promise<PmsSeasonalRate> {
  const client = ensureClient();
  const { data, error } = await client.from("pms_seasonal_rates").insert(input).select("*").single();
  if (error) throw error;
  return data as PmsSeasonalRate;
}

export async function deleteSeasonalRate(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_seasonal_rates").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Résout le tarif applicable pour une chambre × rate plan × date.
 * Cherche d'abord un seasonal_rate matchant, sinon fallback sur base_rate × (1 - discount_pct).
 */
export function resolvePriceForDate(args: {
  date: string;
  roomTypeId: string;
  ratePlanId: string;
  baseRate: number;
  ratePlanDiscountPct: number;
  seasonalRates: PmsSeasonalRate[];
}): number {
  const { date, roomTypeId, ratePlanId, baseRate, ratePlanDiscountPct, seasonalRates } = args;
  const match = seasonalRates.find(
    (sr) =>
      sr.room_type_id === roomTypeId &&
      sr.rate_plan_id === ratePlanId &&
      sr.start_date <= date &&
      sr.end_date >= date,
  );
  if (match) return match.price;
  return baseRate * (1 - (ratePlanDiscountPct || 0) / 100);
}

/**
 * Calcule total pour un séjour continu [checkIn, checkOut[ avec tarifs variables par nuit.
 */
export function computeStayTotal(args: {
  checkIn: string;
  checkOut: string;
  roomTypeId: string;
  ratePlanId: string;
  baseRate: number;
  ratePlanDiscountPct: number;
  seasonalRates: PmsSeasonalRate[];
  extraBedCount?: number;
  extraBedPrice?: number;
}): { total: number; nights: number; avgNightly: number } {
  const start = new Date(args.checkIn);
  const end = new Date(args.checkOut);
  let total = 0;
  let nights = 0;
  const d = new Date(start);
  while (d < end) {
    const iso = d.toISOString().slice(0, 10);
    total += resolvePriceForDate({
      date: iso,
      roomTypeId: args.roomTypeId,
      ratePlanId: args.ratePlanId,
      baseRate: args.baseRate,
      ratePlanDiscountPct: args.ratePlanDiscountPct,
      seasonalRates: args.seasonalRates,
    });
    nights++;
    d.setDate(d.getDate() + 1);
  }
  const extraBed = (args.extraBedCount ?? 0) * (args.extraBedPrice ?? 0) * nights;
  total += extraBed;
  return { total, nights, avgNightly: nights > 0 ? total / nights : 0 };
}
