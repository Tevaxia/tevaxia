import { supabase, isSupabaseConfigured } from "./supabase";

export type OfferStatus =
  | "received"
  | "counter_sent"
  | "counter_received"
  | "accepted"
  | "refused"
  | "withdrawn"
  | "expired";

export interface AgencyMandateOffer {
  id: string;
  mandate_id: string;
  buyer_contact_id: string | null;
  buyer_name: string;
  buyer_email: string | null;
  buyer_phone: string | null;
  amount_eur: number;
  currency: string;
  offered_at: string;
  valid_until: string | null;
  status: OfferStatus;
  requires_financing: boolean;
  financing_amount_eur: number | null;
  financing_bank: string | null;
  financing_deadline: string | null;
  requires_sale_of_current_property: boolean;
  other_conditions: string | null;
  response_notes: string | null;
  accepted_at: string | null;
  refused_at: string | null;
  compromis_id: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  received: "Reçue",
  counter_sent: "Contre-proposition envoyée",
  counter_received: "Contre-proposition reçue",
  accepted: "Acceptée",
  refused: "Refusée",
  withdrawn: "Retirée",
  expired: "Expirée",
};

export const OFFER_STATUS_COLORS: Record<OfferStatus, string> = {
  received: "bg-blue-100 text-blue-900",
  counter_sent: "bg-amber-100 text-amber-900",
  counter_received: "bg-amber-100 text-amber-900",
  accepted: "bg-emerald-100 text-emerald-900",
  refused: "bg-rose-100 text-rose-900",
  withdrawn: "bg-gray-100 text-gray-700",
  expired: "bg-gray-100 text-gray-600",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listOffers(mandateId: string): Promise<AgencyMandateOffer[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("agency_mandate_offers")
    .select("*")
    .eq("mandate_id", mandateId)
    .order("offered_at", { ascending: false });
  return (data ?? []) as AgencyMandateOffer[];
}

export async function createOffer(
  input: Partial<AgencyMandateOffer> & { mandate_id: string; buyer_name: string; amount_eur: number },
): Promise<AgencyMandateOffer> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("agency_mandate_offers")
    .insert({ ...input, created_by: user?.id ?? null })
    .select("*")
    .single();
  if (error) throw error;
  return data as AgencyMandateOffer;
}

export async function updateOffer(id: string, patch: Partial<AgencyMandateOffer>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("agency_mandate_offers").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteOffer(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("agency_mandate_offers").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Rapport offre vs prix demandé : pourcentage + verdict qualitatif.
 */
export function offerVsAsking(offer: Pick<AgencyMandateOffer, "amount_eur">, askingPrice: number | null): {
  diff: number; pct: number | null; verdict: "above" | "at" | "below_5" | "below_10" | "below";
} {
  if (!askingPrice || askingPrice === 0) {
    return { diff: 0, pct: null, verdict: "at" };
  }
  const diff = offer.amount_eur - askingPrice;
  const pct = (offer.amount_eur / askingPrice - 1) * 100;
  let verdict: "above" | "at" | "below_5" | "below_10" | "below";
  if (pct >= 0.5) verdict = "above";
  else if (pct > -0.5) verdict = "at";
  else if (pct > -5) verdict = "below_5";
  else if (pct > -10) verdict = "below_10";
  else verdict = "below";
  return { diff, pct, verdict };
}
