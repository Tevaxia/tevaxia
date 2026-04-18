import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseICal, filterFutureEvents, dedupeByUid, isActiveEvent } from "@/lib/pms/ical-parser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/pms/sync-calendar/[id]
 *
 * Synchronise les événements d'un calendrier externe (Airbnb, Booking, VRBO…)
 * vers les réservations PMS. One-way (iCal import).
 *
 * Workflow :
 *   1. Auth via Bearer token Supabase.
 *   2. Charge le calendrier + propriété (vérifie ownership).
 *   3. Fetch l'URL ICS côté serveur (contourne CORS client).
 *   4. Parse les VEVENT, filtre future + actifs.
 *   5. Upsert les réservations avec external_event_uid comme clé.
 *   6. Annule les réservations dont l'UID n'apparaît plus.
 *   7. Met à jour les stats du calendrier.
 *
 * Retourne { ok, imported, updated, deactivated }.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Supabase non configuré" }, { status: 501 });
  }

  // Auth Bearer
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!bearer) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${bearer}` } },
  });
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Charge le calendrier
  const { data: cal, error: calErr } = await supabase
    .from("pms_external_calendars")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (calErr || !cal) return NextResponse.json({ error: "Calendar not found" }, { status: 404 });

  // Fetch ICS côté serveur (contourne CORS + webcal:// → https://)
  const icsUrl = cal.ics_url.replace(/^webcal:\/\//i, "https://");
  let ics: string;
  try {
    const res = await fetch(icsUrl, {
      headers: { "User-Agent": "tevaxia-pms/1.0 (iCal sync)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      await supabase.from("pms_external_calendars").update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: "error",
        last_error: `HTTP ${res.status}`,
      }).eq("id", id);
      return NextResponse.json({ error: `Fetch failed : HTTP ${res.status}` }, { status: 502 });
    }
    ics = await res.text();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Fetch error";
    await supabase.from("pms_external_calendars").update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: "error",
      last_error: msg.slice(0, 500),
    }).eq("id", id);
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Parse
  const allEvents = parseICal(ics);
  const futureEvents = dedupeByUid(filterFutureEvents(allEvents)).filter(isActiveEvent);

  // Charge les réservations existantes liées à ce calendrier
  const { data: existing } = await supabase
    .from("pms_reservations")
    .select("id, external_event_uid, status, check_in, check_out")
    .eq("external_calendar_id", id);
  const existingByUid = new Map<string, { id: string; status: string; check_in: string; check_out: string }>();
  for (const r of (existing ?? []) as Array<{ id: string; external_event_uid: string | null; status: string; check_in: string; check_out: string }>) {
    if (r.external_event_uid) existingByUid.set(r.external_event_uid, r);
  }

  // Upsert events
  let imported = 0;
  let updated = 0;
  const seenUids = new Set<string>();
  for (const ev of futureEvents) {
    seenUids.add(ev.uid);
    const found = existingByUid.get(ev.uid);
    if (!found) {
      // Nouvelle réservation block
      const summary = ev.summary || `Block ${cal.source}`;
      const reservationNumber = `ICS-${id.slice(0, 6)}-${ev.uid.replace(/[^a-zA-Z0-9]+/g, "").slice(0, 16)}`;
      const { error: insErr } = await supabase
        .from("pms_reservations")
        .insert({
          property_id: cal.property_id,
          reservation_number: reservationNumber,
          status: "confirmed",
          source: "other",
          external_ref: ev.uid,
          external_calendar_id: id,
          external_event_uid: ev.uid,
          check_in: ev.start,
          check_out: ev.end,
          nb_adults: 1,
          nb_children: 0,
          total_amount: 0,
          amount_paid: 0,
          booker_name: summary.slice(0, 100),
          notes: `Bloc iCal ${cal.label}${ev.description ? "\n\n" + ev.description.slice(0, 500) : ""}`,
        });
      if (!insErr) imported++;
    } else if (found.check_in !== ev.start || found.check_out !== ev.end) {
      // Dates modifiées upstream
      await supabase
        .from("pms_reservations")
        .update({ check_in: ev.start, check_out: ev.end })
        .eq("id", found.id);
      updated++;
    }
  }

  // Deactivation : réservations avec UID qui n'existe plus côté source
  let deactivated = 0;
  for (const [uid, res] of existingByUid.entries()) {
    if (!seenUids.has(uid) && res.status === "confirmed") {
      await supabase
        .from("pms_reservations")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString(), cancellation_reason: "UID absent de la source iCal" })
        .eq("id", res.id);
      deactivated++;
    }
  }

  // Stats + last_sync
  await supabase
    .from("pms_external_calendars")
    .update({
      last_sync_at: new Date().toISOString(),
      last_sync_status: "ok",
      last_error: null,
      sync_count: (cal.sync_count as number) + 1,
      events_count: futureEvents.length,
    })
    .eq("id", id);

  return NextResponse.json({ ok: true, imported, updated, deactivated, total_events: futureEvents.length });
}
