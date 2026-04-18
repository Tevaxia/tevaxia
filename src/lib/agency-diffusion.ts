import { supabase, isSupabaseConfigured } from "./supabase";

export type MandatePortal =
  | "athome"
  | "immotop"
  | "immoweb"
  | "athome_finance"
  | "linkedin"
  | "facebook"
  | "website"
  | "seloger"
  | "leboncoin"
  | "other";

export type DiffusionStatus =
  | "draft"
  | "pending"
  | "published"
  | "paused"
  | "expired"
  | "withdrawn"
  | "rejected";

export interface AgencyMandateDiffusion {
  id: string;
  mandate_id: string;
  portal: MandatePortal;
  status: DiffusionStatus;
  external_ref: string | null;
  public_url: string | null;
  published_at: string | null;
  expires_at: string | null;
  withdrawn_at: string | null;
  views_count: number | null;
  leads_count: number | null;
  last_sync_at: string | null;
  highlighted: boolean;
  cost_eur: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const PORTAL_LABELS: Record<MandatePortal, string> = {
  athome: "athome.lu",
  immotop: "Immotop.lu",
  immoweb: "Immoweb",
  athome_finance: "atHomeFinance",
  linkedin: "LinkedIn",
  facebook: "Facebook",
  website: "Site agence",
  seloger: "SeLoger (FR)",
  leboncoin: "Leboncoin (FR)",
  other: "Autre",
};

export const DIFFUSION_STATUS_LABELS: Record<DiffusionStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  published: "En ligne",
  paused: "Suspendu",
  expired: "Expiré",
  withdrawn: "Retiré",
  rejected: "Rejeté",
};

export const DIFFUSION_STATUS_COLORS: Record<DiffusionStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  published: "bg-emerald-100 text-emerald-900",
  paused: "bg-gray-100 text-gray-700",
  expired: "bg-rose-100 text-rose-800",
  withdrawn: "bg-gray-200 text-gray-600",
  rejected: "bg-rose-100 text-rose-900",
};

/**
 * Portails LU recommandés par défaut — ordre d'impact marché.
 */
export const DEFAULT_LU_PORTALS: MandatePortal[] = [
  "athome",
  "immotop",
  "immoweb",
  "website",
];

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listDiffusion(mandateId: string): Promise<AgencyMandateDiffusion[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data } = await supabase
    .from("agency_mandate_diffusion")
    .select("*")
    .eq("mandate_id", mandateId)
    .order("portal");
  return (data ?? []) as AgencyMandateDiffusion[];
}

export async function upsertDiffusion(
  mandateId: string,
  portal: MandatePortal,
  patch: Partial<AgencyMandateDiffusion>,
): Promise<AgencyMandateDiffusion> {
  const client = ensureClient();
  const payload = { mandate_id: mandateId, portal, ...patch };
  const { data, error } = await client
    .from("agency_mandate_diffusion")
    .upsert(payload, { onConflict: "mandate_id,portal" })
    .select("*")
    .single();
  if (error) throw error;
  return data as AgencyMandateDiffusion;
}

export async function updateDiffusionStatus(
  id: string,
  status: DiffusionStatus,
  patch: Partial<AgencyMandateDiffusion> = {},
): Promise<void> {
  const client = ensureClient();
  const extra: Partial<AgencyMandateDiffusion> = { ...patch };
  if (status === "published" && !patch.published_at) {
    extra.published_at = new Date().toISOString();
  }
  if (status === "withdrawn" && !patch.withdrawn_at) {
    extra.withdrawn_at = new Date().toISOString();
  }
  const { error } = await client
    .from("agency_mandate_diffusion")
    .update({ status, ...extra })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDiffusion(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("agency_mandate_diffusion").delete().eq("id", id);
  if (error) throw error;
}

/**
 * Incrémente les compteurs vues/leads lors d'un sync API portail.
 * (Futur : route cron qui tire les stats depuis athome / Immotop.)
 */
export async function syncDiffusionStats(
  id: string,
  stats: { views?: number; leads?: number },
): Promise<void> {
  const client = ensureClient();
  const patch: Record<string, unknown> = { last_sync_at: new Date().toISOString() };
  if (stats.views != null) patch.views_count = stats.views;
  if (stats.leads != null) patch.leads_count = stats.leads;
  const { error } = await client.from("agency_mandate_diffusion").update(patch).eq("id", id);
  if (error) throw error;
}
