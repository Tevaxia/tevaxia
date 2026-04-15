// ============================================================
// HOTELS — persistance d'établissements rattachés à une organisation
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type HotelCategory = "budget" | "midscale" | "upscale" | "luxury";
export type OperatorType = "independent" | "franchise" | "management" | "owner_operated";

export interface Hotel {
  id: string;
  org_id: string;
  name: string;
  slug: string | null;
  address: string | null;
  commune: string | null;
  country: string;
  website: string | null;
  star_rating: number | null;
  category: HotelCategory;
  nb_chambres: number;
  nb_salles_mice: number;
  has_fb: boolean;
  has_spa: boolean;
  has_parking: boolean;
  year_built: number | null;
  surface_m2: number | null;
  operator_type: OperatorType;
  franchise_brand: string | null;
  classe_energie: string | null;
  prix_acquisition: number | null;
  annee_acquisition: number | null;
  vertical_config: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface HotelPeriod {
  id: string;
  hotel_id: string;
  period_start: string;
  period_end: string;
  period_label: string | null;
  occupancy: number | null;
  adr: number | null;
  revpar: number | null;
  revenue_rooms: number | null;
  revenue_fb: number | null;
  revenue_mice: number | null;
  revenue_other: number | null;
  revenue_total: number | null;
  staff_cost: number | null;
  energy_cost: number | null;
  other_opex: number | null;
  ffe_reserve: number | null;
  gop: number | null;
  gop_margin: number | null;
  ebitda: number | null;
  ebitda_margin: number | null;
  compset_revpar: number | null;
  mpi: number | null;
  ari: number | null;
  rgi: number | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

export async function listHotels(orgId: string): Promise<Hotel[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("hotels")
    .select("*")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Hotel[];
}

export async function getHotel(id: string): Promise<Hotel | null> {
  const client = ensureClient();
  const { data, error } = await client.from("hotels").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as Hotel | null) ?? null;
}

export async function createHotel(input: {
  org_id: string;
  name: string;
  category?: HotelCategory;
  nb_chambres?: number;
  commune?: string;
  country?: string;
}): Promise<Hotel> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const slug = slugify(input.name) + "-" + Math.random().toString(36).slice(2, 6);

  const { data, error } = await client
    .from("hotels")
    .insert({
      org_id: input.org_id,
      name: input.name,
      slug,
      category: input.category ?? "midscale",
      nb_chambres: input.nb_chambres ?? 0,
      commune: input.commune ?? null,
      country: input.country ?? "LU",
      created_by: user?.id ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as Hotel;
}

export async function updateHotel(id: string, patch: Partial<Hotel>): Promise<Hotel> {
  const client = ensureClient();
  const { data, error } = await client.from("hotels").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as Hotel;
}

export async function deleteHotel(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("hotels").delete().eq("id", id);
  if (error) throw error;
}

export async function listPeriods(hotelId: string): Promise<HotelPeriod[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("hotel_periods")
    .select("*")
    .eq("hotel_id", hotelId)
    .order("period_start", { ascending: false });
  if (error) throw error;
  return (data ?? []) as HotelPeriod[];
}

export async function savePeriod(input: Omit<HotelPeriod, "id" | "created_at" | "updated_at" | "created_by"> & { id?: string }): Promise<HotelPeriod> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();

  if (input.id) {
    const { data, error } = await client.from("hotel_periods").update(input).eq("id", input.id).select("*").single();
    if (error) throw error;
    return data as HotelPeriod;
  }

  const { data, error } = await client
    .from("hotel_periods")
    .insert({ ...input, created_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as HotelPeriod;
}
