import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface PortalToken {
  id: string;
  coownership_id: string;
  unit_id: string | null;
  token: string;
  email: string | null;
  expires_at: string;
  view_count: number;
  last_viewed_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

export interface PortalData {
  coownership: {
    name: string;
    address: string | null;
    commune: string | null;
    total_tantiemes: number;
    nb_lots: number;
    year_built: number | null;
    last_ag_date: string | null;
    next_ag_date: string | null;
    works_fund_balance: number | null;
  } | null;
  unit: {
    lot_number: string;
    unit_type: string;
    floor: number | null;
    surface_m2: number | null;
    nb_rooms: number | null;
    tantiemes: number;
    owner_name: string | null;
    owner_email: string | null;
    occupancy: string;
  } | null;
  assemblies: Array<{
    id: string;
    title: string;
    type: string;
    scheduled_at: string;
    status: string;
  }>;
  fund_calls: Array<{
    id: string;
    period: string;
    amount_due: number;
    amount_paid: number;
    paid: boolean;
    due_date: string;
  }>;
  error?: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase non configuré");
  return supabase;
}

function generateToken(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listPortalTokens(coownershipId: string): Promise<PortalToken[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_portal_tokens")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PortalToken[];
}

export async function createPortalToken(input: {
  coownership_id: string;
  unit_id?: string | null;
  email?: string | null;
  expires_in_days?: number;
}): Promise<PortalToken> {
  const client = ensureClient();
  const token = `ptk_${generateToken()}`;
  const expiresAt = new Date(Date.now() + (input.expires_in_days ?? 365) * 86400_000);
  const { data, error } = await client
    .from("coownership_portal_tokens")
    .insert({
      coownership_id: input.coownership_id,
      unit_id: input.unit_id ?? null,
      email: input.email ?? null,
      token,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data as PortalToken;
}

export async function revokePortalToken(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_portal_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function getPortalData(token: string): Promise<PortalData> {
  const client = ensureClient();
  const { data, error } = await client.rpc("get_portal_data", { p_token: token });
  if (error) throw error;
  return data as PortalData;
}

export function buildPortalUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/copropriete/${token}`;
}

// ============================================================
// Portal account (solde, impayés, relances, exercices)
// ============================================================

export interface PortalAccountData {
  coownership_name?: string;
  lot_number?: string;
  owner_name?: string | null;
  tantiemes?: number;
  total_tantiemes?: number;
  balance?: {
    total_due: number;
    total_paid: number;
    outstanding: number;
    nb_unpaid: number;
  };
  unpaid?: Array<{
    charge_id: string;
    call_label: string;
    due_date: string;
    amount_due: number;
    amount_paid: number;
    outstanding: number;
    days_late: number;
    payment_reference: string | null;
  }>;
  reminders?: Array<{
    palier: number;
    sent_at: string;
    channel: string;
    amount_outstanding: number;
    late_interest: number;
    penalty: number;
    total_claimed: number;
  }>;
  years?: Array<{
    year_id: string;
    year: number;
    status: "open" | "closed";
    closed_at: string | null;
  }>;
  error?: string;
}

export async function getPortalAccount(token: string): Promise<PortalAccountData> {
  const client = ensureClient();
  const { data, error } = await client.rpc("get_portal_account", { p_token: token });
  if (error) throw error;
  if (data?.error) return data as PortalAccountData;
  if (!data?.balance || !Array.isArray(data.unpaid) || !Array.isArray(data.reminders) || !Array.isArray(data.years)
    || ['total_due', 'total_paid', 'outstanding', 'nb_unpaid'].some(key => !Number.isFinite(data.balance[key]))) throw new Error('Portal account unavailable');
  return data as PortalAccountData;
}
