import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { reservationsToICal } from "@/lib/pms/ical";
import type { PmsReservation } from "@/lib/pms/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pms/ical/[propertyId]?room=[roomId]&token=[token]
 *
 * Flux iCal RFC 5545 read-only pour synchro OTA (Booking/Airbnb/Expedia iCal import).
 *
 * Auth : deux modes
 *   1. Header Authorization Bearer <jwt Supabase> (usage interne)
 *   2. Param ?token=<share_token> (usage OTA — URL publique stable)
 *      Le token est la valeur brute du property_id + hash simple (non stocké en DB
 *      pour éviter d'exposer un secret — c'est OK car iCal ne contient que des
 *      blocs de dates, jamais de données client)
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ propertyId: string }> },
) {
  const { propertyId } = await params;
  const url = new URL(req.url);
  const roomId = url.searchParams.get("room") ?? undefined;
  const token = url.searchParams.get("token");

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  }

  let supabase;

  // Mode 1 : Bearer token
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (bearer) {
    supabase = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${bearer}` } },
    });
    const { data: authData } = await supabase.auth.getUser();
    if (!authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else if (token) {
    // Mode 2 : share token
    // Format attendu : base64url(propertyId + ":" + secret). On compare au secret calculé.
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      return NextResponse.json({ error: "Service key required for share-token mode" }, { status: 501 });
    }
    const expected = await buildShareToken(propertyId);
    if (token !== expected) return NextResponse.json({ error: "Invalid share token" }, { status: 403 });
    supabase = createClient(supabaseUrl, serviceKey);
  } else {
    return NextResponse.json({ error: "Unauthorized (no bearer, no token)" }, { status: 401 });
  }

  // Charge propriété (pour nom calendrier) + réservations actives
  const { data: prop } = await supabase
    .from("pms_properties")
    .select("id,name")
    .eq("id", propertyId)
    .maybeSingle();
  if (!prop) return NextResponse.json({ error: "Property not found" }, { status: 404 });

  let q = supabase
    .from("pms_reservations")
    .select("*")
    .eq("property_id", propertyId)
    .in("status", ["confirmed", "checked_in", "checked_out"])
    .gte("check_out", new Date().toISOString().slice(0, 10));

  if (roomId) {
    // Restreint aux réservations qui incluent cette chambre
    const { data: lines } = await supabase
      .from("pms_reservation_rooms")
      .select("reservation_id")
      .eq("room_id", roomId);
    const ids = (lines ?? []).map((l: { reservation_id: string }) => l.reservation_id);
    if (ids.length === 0) {
      return new NextResponse(
        reservationsToICal({ reservations: [], calendarName: prop.name, propertyId, roomId }),
        { headers: { "Content-Type": "text/calendar; charset=utf-8" } },
      );
    }
    q = q.in("id", ids);
  }

  const { data: reservations, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ical = reservationsToICal({
    reservations: (reservations ?? []) as PmsReservation[],
    calendarName: roomId ? `${prop.name} (room)` : prop.name,
    propertyId,
    roomId,
  });

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `inline; filename="${prop.name.replace(/[^a-zA-Z0-9]+/g, "-")}.ics"`,
      "Cache-Control": "public, max-age=300", // 5 min cache OTA-friendly
    },
  });
}

async function buildShareToken(propertyId: string): Promise<string> {
  const secret = process.env.PMS_ICAL_SHARE_SECRET ?? "tevaxia-pms-ical-v1";
  const data = new TextEncoder().encode(propertyId + ":" + secret);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", data);
  // base64url
  const b = Buffer.from(hash).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return b.slice(0, 24);
}
