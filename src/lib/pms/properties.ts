import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsProperty } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listMyProperties(): Promise<PmsProperty[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_properties")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as PmsProperty[];
}

export async function getProperty(id: string): Promise<PmsProperty | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("pms_properties").select("*").eq("id", id).single();
  if (error) return null;
  return data as PmsProperty;
}

export async function createProperty(
  input: Partial<PmsProperty> & { name: string }
): Promise<PmsProperty> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("pms_properties")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsProperty;
}

export async function updateProperty(id: string, patch: Partial<PmsProperty>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_properties").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteProperty(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_properties").delete().eq("id", id);
  if (error) throw error;
}
