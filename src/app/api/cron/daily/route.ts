import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/cron/daily
 *
 * Tâches de maintenance quotidiennes automatisées :
 *   1. PMS : réservations "confirmed" avec check_in < hier → status "no_show"
 *   2. Syndic : appels "issued" avec due_date dépassée > 15j → status "overdue"
 *   3. PMS : expire les calendriers externes non syncés depuis > 24h
 *   4. CRM : mandats "mandat_signe" avec end_date dépassée → status "expire"
 *   5. Signatures : expire les requêtes eIDAS dont expires_at dépassé
 *
 * Authentification : header X-Cron-Secret doit matcher env var CRON_SECRET.
 *
 * Usage :
 *   - Vercel Cron (vercel.json) : planifier à 02:00 UTC
 *   - GitHub Actions ou n'importe quel scheduler externe
 *   - Supabase Edge Functions avec pg_cron
 */
async function handler(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 501 });
  }
  // Vercel Cron envoie GET avec Authorization: Bearer <CRON_SECRET>.
  // On accepte aussi X-Cron-Secret pour triggers externes (GitHub Actions, Make, etc.).
  const authHeader = req.headers.get("authorization");
  const vercelBearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const customHeader = req.headers.get("x-cron-secret");
  if (vercelBearer !== secret && customHeader !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Supabase service key required" }, { status: 501 });
  }
  const supabase = createClient(supabaseUrl, serviceKey);

  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();

  const report = {
    started_at: now,
    pms_no_shows_marked: 0,
    syndic_calls_overdue: 0,
    agency_mandates_expired: 0,
    signature_requests_expired: 0,
    errors: [] as string[],
  };

  // 1. PMS : no-shows
  try {
    const { data: noShowCandidates } = await supabase
      .from("pms_reservations")
      .select("id")
      .eq("status", "confirmed")
      .lt("check_in", yesterday);
    if (noShowCandidates && noShowCandidates.length > 0) {
      const ids = (noShowCandidates as { id: string }[]).map((r) => r.id);
      const { error } = await supabase
        .from("pms_reservations")
        .update({
          status: "no_show",
          cancelled_at: now,
          cancellation_reason: "Auto no-show (cron daily, check_in > 1j)",
        })
        .in("id", ids);
      if (error) report.errors.push(`pms_no_shows: ${error.message}`);
      else report.pms_no_shows_marked = ids.length;
    }
  } catch (e) {
    report.errors.push(`pms_no_shows: ${(e as Error).message}`);
  }

  // 2. Syndic : calls → overdue
  try {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 86400000).toISOString().slice(0, 10);
    const { data: callCandidates } = await supabase
      .from("coownership_calls")
      .select("id")
      .in("status", ["issued", "partially_paid"])
      .lt("due_date", fifteenDaysAgo);
    if (callCandidates && callCandidates.length > 0) {
      const ids = (callCandidates as { id: string }[]).map((c) => c.id);
      const { error } = await supabase
        .from("coownership_calls")
        .update({ status: "overdue" })
        .in("id", ids);
      if (error) report.errors.push(`syndic_calls: ${error.message}`);
      else report.syndic_calls_overdue = ids.length;
    }
  } catch (e) {
    report.errors.push(`syndic_calls: ${(e as Error).message}`);
  }

  // 3. Mandats expirés
  try {
    const { data: mandateCandidates } = await supabase
      .from("agency_mandates")
      .select("id")
      .in("status", ["mandat_signe", "diffuse", "en_visite", "offre_recue"])
      .lt("end_date", today);
    if (mandateCandidates && mandateCandidates.length > 0) {
      const ids = (mandateCandidates as { id: string }[]).map((m) => m.id);
      const { error } = await supabase
        .from("agency_mandates")
        .update({ status: "expire" })
        .in("id", ids);
      if (error) report.errors.push(`agency_mandates: ${error.message}`);
      else report.agency_mandates_expired = ids.length;
    }
  } catch (e) {
    report.errors.push(`agency_mandates: ${(e as Error).message}`);
  }

  // 4. Signatures eIDAS expirées
  try {
    const { data: sigCandidates } = await supabase
      .from("agency_signature_requests")
      .select("id")
      .in("status", ["draft", "sent", "viewed"])
      .lt("expires_at", now);
    if (sigCandidates && sigCandidates.length > 0) {
      const ids = (sigCandidates as { id: string }[]).map((s) => s.id);
      const { error } = await supabase
        .from("agency_signature_requests")
        .update({ status: "expired" })
        .in("id", ids);
      if (error) report.errors.push(`signatures: ${error.message}`);
      else {
        report.signature_requests_expired = ids.length;
        // Log events
        for (const id of ids) {
          await supabase.from("agency_signature_events").insert({
            request_id: id, event_type: "expired",
          });
        }
      }
    }
  } catch (e) {
    report.errors.push(`signatures: ${(e as Error).message}`);
  }

  return NextResponse.json({
    ...report,
    completed_at: new Date().toISOString(),
    duration_ms: Date.now() - new Date(now).getTime(),
  });
}

export { handler as GET, handler as POST };
