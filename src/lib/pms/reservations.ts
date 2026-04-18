import { supabase, isSupabaseConfigured } from "../supabase";
import type {
  PmsAvailabilityRow,
  PmsPayment,
  PmsPaymentMethod,
  PmsReservation,
  PmsReservationRoom,
  PmsReservationStatus,
} from "./types";

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function listReservations(
  propertyId: string,
  opts: { fromDate?: string; toDate?: string; status?: PmsReservationStatus[] } = {},
): Promise<PmsReservation[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  let q = supabase.from("pms_reservations").select("*").eq("property_id", propertyId);
  if (opts.fromDate) q = q.gte("check_out", opts.fromDate);
  if (opts.toDate) q = q.lte("check_in", opts.toDate);
  if (opts.status?.length) q = q.in("status", opts.status);
  const { data, error } = await q.order("check_in", { ascending: false });
  if (error) return [];
  return (data ?? []) as PmsReservation[];
}

export async function getReservation(id: string): Promise<PmsReservation | null> {
  if (!isSupabaseConfigured || !supabase) return null;
  const { data, error } = await supabase.from("pms_reservations").select("*").eq("id", id).single();
  if (error) return null;
  return data as PmsReservation;
}

export async function nextReservationNumber(propertyId: string): Promise<string> {
  const client = ensureClient();
  const { data, error } = await client.rpc("pms_next_reservation_number", {
    p_property_id: propertyId,
  });
  if (error) throw error;
  return data as string;
}

export async function createReservation(
  input: Partial<PmsReservation> & {
    property_id: string;
    check_in: string;
    check_out: string;
  },
  lines: Array<Partial<PmsReservationRoom> & { room_type_id: string; rate_plan_id: string; nightly_rate: number; nb_nights: number; line_total: number }>,
): Promise<PmsReservation> {
  const client = ensureClient();
  const number = input.reservation_number ?? (await nextReservationNumber(input.property_id));
  const { data, error } = await client
    .from("pms_reservations")
    .insert({ ...input, reservation_number: number })
    .select("*")
    .single();
  if (error) throw error;
  const reservation = data as PmsReservation;
  if (lines.length > 0) {
    const { error: lineErr } = await client
      .from("pms_reservation_rooms")
      .insert(lines.map((l) => ({ ...l, reservation_id: reservation.id })));
    if (lineErr) throw lineErr;
  }
  return reservation;
}

export async function updateReservation(id: string, patch: Partial<PmsReservation>): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("pms_reservations").update(patch).eq("id", id);
  if (error) throw error;
}

export async function cancelReservation(id: string, reason?: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client
    .from("pms_reservations")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

export async function checkInReservation(id: string, roomAssignments: Array<{ lineId: string; roomId: string }> = []): Promise<void> {
  const client = ensureClient();
  const now = new Date().toISOString();
  const { error } = await client
    .from("pms_reservations")
    .update({ status: "checked_in", checked_in_at: now })
    .eq("id", id);
  if (error) throw error;
  for (const a of roomAssignments) {
    await client.from("pms_reservation_rooms").update({ room_id: a.roomId }).eq("id", a.lineId);
    await client.from("pms_rooms").update({ status: "occupied" }).eq("id", a.roomId);
  }
}

export async function checkOutReservation(id: string): Promise<void> {
  const client = ensureClient();
  const now = new Date().toISOString();
  const { data: lines } = await client
    .from("pms_reservation_rooms")
    .select("room_id")
    .eq("reservation_id", id);
  const { error } = await client
    .from("pms_reservations")
    .update({ status: "checked_out", checked_out_at: now })
    .eq("id", id);
  if (error) throw error;
  const roomIds = (lines ?? []).map((l) => (l as { room_id: string | null }).room_id).filter(Boolean) as string[];
  for (const rid of roomIds) {
    await client.from("pms_rooms").update({ status: "dirty" }).eq("id", rid);
  }
}

export async function listReservationLines(reservationId: string): Promise<PmsReservationRoom[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_reservation_rooms")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("created_at");
  if (error) return [];
  return (data ?? []) as PmsReservationRoom[];
}

export async function listPayments(reservationId: string): Promise<PmsPayment[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase
    .from("pms_payments")
    .select("*")
    .eq("reservation_id", reservationId)
    .order("paid_at", { ascending: false });
  if (error) return [];
  return (data ?? []) as PmsPayment[];
}

export async function recordPayment(args: {
  reservationId: string;
  amount: number;
  method: PmsPaymentMethod;
  reference?: string;
  notes?: string;
}): Promise<PmsPayment> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  const { data, error } = await client
    .from("pms_payments")
    .insert({
      reservation_id: args.reservationId,
      amount: args.amount,
      method: args.method,
      reference: args.reference ?? null,
      notes: args.notes ?? null,
      recorded_by: user?.id ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as PmsPayment;
}

export async function fetchAvailability(
  propertyId: string,
  fromDate: string,
  toDate: string,
): Promise<PmsAvailabilityRow[]> {
  if (!isSupabaseConfigured || !supabase) return [];
  const { data, error } = await supabase.rpc("pms_availability", {
    p_property_id: propertyId,
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) return [];
  return (data ?? []) as PmsAvailabilityRow[];
}

/**
 * Calcule, pour une période [checkIn, checkOut[ et un room_type_id donné,
 * le max d'occupation concurrente parmi les réservations présentes.
 * Utilisé pour validation : si max >= total_rooms_of_type, dispo = 0.
 */
export function peakConcurrentOccupancy(
  reservations: Array<Pick<PmsReservation, "check_in" | "check_out" | "status">>,
  checkIn: string,
  checkOut: string,
): number {
  const events: Array<[string, number]> = [];
  for (const r of reservations) {
    if (!["confirmed", "checked_in"].includes(r.status)) continue;
    const overlapStart = r.check_in > checkIn ? r.check_in : checkIn;
    const overlapEnd = r.check_out < checkOut ? r.check_out : checkOut;
    if (overlapStart < overlapEnd) {
      events.push([overlapStart, 1]);
      events.push([overlapEnd, -1]);
    }
  }
  events.sort((a, b) => a[0].localeCompare(b[0]));
  let peak = 0;
  let cur = 0;
  for (const [, delta] of events) {
    cur += delta;
    if (cur > peak) peak = cur;
  }
  return peak;
}
