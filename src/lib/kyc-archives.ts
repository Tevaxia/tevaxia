import { supabase, isSupabaseConfigured } from "./supabase";

export type KycDocumentType =
  | "id_document" | "proof_of_address" | "beneficial_owner" | "source_of_funds"
  | "source_of_wealth" | "pep_declaration" | "sanctions_screening"
  | "risk_assessment" | "business_relationship" | "correspondence"
  | "suspicious_activity" | "autre";

export type KycRiskLevel = "faible" | "standard" | "eleve" | "tres_eleve";

export interface KycCase {
  id: string;
  user_id: string;
  org_id: string | null;
  counterparty_name: string;
  counterparty_type: "personne_physique" | "personne_morale";
  counterparty_ref: string | null;
  relationship_start: string;
  relationship_end: string | null;
  risk_level: KycRiskLevel;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface KycArchive {
  id: string;
  case_id: string;
  document_type: KycDocumentType;
  title: string;
  storage_path: string;
  file_size: number | null;
  sha256: string;
  archived_by: string | null;
  archived_at: string;
  retention_until: string;
  metadata: Record<string, unknown>;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await globalThis.crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function listMyKycCases(): Promise<KycCase[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("kyc_cases")
    .select("*")
    .order("relationship_start", { ascending: false });
  if (error) return [];
  return (data ?? []) as KycCase[];
}

export async function createKycCase(input: {
  counterparty_name: string;
  counterparty_type: "personne_physique" | "personne_morale";
  counterparty_ref?: string;
  risk_level?: KycRiskLevel;
  notes?: string;
}): Promise<KycCase> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");
  const { data, error } = await client
    .from("kyc_cases")
    .insert({
      user_id: user.id,
      counterparty_name: input.counterparty_name,
      counterparty_type: input.counterparty_type,
      counterparty_ref: input.counterparty_ref ?? null,
      risk_level: input.risk_level ?? "standard",
      notes: input.notes ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as KycCase;
}

export async function closeKycCase(id: string, endDate: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("kyc_cases")
    .update({ relationship_end: endDate })
    .eq("id", id);
  if (error) throw error;
}

export async function listArchivesForCase(caseId: string): Promise<KycArchive[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("kyc_archives")
    .select("*")
    .eq("case_id", caseId)
    .order("archived_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as KycArchive[];
}

export async function uploadKycArchive(input: {
  caseId: string;
  documentType: KycDocumentType;
  title: string;
  file: File;
}): Promise<KycArchive> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const hash = await sha256Hex(input.file);
  const safeName = input.file.name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const storagePath = `${user.id}/${input.caseId}/${Date.now()}_${hash.slice(0, 12)}_${safeName}`;

  const { error: uploadErr } = await client.storage
    .from("aml-kyc")
    .upload(storagePath, input.file, {
      contentType: input.file.type || "application/octet-stream",
      upsert: false,
    });
  if (uploadErr) throw new Error(`Upload : ${uploadErr.message}`);

  const { data, error } = await client
    .from("kyc_archives")
    .insert({
      case_id: input.caseId,
      document_type: input.documentType,
      title: input.title,
      storage_path: storagePath,
      file_size: input.file.size,
      sha256: hash,
      archived_by: user.id,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as KycArchive;
}

export async function getKycSignedUrl(storagePath: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.storage
    .from("aml-kyc")
    .createSignedUrl(storagePath, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}
