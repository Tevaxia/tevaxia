import { supabase, isSupabaseConfigured } from "../supabase";

export type PmsCalendarSource =
  | "airbnb" | "booking" | "vrbo" | "homeaway"
  | "expedia" | "agoda" | "tripadvisor" | "custom_ics";

export interface PmsExternalCalendar {
  id: string;
  property_id: string;
  room_id: string | null;
  room_type_id: string | null;
  source: PmsCalendarSource;
  label: string;
  ics_url: string;
  active: boolean;
  color: string | null;
  min_los: number | null;
  last_sync_at: string | null;
  last_sync_status: string | null;
  last_error: string | null;
  sync_count: number;
  events_count: number;
  created_at: string;
  updated_at: string;
}

export interface ExternalCalendarStats {
  active_blocks: number;
  future_blocks: number;
  past_blocks: number;
  last_event_end: string | null;
}

export const SOURCE_LABELS: Record<PmsCalendarSource, string> = {
  airbnb: "Airbnb",
  booking: "Booking.com",
  vrbo: "VRBO",
  homeaway: "HomeAway",
  expedia: "Expedia",
  agoda: "Agoda",
  tripadvisor: "TripAdvisor",
  custom_ics: "Flux iCal personnalisé",
};

export const SOURCE_COLORS: Record<PmsCalendarSource, string> = {
  airbnb: "#FF5A5F",
  booking: "#003580",
  vrbo: "#245ABC",
  homeaway: "#3182CE",
  expedia: "#FFC72C",
  agoda: "#5392F9",
  tripadvisor: "#00AF87",
  custom_ics: "#6366F1",
};

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listCalendars(propertyId: string): Promise<PmsExternalCalendar[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_external_calendars")
    .select("*")
    .eq("property_id", propertyId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PmsExternalCalendar[];
}

export async function getCalendar(id: string): Promise<PmsExternalCalendar | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data } = await supabase
    .from("pms_external_calendars")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return (data as PmsExternalCalendar | null) ?? null;
}

export async function createCalendar(input: {
  property_id: string;
  room_id?: string | null;
  room_type_id?: string | null;
  source: PmsCalendarSource;
  label: string;
  ics_url: string;
  color?: string | null;
  min_los?: number | null;
}): Promise<PmsExternalCalendar> {
  const client = ensureClient();
  const { data, error } = await client
    .from("pms_external_calendars")
    .insert({
      property_id: input.property_id,
      room_id: input.room_id ?? null,
      room_type_id: input.room_type_id ?? null,
      source: input.source,
      label: input.label,
      ics_url: input.ics_url,
      color: input.color ?? SOURCE_COLORS[input.source],
      min_los: input.min_los ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsExternalCalendar;
}

export async function updateCalendar(id: string, patch: Partial<PmsExternalCalendar>): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("pms_external_calendars")
    .update(patch)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCalendar(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_external_calendars").delete().eq("id", id);
  if (error) throw error;
}

export async function calendarStats(id: string): Promise<ExternalCalendarStats | null> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_external_calendar_stats", { p_calendar_id: id });
  if (error) return null;
  const row = Array.isArray(data) ? data[0] : data;
  return row as ExternalCalendarStats | null;
}

/**
 * Déclenche une synchronisation via la route API server-side (obligatoire
 * car fetch cross-origin vers airbnb/booking est bloqué côté client).
 */
export async function triggerSync(calendarId: string): Promise<{
  ok: boolean; imported: number; updated: number; deactivated: number; error?: string;
}> {
  const client = ensureClient();
  const { data: { session } } = await client.auth.getSession();
  const token = session?.access_token ?? "";
  const res = await fetch(`/api/pms/sync-calendar/${calendarId}`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    const text = await res.text();
    return { ok: false, imported: 0, updated: 0, deactivated: 0, error: text };
  }
  return res.json();
}

export function iCalUrlValidation(url: string): string | null {
  if (!url.trim()) return "URL requise.";
  if (!/^(https?|webcal):\/\//i.test(url)) {
    return "L'URL doit commencer par http://, https:// ou webcal://";
  }
  if (url.length > 2000) return "URL trop longue.";
  return null;
}

/**
 * Détecte la source à partir de l'URL.
 */
export function detectSourceFromUrl(url: string): PmsCalendarSource {
  const u = url.toLowerCase();
  if (u.includes("airbnb")) return "airbnb";
  if (u.includes("booking.com") || u.includes("admin.booking")) return "booking";
  if (u.includes("vrbo")) return "vrbo";
  if (u.includes("homeaway")) return "homeaway";
  if (u.includes("expedia")) return "expedia";
  if (u.includes("agoda")) return "agoda";
  if (u.includes("tripadvisor")) return "tripadvisor";
  return "custom_ics";
}
