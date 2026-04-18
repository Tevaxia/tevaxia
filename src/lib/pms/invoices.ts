import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsInvoice } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listInvoices(propertyId: string): Promise<PmsInvoice[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_invoices")
    .select("*")
    .eq("property_id", propertyId)
    .order("issue_date", { ascending: false })
    .limit(500);
  if (error) return [];
  return (data ?? []) as PmsInvoice[];
}

export async function getInvoice(id: string): Promise<PmsInvoice | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("pms_invoices").select("*").eq("id", id).single();
  if (error) return null;
  return data as PmsInvoice;
}

export async function nextInvoiceNumber(propertyId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_next_invoice_number", { p_property_id: propertyId });
  if (error) throw error;
  return data as string;
}

export async function createInvoice(
  input: Partial<PmsInvoice> & { property_id: string; customer_name: string }
): Promise<PmsInvoice> {
  const client = ensureClient();
  const number = input.invoice_number ?? (await nextInvoiceNumber(input.property_id));
  const { data, error } = await client
    .from("pms_invoices")
    .insert({ ...input, invoice_number: number })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsInvoice;
}

export async function issueInvoice(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("pms_invoices")
    .update({ issued: true, issued_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markInvoicePaid(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("pms_invoices")
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

/**
 * Calcule les totaux d'une facture (HT, TVA par catégorie, TTC, taxe séjour).
 * TVA LU hébergement 3 % (art. 40 loi TVA 12.02.1979 + annexe B).
 * TVA LU F&B 17 % sauf certains cas à 8/14 %.
 */
export function computeInvoiceTotals(lines: {
  hebergementHt: number;
  hebergementTvaRate: number;
  fbHt: number;
  fbTvaRate: number;
  otherHt: number;
  otherTvaRate: number;
  taxeSejour: number;
}): {
  hebergementTva: number;
  fbTva: number;
  otherTva: number;
  totalHt: number;
  totalTva: number;
  totalTtc: number;
} {
  const r = (n: number) => Math.round(n * 100) / 100;
  const hebergementTva = r(lines.hebergementHt * lines.hebergementTvaRate / 100);
  const fbTva = r(lines.fbHt * lines.fbTvaRate / 100);
  const otherTva = r(lines.otherHt * lines.otherTvaRate / 100);
  const totalHt = r(lines.hebergementHt + lines.fbHt + lines.otherHt);
  const totalTva = r(hebergementTva + fbTva + otherTva);
  const totalTtc = r(totalHt + totalTva + lines.taxeSejour);
  return { hebergementTva, fbTva, otherTva, totalHt, totalTva, totalTtc };
}

/**
 * À partir d'un total TTC, calcule le HT correspondant (utile pour afficher ventilation
 * si l'hôtelier saisit le TTC et non le HT).
 */
export function ttcToHt(ttc: number, tvaRatePct: number): number {
  return Math.round((ttc / (1 + tvaRatePct / 100)) * 100) / 100;
}
