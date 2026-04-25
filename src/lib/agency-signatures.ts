// ============================================================
// AGENCY SIGNATURES — signature électronique eIDAS simple
// ============================================================
//
// Conforme règlement UE 910/2014 (eIDAS) pour la "signature électronique
// simple" — valide pour contrats commerciaux (mandat immobilier LU).

import { supabase, isSupabaseConfigured } from "./supabase";

export type SignatureStatus =
  | "draft" | "sent" | "viewed" | "signed"
  | "declined" | "expired" | "cancelled";

export type SignatureDocumentType =
  | "mandat" | "avenant" | "compromis" | "bon_de_visite"
  | "rapport_estimation" | "autre";

export type SignatureEventType =
  | "created" | "sent" | "viewed" | "signed" | "declined"
  | "reminder_sent" | "expired" | "cancelled";

export interface SignatureRequest {
  id: string;
  mandate_id: string | null;
  user_id: string;
  org_id: string | null;
  document_type: SignatureDocumentType;
  document_title: string;
  document_body: string;
  document_hash: string;
  document_pdf_path: string | null;
  signer_name: string;
  signer_email: string;
  signer_phone: string | null;
  token: string;
  status: SignatureStatus;
  sent_at: string | null;
  first_viewed_at: string | null;
  signed_at: string | null;
  declined_at: string | null;
  declined_reason: string | null;
  expires_at: string;
  signer_ip: string | null;
  signer_user_agent: string | null;
  signer_timezone: string | null;
  consent_text: string | null;
  created_at: string;
  updated_at: string;
}

export interface SignatureEvent {
  id: string;
  request_id: string;
  event_type: SignatureEventType;
  event_at: string;
  actor_ip: string | null;
  actor_user_agent: string | null;
  actor_user_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export const STATUS_LABELS: Record<SignatureStatus, string> = {
  draft: "Brouillon",
  sent: "Envoyée",
  viewed: "Vue",
  signed: "Signée",
  declined: "Refusée",
  expired: "Expirée",
  cancelled: "Annulée",
};

export const STATUS_COLORS: Record<SignatureStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  sent: "bg-blue-100 text-blue-900",
  viewed: "bg-amber-100 text-amber-900",
  signed: "bg-emerald-100 text-emerald-900",
  declined: "bg-rose-100 text-rose-900",
  expired: "bg-gray-100 text-gray-700",
  cancelled: "bg-gray-200 text-gray-600",
};

export const DOCUMENT_TYPE_LABELS: Record<SignatureDocumentType, string> = {
  mandat: "Mandat",
  avenant: "Avenant",
  compromis: "Compromis de vente",
  bon_de_visite: "Bon de visite",
  rapport_estimation: "Rapport d'estimation",
  autre: "Autre document",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

/**
 * Génère un token opaque de 32 octets (256 bits) encodé base64url.
 * Unguessable — sécurité équivalente à un UUID v4 avec entropie ajoutée.
 */
export function generateToken(): string {
  const bytes = new Uint8Array(32);
  (globalThis.crypto ?? crypto).getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * SHA-256 hex du texte document (détection altération).
 */
export async function hashDocument(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const buf = await (globalThis.crypto ?? crypto).subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ============================================================
// CRUD
// ============================================================

export async function listSignatureRequests(opts: {
  mandateId?: string;
  status?: SignatureStatus[];
  limit?: number;
} = {}): Promise<SignatureRequest[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("agency_signature_requests").select("*");
  if (opts.mandateId) q = q.eq("mandate_id", opts.mandateId);
  if (opts.status?.length) q = q.in("status", opts.status);
  const { data } = await q.order("created_at", { ascending: false }).limit(opts.limit ?? 100);
  return (data ?? []) as SignatureRequest[];
}

export async function getSignatureRequest(id: string): Promise<SignatureRequest | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("agency_signature_requests")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as SignatureRequest | null) ?? null;
}

export async function createSignatureRequest(input: {
  mandate_id?: string;
  document_type: SignatureDocumentType;
  document_title: string;
  document_body: string;
  signer_name: string;
  signer_email: string;
  signer_phone?: string;
  expires_in_days?: number;
}): Promise<SignatureRequest> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const token = generateToken();
  const document_hash = await hashDocument(input.document_body);
  const days = input.expires_in_days ?? 30;
  const expires_at = new Date(Date.now() + days * 24 * 3600 * 1000).toISOString();

  const { data, error } = await client
    .from("agency_signature_requests")
    .insert({
      mandate_id: input.mandate_id ?? null,
      user_id: user.id,
      document_type: input.document_type,
      document_title: input.document_title,
      document_body: input.document_body,
      document_hash,
      signer_name: input.signer_name,
      signer_email: input.signer_email,
      signer_phone: input.signer_phone ?? null,
      token,
      expires_at,
      status: "draft",
    })
    .select("*")
    .single();
  if (error) throw error;

  // Log event 'created'
  await client.from("agency_signature_events").insert({
    request_id: (data as SignatureRequest).id,
    event_type: "created",
    actor_user_id: user.id,
  });

  return data as SignatureRequest;
}

export async function markAsSent(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("agency_signature_requests")
    .update({ status: "sent", sent_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  await client.from("agency_signature_events").insert({
    request_id: id, event_type: "sent",
  });
}

export async function cancelSignatureRequest(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("agency_signature_requests")
    .update({ status: "cancelled" })
    .eq("id", id);
  if (error) throw error;
  await client.from("agency_signature_events").insert({
    request_id: id, event_type: "cancelled",
  });
}

export async function listEvents(requestId: string): Promise<SignatureEvent[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("agency_signature_events")
    .select("*")
    .eq("request_id", requestId)
    .order("event_at");
  return (data ?? []) as SignatureEvent[];
}

// ============================================================
// URL helpers
// ============================================================

export function signingUrl(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "https://www.tevaxia.lu");
  return `${base}/signer/${token}`;
}

export interface MailtoLabels {
  subject: string;     // "Signature demandée : {title}"
  body: string;        // multiline template with {name}, {title}, {expires}, {url} placeholders
  dateLocale: string;  // e.g. "fr-LU"
}

export function mailtoLink(req: SignatureRequest, origin?: string, labels?: MailtoLabels): string {
  const url = signingUrl(req.token, origin);
  const fmt = (s: string, vars: Record<string, string>) =>
    s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
  const dateLocale = labels?.dateLocale ?? "fr-LU";
  const expires = new Date(req.expires_at).toLocaleDateString(dateLocale);
  const subjTpl = labels?.subject ?? "Signature demandée : {title}";
  const bodyTpl = labels?.body ?? (
    `Bonjour {name},\n\n` +
    `Vous êtes invité(e) à signer électroniquement le document suivant :\n\n` +
    `{title}\n\n` +
    `Lien de signature sécurisé (valable jusqu'au {expires}) :\n` +
    `{url}\n\n` +
    `La signature électronique simple est juridiquement valable selon le règlement UE 910/2014 (eIDAS).\n\n` +
    `Cordialement`
  );
  const subject = encodeURIComponent(fmt(subjTpl, { title: req.document_title }));
  const body = encodeURIComponent(fmt(bodyTpl, {
    name: req.signer_name,
    title: req.document_title,
    expires,
    url,
  }));
  return `mailto:${req.signer_email}?subject=${subject}&body=${body}`;
}

// ============================================================
// Consent text
// ============================================================

export const DEFAULT_CONSENT_TEXT = `En cochant cette case et en cliquant sur "Signer électroniquement", je déclare :
1. avoir pris connaissance du document ci-dessus dans son intégralité,
2. accepter son contenu et en reconnaître la force obligatoire,
3. consentir à l'utilisation de la signature électronique simple au sens du règlement UE 910/2014 (eIDAS),
4. que mon adresse IP, mon navigateur et l'horodatage soient enregistrés comme preuve de signature.`;
