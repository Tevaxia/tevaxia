import { createClient } from "@supabase/supabase-js";

// ============================================================
// CALENDAR FEED — .ics read-only subscription
// ============================================================
// URL: /api/calendar/{token}/feed.ics
// Pas d'auth (le token est le secret). Le user génère un token
// unique depuis /profil/calendrier et colle l'URL dans Google
// Calendar / Outlook / Apple Calendar comme un abonnement.
// Le serveur appelle la RPC SECURITY DEFINER crm_calendar_feed
// qui valide le token et retourne tasks + futures visites.
// ============================================================

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CalendarEvent = {
  uid: string;
  summary: string;
  description: string;
  starts_at: string;
  ends_at: string;
  url: string;
  status: string;
  category: string;
};

function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "");
}

function formatDate(iso: string): string {
  // ICS UTC format: YYYYMMDDTHHmmssZ
  return new Date(iso).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function foldLine(line: string): string {
  // RFC 5545: lines should be folded at 75 octets
  if (line.length <= 75) return line;
  const parts: string[] = [];
  let remaining = line;
  parts.push(remaining.slice(0, 75));
  remaining = remaining.slice(75);
  while (remaining.length > 0) {
    parts.push(" " + remaining.slice(0, 74));
    remaining = remaining.slice(74);
  }
  return parts.join("\r\n");
}

function buildIcs(events: CalendarEvent[]): string {
  const now = formatDate(new Date().toISOString());
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tevaxia//CRM//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:tevaxia CRM",
    "X-WR-TIMEZONE:Europe/Luxembourg",
    "X-WR-CALDESC:Tâches et visites planifiées dans votre CRM tevaxia",
    "REFRESH-INTERVAL;VALUE=DURATION:PT1H",
    "X-PUBLISHED-TTL:PT1H",
  ];

  for (const ev of events) {
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${escapeText(ev.uid)}@tevaxia.lu`);
    lines.push(`DTSTAMP:${now}`);
    lines.push(`DTSTART:${formatDate(ev.starts_at)}`);
    lines.push(`DTEND:${formatDate(ev.ends_at)}`);
    lines.push(foldLine(`SUMMARY:[${escapeText(ev.category)}] ${escapeText(ev.summary)}`));
    if (ev.description) {
      lines.push(foldLine(`DESCRIPTION:${escapeText(ev.description)}`));
    }
    if (ev.url) lines.push(foldLine(`URL:${ev.url}`));
    lines.push(`STATUS:${ev.status}`);
    lines.push(`CATEGORIES:${escapeText(ev.category)}`);
    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 16 || token.length > 128) {
    return new Response("Invalid token", { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return new Response("Service unavailable", { status: 503 });
  }

  const sb = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await sb.rpc("crm_calendar_feed", { p_token: token });

  if (error) {
    return new Response("Feed error", { status: 500 });
  }

  const events: CalendarEvent[] = (data as CalendarEvent[]) || [];
  const ics = buildIcs(events);

  return new Response(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="tevaxia.ics"',
      "Cache-Control": "private, max-age=300",
    },
  });
}
