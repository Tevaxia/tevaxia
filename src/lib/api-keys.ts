import { supabase, isSupabaseConfigured } from "./supabase";

export type ApiTier = "free" | "pro" | "enterprise";

export interface ApiKey {
  id: string;
  user_id: string;
  org_id: string | null;
  name: string;
  key_prefix: string;
  tier: ApiTier;
  active: boolean;
  created_at: string;
  last_used_at: string | null;
  revoked_at: string | null;
}

export interface ApiUsageDay {
  day: string;
  total: number;
  errors: number;
  avg_latency_ms: number;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function hashKey(plainKey: string): Promise<string> {
  if (typeof globalThis.crypto?.subtle !== "object") {
    throw new Error("WebCrypto non disponible — environnement non supporté");
  }
  const bytes = new TextEncoder().encode(plainKey);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomBytesHex(n: number): string {
  const arr = new Uint8Array(n);
  globalThis.crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createApiKey(input: { name: string; tier?: ApiTier; org_id?: string | null }): Promise<{ apiKey: ApiKey; plainKey: string }> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Utilisateur non authentifié.");

  const plainKey = `tvx_${randomBytesHex(24)}`;
  const key_prefix = plainKey.slice(0, 11);
  const key_hash = await hashKey(plainKey);

  const { data, error } = await client
    .from("api_keys")
    .insert({
      user_id: user.id,
      org_id: input.org_id ?? null,
      name: input.name,
      key_prefix,
      key_hash,
      tier: input.tier ?? "free",
    })
    .select("*")
    .single();

  if (error) throw error;
  return { apiKey: data as ApiKey, plainKey };
}

export async function listMyApiKeys(): Promise<ApiKey[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("api_keys")
    .select("id, user_id, org_id, name, key_prefix, tier, active, created_at, last_used_at, revoked_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiKey[];
}

export async function revokeApiKey(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("api_keys")
    .update({ active: false, revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteApiKey(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("api_keys").delete().eq("id", id);
  if (error) throw error;
}

export async function getUsageDaily(keyId: string, days = 30): Promise<ApiUsageDay[]> {
  const client = ensureClient();
  const { data, error } = await client.rpc("api_usage_daily", { p_key_id: keyId, p_days: days });
  if (error) throw error;
  return (data ?? []) as ApiUsageDay[];
}
