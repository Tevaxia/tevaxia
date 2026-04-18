// ============================================================
// COOWNERSHIP REMINDERS — relances impayés automatisées
// ============================================================

import { supabase, isSupabaseConfigured } from "./supabase";

export type ReminderPalier = 1 | 2 | 3;
export type ReminderChannel = "email" | "letter" | "registered_letter" | "sms" | "hand_delivered";
export type ReminderDeliveryStatus = "queued" | "sent" | "delivered" | "failed" | "opened" | "bounced";

export interface ReminderRule {
  id: string;
  coownership_id: string;
  palier: ReminderPalier;
  days_after_due: number;
  label: string;
  template_body: string;
  apply_late_interest: boolean;
  interest_rate_pct: number;
  penalty_fixed_eur: number;
  min_amount_eur: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Reminder {
  id: string;
  coownership_id: string;
  charge_id: string;
  unit_id: string;
  palier: ReminderPalier;
  sent_at: string;
  channel: ReminderChannel;
  delivery_status: ReminderDeliveryStatus;
  amount_due: number;
  amount_paid: number;
  amount_outstanding: number;
  days_late: number;
  late_interest: number;
  penalty: number;
  total_claimed: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_address: string | null;
  letter_body: string | null;
  pdf_storage_path: string | null;
  sent_by: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface UnpaidCharge {
  charge_id: string;
  call_id: string;
  unit_id: string;
  lot_number: string;
  owner_name: string | null;
  owner_email: string | null;
  coownership_id: string;
  call_label: string;
  due_date: string;
  amount_due: number;
  amount_paid: number;
  amount_outstanding: number;
  days_late: number;
  last_palier_sent: number;
  eligible_palier: number;
}

export const PALIER_LABELS: Record<ReminderPalier, string> = {
  1: "Rappel amiable",
  2: "Mise en demeure",
  3: "Dernière mise en demeure",
};

export const PALIER_COLORS: Record<ReminderPalier, string> = {
  1: "bg-blue-100 text-blue-900",
  2: "bg-amber-100 text-amber-900",
  3: "bg-rose-100 text-rose-900",
};

export const CHANNEL_LABELS: Record<ReminderChannel, string> = {
  email: "Email",
  letter: "Courrier simple",
  registered_letter: "Recommandé",
  sms: "SMS",
  hand_delivered: "Remise en main propre",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

// ============================================================
// Règles
// ============================================================

export async function listReminderRules(coownershipId: string): Promise<ReminderRule[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("coownership_reminder_rules")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("palier");
  return (data ?? []) as ReminderRule[];
}

export async function updateReminderRule(id: string, patch: Partial<ReminderRule>): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("coownership_reminder_rules")
    .update({
      days_after_due: patch.days_after_due,
      label: patch.label,
      template_body: patch.template_body,
      apply_late_interest: patch.apply_late_interest,
      interest_rate_pct: patch.interest_rate_pct,
      penalty_fixed_eur: patch.penalty_fixed_eur,
      min_amount_eur: patch.min_amount_eur,
      active: patch.active,
    })
    .eq("id", id);
  if (error) throw error;
}

// ============================================================
// Impayés éligibles
// ============================================================

export async function listUnpaidCharges(coownershipId: string): Promise<UnpaidCharge[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("coownership_unpaid_charges")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("days_late", { ascending: false });
  return (data ?? []) as UnpaidCharge[];
}

// ============================================================
// Historique relances
// ============================================================

export async function listRemindersSent(coownershipId: string, limit = 100): Promise<Reminder[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("coownership_reminders")
    .select("*")
    .eq("coownership_id", coownershipId)
    .order("sent_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as Reminder[];
}

export async function listRemindersForCharge(chargeId: string): Promise<Reminder[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("coownership_reminders")
    .select("*")
    .eq("charge_id", chargeId)
    .order("palier");
  return (data ?? []) as Reminder[];
}

// ============================================================
// Envoi d'une relance
// ============================================================

export async function sendReminder(input: {
  coownership_id: string;
  charge_id: string;
  unit_id: string;
  palier: ReminderPalier;
  amount_due: number;
  amount_paid: number;
  amount_outstanding: number;
  days_late: number;
  late_interest: number;
  penalty: number;
  total_claimed: number;
  owner_name: string | null;
  owner_email: string | null;
  owner_address: string | null;
  letter_body: string;
  channel?: ReminderChannel;
  notes?: string;
}): Promise<Reminder> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("coownership_reminders")
    .insert({
      ...input,
      channel: input.channel ?? "letter",
      delivery_status: "sent", // on présume l'envoi effectué côté UI
      sent_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as Reminder;
}

// ============================================================
// Helpers purs
// ============================================================

/**
 * Calcule les intérêts de retard : outstanding × rate% × days / 365.
 * Taux légal LU 2026 = 5,75 % (loi 18.04.2004).
 */
export function computeLateInterest(outstanding: number, ratePct: number, daysLate: number): number {
  if (outstanding <= 0 || ratePct <= 0 || daysLate <= 0) return 0;
  return Math.round((outstanding * ratePct / 100 * daysLate / 365) * 100) / 100;
}

/**
 * Rend un template en remplaçant les variables {ref} {amount} {outstanding}
 * {interest} {penalty} {total} {rate} {days} {prev_date}.
 */
export function renderTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => {
    const v = vars[key];
    return v == null ? `{${key}}` : String(v);
  });
}

export function formatEurFR(n: number): string {
  return new Intl.NumberFormat("fr-LU", { style: "currency", currency: "EUR" }).format(n);
}

/**
 * Prépare la lettre à envoyer pour une charge impayée selon le palier.
 * Retourne la lettre rendue + tous les montants nécessaires.
 */
export function prepareReminder(
  charge: UnpaidCharge,
  rule: ReminderRule,
): {
  late_interest: number;
  penalty: number;
  total_claimed: number;
  letter_body: string;
} {
  const interest = rule.apply_late_interest
    ? computeLateInterest(charge.amount_outstanding, rule.interest_rate_pct, charge.days_late)
    : 0;
  const penalty = rule.penalty_fixed_eur;
  const total_claimed = charge.amount_outstanding + interest + penalty;

  const letter_body = renderTemplate(rule.template_body, {
    ref: charge.call_label,
    amount: formatEurFR(charge.amount_due),
    outstanding: formatEurFR(charge.amount_outstanding),
    interest: formatEurFR(interest),
    penalty: formatEurFR(penalty),
    total: formatEurFR(total_claimed),
    rate: rule.interest_rate_pct.toFixed(2),
    days: charge.days_late,
    prev_date: new Date(Date.now() - rule.days_after_due * 86400000).toLocaleDateString("fr-LU"),
  });

  return { late_interest: interest, penalty, total_claimed, letter_body };
}

/**
 * Vrai si cette charge peut bénéficier d'un nouveau palier.
 * On ne peut envoyer qu'un palier de niveau strictement supérieur
 * à celui déjà envoyé.
 */
export function canSendNewPalier(charge: UnpaidCharge): boolean {
  return charge.eligible_palier > charge.last_palier_sent;
}

export function nextPalier(charge: UnpaidCharge): ReminderPalier | null {
  if (!canSendNewPalier(charge)) return null;
  const next = charge.last_palier_sent + 1;
  if (next < 1 || next > 3) return null;
  return next as ReminderPalier;
}
