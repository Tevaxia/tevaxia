import { supabase, isSupabaseConfigured } from "../supabase";
import type { PmsRoom, PmsRoomType, PmsRoomStatus } from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listRoomTypes(propertyId: string): Promise<PmsRoomType[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_room_types")
    .select("*")
    .eq("property_id", propertyId)
    .order("display_order")
    .order("code");
  if (error) return [];
  return (data ?? []) as PmsRoomType[];
}

export async function createRoomType(
  input: Partial<PmsRoomType> & { property_id: string; code: string; name: string }
): Promise<PmsRoomType> {
  const client = ensureClient();
  const { data, error } = await client.from("pms_room_types").insert(input).select("*").single();
  if (error) throw error;
  return data as PmsRoomType;
}

export async function updateRoomType(id: string, patch: Partial<PmsRoomType>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_room_types").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteRoomType(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_room_types").delete().eq("id", id);
  if (error) throw error;
}

export async function listRooms(propertyId: string): Promise<PmsRoom[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_rooms")
    .select("*")
    .eq("property_id", propertyId)
    .order("floor", { ascending: true, nullsFirst: true })
    .order("number");
  if (error) return [];
  return (data ?? []) as PmsRoom[];
}

export async function createRoom(
  input: Partial<PmsRoom> & { property_id: string; room_type_id: string; number: string }
): Promise<PmsRoom> {
  const client = ensureClient();
  const { data, error } = await client.from("pms_rooms").insert(input).select("*").single();
  if (error) throw error;
  return data as PmsRoom;
}

export async function updateRoom(id: string, patch: Partial<PmsRoom>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_rooms").update(patch).eq("id", id);
  if (error) throw error;
}

export async function setRoomStatus(id: string, status: PmsRoomStatus, note?: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("pms_rooms")
    .update({ status, status_note: note ?? null })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteRoom(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_rooms").delete().eq("id", id);
  if (error) throw error;
}

export function statusColor(status: PmsRoomStatus): string {
  switch (status) {
    case "available": return "#10b981"; // emerald
    case "occupied": return "#3b82f6";  // blue
    case "dirty": return "#f97316";     // orange
    case "clean": return "#84cc16";     // lime
    case "inspected": return "#22c55e"; // green
    case "out_of_order": return "#ef4444"; // red
    case "maintenance": return "#eab308"; // yellow
  }
}

export function statusLabel(status: PmsRoomStatus): string {
  switch (status) {
    case "available": return "Disponible";
    case "occupied": return "Occupée";
    case "dirty": return "À nettoyer";
    case "clean": return "Propre";
    case "inspected": return "Inspectée";
    case "out_of_order": return "Hors service";
    case "maintenance": return "Maintenance";
  }
}
