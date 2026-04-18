import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsGuest } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listGuests(propertyId: string, search?: string): Promise<PmsGuest[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("pms_guests").select("*").eq("property_id", propertyId);
  if (search && search.length > 1) {
    q = q.or(`last_name.ilike.%${search}%,first_name.ilike.%${search}%,email.ilike.%${search}%`);
  }
  const { data, error } = await q.order("last_name").limit(200);
  if (error) return [];
  return (data ?? []) as PmsGuest[];
}

export async function getGuest(id: string): Promise<PmsGuest | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("pms_guests").select("*").eq("id", id).single();
  if (error) return null;
  return data as PmsGuest;
}

export async function createGuest(
  input: Partial<PmsGuest> & { property_id: string; first_name: string; last_name: string }
): Promise<PmsGuest> {
  const client = ensureClient();
  const { data, error } = await client.from("pms_guests").insert(input).select("*").single();
  if (error) throw error;
  return data as PmsGuest;
}

export async function updateGuest(id: string, patch: Partial<PmsGuest>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_guests").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteGuest(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_guests").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Programme la suppression RGPD 3 ans après le dernier séjour (art. 17 RGPD).
 * L'exécution réelle se fait via cron/edge function côté Supabase.
 */
export function rgpdDeletionDateFromLastStay(lastCheckOut: Date): Date {
  const d = new Date(lastCheckOut);
  d.setFullYear(d.getFullYear() + 3);
  return d;
}
