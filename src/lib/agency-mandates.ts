import { supabase, isSupabaseConfigured } from "./supabase";

export type MandateStatus =
  | "prospect" | "mandat_signe" | "sous_compromis" | "vendu" | "abandonne" | "expire";

export type MandateType = "exclusif" | "simple" | "semi_exclusif" | "recherche";

export interface AgencyMandate {
  id: string;
  user_id: string;
  org_id: string | null;
  reference: string | null;
  property_address: string;
  property_commune: string | null;
  property_type: string | null;
  property_surface: number | null;
  prix_demande: number | null;
  client_name: string | null;
  client_email: string | null;
  client_phone: string | null;
  mandate_type: MandateType;
  status: MandateStatus;
  commission_pct: number | null;
  commission_amount_estimee: number | null;
  commission_amount_percue: number | null;
  start_date: string | null;
  end_date: string | null;
  signed_at: string | null;
  sold_at: string | null;
  sold_price: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listMyMandates(): Promise<AgencyMandate[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("agency_mandates")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as AgencyMandate[];
}

export async function createMandate(input: Partial<AgencyMandate> & { property_address: string }): Promise<AgencyMandate> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("agency_mandates")
    .insert({ ...input, user_id: user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as AgencyMandate;
}

export async function updateMandate(id: string, patch: Partial<AgencyMandate>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("agency_mandates").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteMandate(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("agency_mandates").delete().eq("id", id);
  if (error) throw error;
}

export function computeEstimatedCommission(m: Pick<AgencyMandate, "prix_demande" | "commission_pct">): number {
  if (!m.prix_demande || !m.commission_pct) return 0;
  return m.prix_demande * (m.commission_pct / 100);
}

export function mandateDaysRemaining(endDate: string | null): number | null {
  if (!endDate) return null;
  return Math.floor((new Date(endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}
