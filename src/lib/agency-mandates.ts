import { supabase, isSupabaseConfigured } from "./supabase";

export type MandateStatus =
  | "prospect"
  | "mandat_signe"
  | "diffuse"
  | "en_visite"
  | "offre_recue"
  | "sous_compromis"
  | "vendu"
  | "abandonne"
  | "expire";

export type MandateType = "exclusif" | "simple" | "semi_exclusif" | "recherche";

export const MANDATE_PIPELINE_ORDER: MandateStatus[] = [
  "prospect",
  "mandat_signe",
  "diffuse",
  "en_visite",
  "offre_recue",
  "sous_compromis",
  "vendu",
];

export const MANDATE_TERMINAL_STATES: MandateStatus[] = ["vendu", "abandonne", "expire"];

export interface AgencyMandate {
  id: string;
  user_id: string;
  org_id: string | null;
  reference: string | null;
  property_address: string;
  property_commune: string | null;
  property_type: string | null;
  property_surface: number | null;
  property_bedrooms: number | null;
  property_bathrooms: number | null;
  property_floor: number | null;
  property_year_built: number | null;
  property_epc_class: string | null;
  property_description: string | null;
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
  is_co_mandate: boolean;
  co_agency_name: string | null;
  co_agency_commission_pct: number | null;
  co_agency_contact: string | null;
  is_published: boolean;
  published_at: string | null;
  media_count: number;
  virtual_tour_url?: string | null;
  video_url?: string | null;
  virtual_tour_provider?: string | null;
  days_to_sign: number | null;
  days_to_close: number | null;
  created_at: string;
  updated_at: string;
}

export type VirtualTourProvider =
  | "matterport"
  | "klapty"
  | "eyespy360"
  | "kuula"
  | "youtube"
  | "vimeo"
  | "autre";

const TOUR_PROVIDERS: { id: VirtualTourProvider; label: string; hosts: string[] }[] = [
  { id: "matterport", label: "Matterport", hosts: ["my.matterport.com", "matterport.com"] },
  { id: "klapty", label: "Klapty", hosts: ["klapty.com"] },
  { id: "eyespy360", label: "EyeSpy360", hosts: ["eyespy360.com"] },
  { id: "kuula", label: "Kuula", hosts: ["kuula.co"] },
  { id: "youtube", label: "YouTube", hosts: ["youtube.com", "youtu.be"] },
  { id: "vimeo", label: "Vimeo", hosts: ["vimeo.com", "player.vimeo.com"] },
];

export function detectTourProvider(url: string | null): VirtualTourProvider | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    for (const p of TOUR_PROVIDERS) {
      if (p.hosts.some((h) => host === h || host.endsWith("." + h))) return p.id;
    }
    return "autre";
  } catch {
    return null;
  }
}

export function tourEmbedUrl(url: string): string {
  // Convert "watch" URLs to embeddable URLs for known providers
  try {
    const u = new URL(url);
    const host = u.hostname.toLowerCase().replace(/^www\./, "");
    // YouTube
    if (host === "youtube.com") {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    // Vimeo
    if (host === "vimeo.com") {
      const id = u.pathname.split("/").filter(Boolean)[0];
      if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}`;
    }
    // Matterport: my.matterport.com/show/?m=ID → embed via /show/?m=ID&play=1
    // No transformation needed for Matterport, Klapty, EyeSpy360, Kuula — they support direct iframe embed
    return url;
  } catch {
    return url;
  }
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

/**
 * Commission partagée en co-mandat : le mandat principal perçoit sa part,
 * l'agence partenaire perçoit co_agency_commission_pct du prix de vente.
 * Si co_agency_commission_pct est null mais is_co_mandate=true, on considère
 * 50/50 par défaut (usage courant LU).
 */
export function computeCoMandateSplit(m: Pick<AgencyMandate,
  "prix_demande" | "commission_pct" | "is_co_mandate" | "co_agency_commission_pct">): {
  total: number; primary: number; partner: number;
} {
  const total = computeEstimatedCommission(m);
  if (!m.is_co_mandate || total === 0) return { total, primary: total, partner: 0 };
  if (m.co_agency_commission_pct != null && m.commission_pct != null && m.commission_pct > 0) {
    const partnerShare = m.co_agency_commission_pct / m.commission_pct;
    const partner = total * Math.min(1, Math.max(0, partnerShare));
    return { total, primary: total - partner, partner };
  }
  return { total, primary: total / 2, partner: total / 2 };
}

export function mandateProgressPct(status: MandateStatus): number {
  if (status === "abandonne" || status === "expire") return 0;
  const idx = MANDATE_PIPELINE_ORDER.indexOf(status);
  if (idx < 0) return 0;
  return Math.round((idx / (MANDATE_PIPELINE_ORDER.length - 1)) * 100);
}

export function nextStatus(status: MandateStatus): MandateStatus | null {
  const idx = MANDATE_PIPELINE_ORDER.indexOf(status);
  if (idx < 0 || idx >= MANDATE_PIPELINE_ORDER.length - 1) return null;
  return MANDATE_PIPELINE_ORDER[idx + 1];
}

export async function getMandate(id: string): Promise<AgencyMandate | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("agency_mandates").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return data as AgencyMandate;
}
