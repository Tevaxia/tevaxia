// ============================================================
// PMS — FOLIOS (client running tab)
// ============================================================

import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsChargeCategory, PmsFolio, PmsFolioCharge } from "./types";
import { prepareCharge } from "./charge-entry";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

/**
 * Catégories F&B vs autres services — drives TVA split in invoices.
 */
export const FB_CATEGORIES: PmsChargeCategory[] = [
  "breakfast", "lunch", "dinner", "bar", "minibar", "room_service",
];

export const OTHER_CATEGORIES: PmsChargeCategory[] = [
  "meeting_room", "parking", "laundry", "spa", "phone", "internet",
  "transport", "cancellation_fee", "damage", "other",
];

export const CATEGORY_LABELS: Record<PmsChargeCategory, string> = {
  room: "Hébergement",
  taxe_sejour: "Taxe séjour",
  extra_bed: "Lit supplémentaire",
  breakfast: "Petit-déjeuner",
  lunch: "Déjeuner",
  dinner: "Dîner",
  bar: "Bar",
  minibar: "Minibar",
  room_service: "Room service",
  meeting_room: "Salle de réunion",
  parking: "Parking",
  laundry: "Blanchisserie",
  spa: "Spa",
  phone: "Téléphone",
  internet: "Internet premium",
  transport: "Transport",
  cancellation_fee: "Frais annulation",
  damage: "Dommages",
  other: "Divers",
};

// ---------- Folios ----------

export async function getFolioByReservation(reservationId: string): Promise<PmsFolio | null> {
  const { data, error } = await ensureClient()
    .from("pms_folios")
    .select("*")
    .eq("reservation_id", reservationId)
    .maybeSingle();
  if (error) throw error;
  return (data as PmsFolio | null) ?? null;
}

export async function openFolio(propertyId: string, reservationId: string): Promise<PmsFolio> {
  const client = ensureClient();
  const reservation = await client.from("pms_reservations").select("id,currency").eq("id", reservationId).eq("property_id", propertyId).single();
  if (reservation.error || !reservation.data) throw new Error("Reservation unavailable");
  const { data, error } = await client
    .from("pms_folios")
    .upsert(
      { property_id: propertyId, reservation_id: reservationId, status: "open", currency: reservation.data.currency },
      { onConflict: "reservation_id", ignoreDuplicates: true },
    )
    .select("*")
    .maybeSingle();
  if (error) throw error;
  const folio = data ?? await getFolioByReservation(reservationId);
  if (!folio || folio.property_id !== propertyId) throw new Error("Folio unavailable");
  return folio as PmsFolio;
}

export async function autoPostRoomCharges(folioId: string): Promise<number> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_folio_auto_post_room_charges", { p_folio_id: folioId });
  if (error) throw error;
  return Number(data ?? 0);
}

/**
 * Convertit le folio en facture définitive (ventilation TVA automatique).
 * Retourne l'UUID de la facture créée.
 */
export async function settleFolio(folioId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_settle_folio", { p_folio_id: folioId });
  if (error) throw error;
  return data as string;
}

// ---------- Charges ----------

export async function listFolioCharges(folioId: string, includeVoided = false): Promise<PmsFolioCharge[]> {
  const client = ensureClient(), rows: PmsFolioCharge[] = [], ids = new Set<string>();
  let expected: number | null = null;
  for (let offset = 0; ; offset += 500) {
    let q = client.from("pms_folio_charges").select("*", { count: "exact" }).eq("folio_id", folioId);
    if (!includeVoided) q = q.eq("voided", false);
    const { data, error, count } = await q.order("posted_at", { ascending: true }).order("id").range(offset, offset + 499);
    if (error) throw error;
    if (count == null || count > 200000 || (expected !== null && count !== expected)) throw new Error("Incomplete or changing folio");
    expected = count;
    for (const row of data ?? []) {
      if (ids.has(row.id)) throw new Error("Duplicate folio row");
      ids.add(row.id); rows.push(row as PmsFolioCharge);
    }
    if (rows.length === expected) return rows;
    if (data?.length !== 500 || rows.length > expected) throw new Error("Incomplete folio");
  }
}

export async function postCharge(input: {
  id: string;
  folio_id: string;
  category: PmsChargeCategory;
  description: string;
  quantity: number;
  unit_price_ht: number;
  tva_rate: number;
  source?: string;
  external_ref?: string;
  notes: string;
}, expectedUserId: string): Promise<PmsFolioCharge> {
  const client = ensureClient();
  const validated = prepareCharge({ category: input.category, description: input.description, quantity: String(input.quantity), unit_price_ht: String(input.unit_price_ht), tva_rate: String(input.tva_rate), notes: input.notes });
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input.id)) throw new Error("Invalid charge identity");
  async function checkUser() {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user || data.user.id !== expectedUserId) throw new Error("Authentication changed");
  }
  await checkUser();
  const folio = await client.from("pms_folios").select("id, status, pms_properties!inner(user_id)").eq("id", input.folio_id).eq("pms_properties.user_id", expectedUserId).single();
  if (folio.error || !folio.data || folio.data.status !== "open") throw new Error("Folio unavailable or closed");
  await checkUser();
  const payload = {
    id: input.id, folio_id: input.folio_id, category: validated.category,
    description: validated.description, quantity: validated.quantity,
    unit_price_ht: validated.unit_price_ht, tva_rate: validated.tva_rate,
    source: input.source ?? "manual", external_ref: input.external_ref ?? null,
    notes: validated.notes, posted_by: expectedUserId,
  };
  const { data, error } = await client
    .from("pms_folio_charges")
    .insert(payload)
    .select("*")
    .single();
  if (error?.code === "23505") {
    const previous = await client.from("pms_folio_charges").select("*").eq("id", input.id).eq("folio_id", input.folio_id).eq("posted_by", expectedUserId).single();
    if (previous.error || !previous.data || previous.data.voided) throw error;
    // An ambiguous network retry reuses the same UUID, never creates a second line.
    for (const key of ["category", "description", "quantity", "unit_price_ht", "tva_rate", "notes", "source", "external_ref"] as const) {
      if (String(previous.data[key] ?? "") !== String(payload[key] ?? "")) throw error;
    }
    return previous.data as PmsFolioCharge;
  }
  if (error) throw error;
  if (!data) throw new Error("Missing charge response");
  return data as PmsFolioCharge;
}

export async function voidCharge(id: string, reason: string): Promise<void> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { error } = await client
    .from("pms_folio_charges")
    .update({
      voided: true,
      voided_at: new Date().toISOString(),
      voided_by: user?.id ?? null,
      void_reason: reason,
    })
    .eq("id", id);
  if (error) throw error;
}

// ---------- Pure helpers ----------

function recordedCents(value: number): number {
  const cents = Math.round(value * 100);
  if (typeof value !== "number" || !Number.isFinite(value) || !Number.isSafeInteger(cents) || Math.abs(value * 100 - cents) > 0.0001) throw new Error("Invalid recorded amount");
  return cents;
}
function fromCents(value: number): number {
  if (!Number.isSafeInteger(value)) throw new Error("Total too large");
  return value / 100;
}

/**
 * Groupe des charges par catégorie avec totaux HT/TVA/TTC.
 * Utile pour le récap visible côté page.
 */
export function groupChargesByCategory(
  charges: PmsFolioCharge[],
): Record<PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }> {
  const init: Record<string, { count: number; ht: number; tva: number; ttc: number }> = {};
  const out = init as Record<PmsChargeCategory, { count: number; ht: number; tva: number; ttc: number }>;
  for (const c of charges) {
    if (c.voided) continue;
    const key = c.category;
    if (!out[key]) out[key] = { count: 0, ht: 0, tva: 0, ttc: 0 };
    out[key].count += 1;
    out[key].ht += recordedCents(c.line_ht);
    out[key].tva += recordedCents(c.line_tva);
    out[key].ttc += recordedCents(c.line_ttc);
  }
  for (const row of Object.values(out)) { row.ht = fromCents(row.ht); row.tva = fromCents(row.tva); row.ttc = fromCents(row.ttc); }
  return out;
}

/**
 * Ventilation TVA pour pré-visualisation facture (3 buckets : hébergement / F&B / autres + taxe séjour).
 */
export function computeVatBreakdown(charges: PmsFolioCharge[]): {
  hebergement: { ht: number; tva: number; ttc: number };
  fb: { ht: number; tva: number; ttc: number };
  other: { ht: number; tva: number; ttc: number };
  taxe_sejour: number;
  total_ht: number;
  total_tva: number;
  total_ttc: number;
} {
  const out = {
    hebergement: { ht: 0, tva: 0, ttc: 0 },
    fb: { ht: 0, tva: 0, ttc: 0 },
    other: { ht: 0, tva: 0, ttc: 0 },
    taxe_sejour: 0,
    total_ht: 0,
    total_tva: 0,
    total_ttc: 0,
  };
  for (const c of charges) {
    if (c.voided) continue;
    if (c.category === "room" || c.category === "extra_bed") {
      out.hebergement.ht += recordedCents(c.line_ht);
      out.hebergement.tva += recordedCents(c.line_tva);
      out.hebergement.ttc += recordedCents(c.line_ttc);
    } else if (c.category === "taxe_sejour") {
      out.taxe_sejour += recordedCents(c.line_ttc);
    } else if (FB_CATEGORIES.includes(c.category)) {
      out.fb.ht += recordedCents(c.line_ht);
      out.fb.tva += recordedCents(c.line_tva);
      out.fb.ttc += recordedCents(c.line_ttc);
    } else {
      out.other.ht += recordedCents(c.line_ht);
      out.other.tva += recordedCents(c.line_tva);
      out.other.ttc += recordedCents(c.line_ttc);
    }
    out.total_ht += recordedCents(c.line_ht);
    out.total_tva += recordedCents(c.line_tva);
    out.total_ttc += recordedCents(c.line_ttc);
  }
  for (const row of [out.hebergement, out.fb, out.other]) { row.ht = fromCents(row.ht); row.tva = fromCents(row.tva); row.ttc = fromCents(row.ttc); }
  out.taxe_sejour = fromCents(out.taxe_sejour); out.total_ht = fromCents(out.total_ht); out.total_tva = fromCents(out.total_tva); out.total_ttc = fromCents(out.total_ttc);
  return out;
}
