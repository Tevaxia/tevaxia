import { supabase, isSupabaseConfigured } from "./supabase";

export type SharedToolType = "bilan-promoteur" | "estimation" | "valorisation" | "dcf-multi" | "hotel-valorisation" | "hotel-dscr";

export interface SharedLink {
  id: string;
  token: string;
  owner_user_id: string | null;
  org_id: string | null;
  tool_type: SharedToolType;
  title: string | null;
  payload: Record<string, unknown>;
  view_count: number;
  max_views: number | null;
  expires_at: string;
  created_at: string;
}

export interface SharedLinkPublic {
  success: boolean;
  error?: "not_found" | "expired" | "view_limit_reached";
  tool_type?: SharedToolType;
  title?: string | null;
  payload?: Record<string, unknown>;
  view_count?: number;
  expires_at?: string;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function createSharedLink(input: {
  tool_type: SharedToolType;
  payload: Record<string, unknown>;
  title?: string;
  org_id?: string | null;
  max_views?: number;
  expires_in_days?: number;
}): Promise<SharedLink> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise pour partager un lien.");

  const expires_at = input.expires_in_days
    ? new Date(Date.now() + input.expires_in_days * 86400000).toISOString()
    : undefined;

  const { data, error } = await client
    .from("shared_links")
    .insert({
      owner_user_id: user.id,
      tool_type: input.tool_type,
      title: input.title ?? null,
      payload: input.payload,
      org_id: input.org_id ?? null,
      max_views: input.max_views ?? null,
      ...(expires_at && { expires_at }),
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as SharedLink;
}

export async function listMySharedLinks(): Promise<SharedLink[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("shared_links")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as SharedLink[];
}

export async function deleteSharedLink(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("shared_links").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchSharedLinkByToken(token: string): Promise<SharedLinkPublic> {
  const client = ensureClient();
  const { data, error } = await client.rpc("get_shared_link", { p_token: token });
  if (error) return { success: false, error: "not_found" };
  return data as SharedLinkPublic;
}

export function buildSharedLinkUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/partage/${token}`;
}

export interface SharedLinkTimelineDay {
  day: string; // YYYY-MM-DD
  views: number;
}

export async function fetchSharedLinkTimeline(
  linkId: string,
  days = 30,
): Promise<SharedLinkTimelineDay[]> {
  const client = ensureClient();
  const { data, error } = await client.rpc("get_shared_link_timeline", {
    p_link_id: linkId,
    p_days: days,
  });
  if (error) throw error;
  const payload = data as { success?: boolean; timeline?: SharedLinkTimelineDay[] };
  if (!payload?.success) return [];
  return payload.timeline ?? [];
}
