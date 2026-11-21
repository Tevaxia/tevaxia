import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import * as Sentry from "@sentry/nextjs";
import { MARKET_SNAPSHOT } from "@/lib/market-snapshot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;
const BATCH_LIMIT = 500;
const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Les prix communaux sont importés à la main. Ce contrôle compare la date du
 * jeu importé à celle du jeu officiel sur data.public.lu et signale un retard.
 * Il n'importe rien et n'échoue jamais : une source injoignable donne `null`. */
async function marketDataFreshness() {
  const imported = MARKET_SNAPSHOT.published;
  try {
    const res = await fetch("https://data.public.lu/api/1/datasets/prix-de-vente-des-appartements-par-commune/", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { imported, official: null, stale: null };
    const body = await res.json() as { last_update?: unknown; last_modified?: unknown };
    const raw = typeof body.last_update === "string" ? body.last_update : typeof body.last_modified === "string" ? body.last_modified : "";
    const official = /^\d{4}-\d{2}-\d{2}/.test(raw) ? raw.slice(0, 10) : null;
    return { imported, official, stale: official ? official > imported : null };
  } catch { return { imported, official: null, stale: null }; }
}

/** Scheduled operational status changes. Existing UTC grace periods are
 * workflow settings, not legal deadlines. Never invoke with real credentials
 * during QA: use an isolated database fixture.
 */
async function handler(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "Maintenance not configured" }, { status: 501, headers });
  const authorization = req.headers.get("authorization");
  const bearer = authorization?.startsWith("Bearer ") ? authorization.slice(7) : null;
  if (bearer !== secret && req.headers.get("x-cron-secret") !== secret) return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: "Maintenance not configured" }, { status: 501, headers });

  const started = Date.now(), now = new Date(started).toISOString();
  const dateBefore = (days: number) => new Date(started - days * 86400000).toISOString().slice(0, 10);
  const report = {
    started_at: now, pms_no_shows_marked: 0, syndic_calls_overdue: 0,
    agency_mandates_expired: 0, signature_requests_expired: 0, signature_events_recorded: 0,
    batch_limit_per_step: BATCH_LIMIT, limited_steps: [] as string[], errors: [] as string[],
  };
  const steps = [
    { table: "pms_reservations", statuses: ["confirmed"], dateColumn: "check_in", before: dateBefore(1), target: "no_show", counter: "pms_no_shows_marked", extra: { cancelled_at: now, cancellation_reason: "Auto no-show (cron daily, check_in > 1j)" } },
    { table: "coownership_calls", statuses: ["issued", "partially_paid"], dateColumn: "due_date", before: dateBefore(15), target: "overdue", counter: "syndic_calls_overdue" },
    { table: "agency_mandates", statuses: ["mandat_signe", "diffuse", "en_visite", "offre_recue"], dateColumn: "end_date", before: dateBefore(0), target: "expire", counter: "agency_mandates_expired" },
    { table: "agency_signature_requests", statuses: ["draft", "sent", "viewed"], dateColumn: "expires_at", before: now, target: "expired", counter: "signature_requests_expired" },
  ] as const;
  try {
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false }, global: { fetch: (input, init) => {
      const remaining = 45000 - (Date.now() - started);
      if (remaining <= 0) return Promise.reject(new Error("Maintenance request budget exhausted"));
      return fetch(input, { ...init, signal: AbortSignal.timeout(Math.min(10000, remaining)) });
    } } });
    for (const step of steps) {
      try {
        const { data: candidates, error: readError, count } = await supabase.from(step.table).select("id", { count: "exact" })
          .in("status", [...step.statuses]).lt(step.dateColumn, step.before).order("id").limit(BATCH_LIMIT + 1);
        if (readError) throw new Error("read_failed");
        if (!Array.isArray(candidates) || typeof count !== "number" || !Number.isInteger(count) || count < candidates.length || candidates.some(row => !row || typeof row.id !== "string" || !uuid.test(row.id)) || new Set(candidates.map(row => row.id)).size !== candidates.length) throw new Error("invalid_candidates");
        if (count > BATCH_LIMIT || count > candidates.length) report.limited_steps.push(step.table);
        const ids = candidates.slice(0, BATCH_LIMIT).map(row => row.id);
        if (!ids.length) continue;
        // Eligibility is checked again by the UPDATE itself, atomically. A paid,
        // checked-in, signed, cancelled or extended record must not be overwritten.
        const { data: changed, error: writeError } = await supabase.from(step.table)
          .update({ status: step.target, ...("extra" in step ? step.extra : {}) })
          .in("id", ids).in("status", [...step.statuses]).lt(step.dateColumn, step.before).select("id,status");
        if (writeError) throw new Error("update_not_confirmed");
        if (!Array.isArray(changed) || changed.some(row => !row || !ids.includes(row.id) || row.status !== step.target) || new Set(changed.map(row => row.id)).size !== changed.length) throw new Error("invalid_update_response");
        report[step.counter] = changed.length;
        if (step.table === "agency_signature_requests" && changed.length) {
          const changedIds = changed.map(row => row.id);
          // This second statement is not a transaction with the status update.
          // Report an event failure explicitly; never claim the audit log exists.
          const { data: events, error: eventError } = await supabase.from("agency_signature_events")
            .insert(changedIds.map(id => ({ request_id: id, event_type: "expired" }))).select("request_id,event_type");
          if (eventError || !Array.isArray(events) || events.length !== changedIds.length || events.some(event => !changedIds.includes(event.request_id) || event.event_type !== "expired") || new Set(events.map(event => event.request_id)).size !== events.length) throw new Error("events_not_confirmed");
          report.signature_events_recorded = events.length;
        }
      } catch (error) {
        const allowed = ["read_failed", "invalid_candidates", "update_not_confirmed", "invalid_update_response", "events_not_confirmed"];
        const reason = error instanceof Error && allowed.includes(error.message) ? error.message : "request_failed";
        report.errors.push(`${step.table}:${reason}`);
      }
    }
  } catch { report.errors.push("maintenance:initialization_failed"); }
  const market_data = await marketDataFreshness();
  if (market_data.stale) Sentry.captureMessage("Prix communaux : une publication officielle plus récente que le jeu importé est disponible", { level: "warning", extra: market_data });
  return NextResponse.json({ ...report, market_data, complete: report.errors.length === 0 && report.limited_steps.length === 0,
    completed_at: new Date().toISOString(), duration_ms: Date.now() - started,
  }, { status: report.errors.length ? 500 : 200, headers });
}
export { handler as GET, handler as POST };
