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

export type SharedLinkPublic =
  | { success: false; error: 'not_found' | 'expired' | 'view_limit_reached' | 'invalid_token' | 'invalid_response' | 'unavailable' | 'no_service' }
  | { success: true; tool_type: SharedToolType; title: string | null; payload: Record<string, unknown>; view_count: number; expires_at: string };

export function validPublicShareToken(token: unknown): token is string { return typeof token === 'string' && /^[a-f0-9]{48}$/.test(token); }
const record = (value: unknown): value is Record<string, unknown> => value !== null && typeof value === 'object' && !Array.isArray(value);
/** Bound traversal before serializing. Preserve historical snapshots up to 1 MB; never coerce values. */
function validSnapshot(value: unknown): value is Record<string, unknown> {
  if (!record(value)) return false;
  let count = 0;
  const visit = (item: unknown, depth: number): boolean => {
    if (++count > 50000 || depth > 32) return false;
    if (item === null || typeof item === 'boolean' || typeof item === 'string') return true;
    if (typeof item === 'number') return Number.isFinite(item);
    if (Array.isArray(item)) return item.every(child => visit(child, depth + 1));
    if (record(item)) return Object.values(item).every(child => visit(child, depth + 1));
    return false;
  };
  try { return visit(value, 0) && new TextEncoder().encode(JSON.stringify(value)).length <= 1000000; } catch { return false; }
}
export function parsePublicSharedLink(data: unknown): SharedLinkPublic {
  const invalid: SharedLinkPublic = { success: false, error: 'invalid_response' };
  if (!record(data)) return invalid;
  if (data.success === false && ['not_found','expired','view_limit_reached'].includes(String(data.error))) return { success: false, error: data.error as 'not_found' | 'expired' | 'view_limit_reached' };
  if (data.success !== true || typeof data.tool_type !== 'string' || !['bilan-promoteur','estimation','valorisation','dcf-multi','hotel-valorisation','hotel-dscr'].includes(data.tool_type)
    || !(data.title === null || (typeof data.title === 'string' && data.title.length <= 2000)) || !validSnapshot(data.payload)
    || typeof data.view_count !== 'number' || !Number.isSafeInteger(data.view_count) || data.view_count < 0
    || typeof data.expires_at !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(data.expires_at) || !Number.isFinite(Date.parse(data.expires_at))) return invalid;
  return { success: true, tool_type: data.tool_type as SharedToolType, title: data.title, payload: data.payload, view_count: data.view_count, expires_at: data.expires_at };
}
export async function fetchSharedLinkByToken(token: string): Promise<SharedLinkPublic> {
  if (!validPublicShareToken(token)) return { success: false, error: 'invalid_token' };
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'no_service' };
  try {
    const { data, error } = await supabase.rpc('get_shared_link', { p_token: token }).abortSignal(AbortSignal.timeout(15000));
    return error ? { success: false, error: 'unavailable' } : parsePublicSharedLink(data);
  } catch { return { success: false, error: 'unavailable' }; }
}

export function buildSharedLinkUrl(token: string, baseUrl?: string): string {
  const base = baseUrl ?? (typeof window !== "undefined" ? window.location.origin : "https://tevaxia.lu");
  return `${base}/partage/${token}`;
}

export interface SharedLinkTimelineDay {
  day: string; // YYYY-MM-DD
  views: number;
}

export interface SharedLinkComment {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  message: string;
  created_at: string;
}

export type PostCommentError = 'empty_message' | 'message_too_long' | 'not_found' | 'expired' | 'rate_limited' | 'invalid_input' | 'unavailable';

export async function postSharedLinkComment(input: {
  token: string; message: string; visitorName?: string; visitorEmail?: string;
}): Promise<{ success: boolean; error?: PostCommentError }> {
  if (!validPublicShareToken(input.token) || typeof input.message !== 'string'
    || (input.visitorName !== undefined && (typeof input.visitorName !== 'string' || input.visitorName.length > 100))
    || (input.visitorEmail !== undefined && (typeof input.visitorEmail !== 'string' || input.visitorEmail.length > 200 || (input.visitorEmail.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.visitorEmail.trim()))))) return { success: false, error: 'invalid_input' };
  if (!input.message.trim()) return { success: false, error: 'empty_message' };
  if (input.message.length > 4000) return { success: false, error: 'message_too_long' };
  if (!isSupabaseConfigured || !supabase) return { success: false, error: 'unavailable' };
  try {
    const { data, error } = await supabase.rpc('post_shared_link_comment', { p_token: input.token, p_message: input.message.trim(), p_visitor_name: input.visitorName?.trim() || null, p_visitor_email: input.visitorEmail?.trim() || null }).abortSignal(AbortSignal.timeout(15000));
    if (error || !record(data)) return { success: false, error: 'unavailable' };
    if (data.success === true && data.error === undefined) return { success: true };
    if (data.success === false && ['empty_message','message_too_long','not_found','expired','rate_limited'].includes(String(data.error))) return { success: false, error: data.error as PostCommentError };
    return { success: false, error: 'unavailable' };
  } catch { return { success: false, error: 'unavailable' }; }
}
