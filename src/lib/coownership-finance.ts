// ============================================================
// COOWNERSHIP FINANCE — budgets, appels de fonds, paiements
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export interface CoownershipBudget {
  id: string;
  coownership_id: string;
  year: number;
  total_budget: number;
  approved_at_ag: string | null;
  categories: Record<string, number>;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type CallStatus = "draft" | "issued" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type CallNature = "courantes" | "travaux" | "fonds_travaux" | "exceptionnel";

export interface CoownershipCall {
  id: string;
  coownership_id: string;
  label: string;
  period_start: string;
  period_end: string;
  due_date: string;
  total_amount: number;
  budget_share_pct: number | null;
  bank_iban: string | null;
  bank_bic: string | null;
  bank_account_holder: string | null;
  payment_reference_template: string | null;
  status: CallStatus;
  notes: string | null;
  allocation_key_id: string | null;
  nature: CallNature | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnitCharge {
  id: string;
  call_id: string;
  unit_id: string;
  amount_due: number;
  amount_paid: number;
  payment_reference: string | null;
  paid_at: string | null;
  payment_method: string | null;
  reminder_count: number;
  last_reminder_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

// ---------- Budgets ----------

export async function listBudgets(coownershipId: string): Promise<CoownershipBudget[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_budgets")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("year", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CoownershipBudget[];
}

export async function upsertBudget(input: {
  id?: string;
  coownership_id: string;
  year: number;
  total_budget: number;
  approved_at_ag?: string | null;
  categories?: Record<string, number>;
  notes?: string;
}): Promise<CoownershipBudget> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const payload = {
    coownership_id: input.coownership_id,
    year: input.year,
    total_budget: input.total_budget,
    approved_at_ag: input.approved_at_ag ?? null,
    categories: input.categories ?? {},
    notes: input.notes ?? null,
    created_by: user?.id ?? null,
  };
  const { data, error } = input.id
    ? await client.from("coownership_budgets").update(payload).eq("id", input.id).select("*").single()
    : await client.from("coownership_budgets").upsert(payload, { onConflict: "coownership_id,year" }).select("*").single();
  if (error) throw error;
  return data as CoownershipBudget;
}

// ---------- Calls (appels de fonds) ----------

export async function listCalls(coownershipId: string): Promise<CoownershipCall[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_calls")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("due_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as CoownershipCall[];
}

export async function getCall(id: string): Promise<CoownershipCall | null> {
  const client = ensureClient();
  const { data, error } = await client.from("coownership_calls").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return (data as CoownershipCall | null) ?? null;
}

export async function createCall(input: Omit<CoownershipCall, "id" | "created_at" | "updated_at" | "created_by" | "status"> & { status?: CallStatus }): Promise<CoownershipCall> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_calls")
    .insert({ ...input, status: input.status ?? "draft", created_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as CoownershipCall;
}

export async function updateCall(id: string, patch: Partial<CoownershipCall>): Promise<CoownershipCall> {
  const client = ensureClient();
  const { data, error } = await client.from("coownership_calls").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return data as CoownershipCall;
}

export async function deleteCall(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("coownership_calls").delete().eq("id", id);
  if (error) throw error;
}

// ---------- Unit charges ----------

export async function listCharges(callId: string): Promise<UnitCharge[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("coownership_unit_charges")
    .select("*")
    .eq("call_id", callId);
  if (error) throw error;
  return (data ?? []) as UnitCharge[];
}

/**
 * Génère automatiquement les charges individuelles à partir d'un appel.
 * Utilise la RPC `generate_charges_with_key` qui applique la clé de
 * répartition définie sur l'appel (allocation_key_id). Si aucune clé
 * n'est spécifiée, la clé système "tantiemes_generaux" est utilisée
 * par défaut (répartition classique par tantièmes).
 * Idempotent : écrase les lignes existantes pour ce call en statut draft.
 */
export async function generateChargesForCall(callId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("generate_charges_with_key", { p_call_id: callId });
  if (error) throw error;
  return Number(data ?? 0);
}

export async function markChargePaid(chargeId: string, amount: number, method: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_unit_charges")
    .update({
      amount_paid: amount,
      paid_at: new Date().toISOString(),
      payment_method: method,
    })
    .eq("id", chargeId);
  if (error) throw error;
}

export async function resetCharge(chargeId: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_unit_charges")
    .update({ amount_paid: 0, paid_at: null, payment_method: null })
    .eq("id", chargeId);
  if (error) throw error;
}
