import { supabase, isSupabaseConfigured } from "./supabase";

export interface ValuationSignature {
  id: string;
  user_id: string;
  hash: string;
  report_type: string;
  report_title: string | null;
  evaluator_name: string | null;
  evaluator_qualif: string | null;
  payload_summary: Record<string, unknown>;
  signed_at: string;
  revoked_at: string | null;
  revocation_reason: string | null;
}

export interface VerificationResult {
  found: boolean;
  revoked?: boolean;
  revoked_at?: string;
  revocation_reason?: string;
  signed_at?: string;
  report_type?: string;
  report_title?: string | null;
  evaluator_name?: string | null;
  evaluator_qualif?: string | null;
  payload_summary?: Record<string, unknown>;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

/**
 * Calcule le SHA-256 hex d'un objet JSON (représentation canonique).
 * Les clés sont triées pour assurer un hash stable entre sessions.
 */
export async function hashReportPayload(payload: unknown): Promise<string> {
  const canonical = canonicalStringify(payload);
  const buf = new TextEncoder().encode(canonical);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function canonicalStringify(v: unknown): string {
  if (v === null || v === undefined) return "null";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (typeof v === "string") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonicalStringify).join(",") + "]";
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify(obj[k])).join(",") + "}";
  }
  return "null";
}

export async function signValuation(input: {
  hash: string;
  reportType?: string;
  reportTitle?: string;
  evaluatorName?: string;
  evaluatorQualif?: string;
  payloadSummary?: Record<string, unknown>;
}): Promise<ValuationSignature> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const { data, error } = await client
    .from("valuation_signatures")
    .insert({
      user_id: user.id,
      hash: input.hash,
      report_type: input.reportType ?? "evs2025",
      report_title: input.reportTitle ?? null,
      evaluator_name: input.evaluatorName ?? null,
      evaluator_qualif: input.evaluatorQualif ?? null,
      payload_summary: input.payloadSummary ?? {},
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ValuationSignature;
}

export async function verifySignature(hash: string): Promise<VerificationResult> {
  if (!isSupabaseConfigured || !supabase) return { found: false };
  const { data, error } = await supabase.rpc("verify_signature", { p_hash: hash });
  if (error) return { found: false };
  return data as VerificationResult;
}

export async function listMySignatures(): Promise<ValuationSignature[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("valuation_signatures")
    .select("*")
    .order("signed_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as ValuationSignature[];
}

export async function revokeSignature(id: string, reason: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("valuation_signatures")
    .update({ revoked_at: new Date().toISOString(), revocation_reason: reason })
    .eq("id", id);
  if (error) throw error;
}

export function buildVerificationUrl(hash: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/verify?hash=${hash}`;
}
