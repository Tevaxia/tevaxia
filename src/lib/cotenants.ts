import { supabase, isSupabaseConfigured } from "./supabase";

export type CotenantStatus = "active" | "left" | "pending";

export interface Cotenant {
  id: string;
  lot_id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  share_pct: number;
  deposit_amount: number;
  bail_start: string | null;
  bail_end: string | null;
  status: CotenantStatus;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listCotenantsForLot(lotId: string): Promise<Cotenant[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("rental_cotenants")
    .select("*")
    .eq("lot_id", lotId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Cotenant[];
}

export async function createCotenant(input: {
  lot_id: string;
  name: string;
  email?: string;
  phone?: string;
  share_pct?: number;
  deposit_amount?: number;
  bail_start?: string;
  bail_end?: string;
  status?: CotenantStatus;
}): Promise<Cotenant> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("rental_cotenants")
    .insert({
      lot_id: input.lot_id,
      user_id: user.id,
      name: input.name,
      email: input.email ?? null,
      phone: input.phone ?? null,
      share_pct: input.share_pct ?? 0,
      deposit_amount: input.deposit_amount ?? 0,
      bail_start: input.bail_start ?? null,
      bail_end: input.bail_end ?? null,
      status: input.status ?? "active",
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Cotenant;
}

export async function updateCotenant(id: string, patch: Partial<Omit<Cotenant, "id" | "user_id" | "lot_id" | "created_at" | "updated_at">>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("rental_cotenants").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteCotenant(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("rental_cotenants").delete().eq("id", id);
  if (error) throw error;
}

export function computeSharedRent(totalRent: number, sharePct: number): number {
  return Math.round(totalRent * (sharePct / 100) * 100) / 100;
}

/**
 * Distribue automatiquement les parts pour que la somme soit 100 %.
 * Si quelques personnes ont une part fixe, répartit le reste équitablement
 * sur les autres.
 */
export function autoBalanceShares(cotenants: Cotenant[]): Record<string, number> {
  const fixed = cotenants.filter((c) => c.share_pct > 0);
  const flexible = cotenants.filter((c) => c.share_pct === 0 && c.status === "active");
  const fixedSum = fixed.reduce((s, c) => s + c.share_pct, 0);
  const remaining = Math.max(0, 100 - fixedSum);
  const perFlexible = flexible.length > 0 ? remaining / flexible.length : 0;
  const out: Record<string, number> = {};
  for (const c of cotenants) {
    out[c.id] = c.share_pct > 0 ? c.share_pct : (c.status === "active" ? perFlexible : 0);
  }
  return out;
}
