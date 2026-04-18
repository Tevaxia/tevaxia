import type { PmsReservation } from "./types";

/**
 * Génère un flux iCal conforme RFC 5545 pour exporter les réservations
 * en tant qu'événements BLOCK (occupation) vers OTA/Airbnb/Booking.
 * Usage : channel manager lite (read-only calendar sync).
 */
export function reservationsToICal(args: {
  reservations: PmsReservation[];
  calendarName: string;
  propertyId: string;
  roomId?: string;
}): string {
  const { reservations, calendarName, propertyId, roomId } = args;
  const now = formatICalDate(new Date(), false);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//tevaxia.lu//PMS//FR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-CALDESC:Occupancy feed from tevaxia PMS (property ${propertyId}${roomId ? ` room ${roomId}` : ""})`,
  ];

  for (const r of reservations) {
    if (!["confirmed", "checked_in", "checked_out"].includes(r.status)) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:res-${r.id}@tevaxia.lu`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${r.check_in.replace(/-/g, "")}`,
      `DTEND;VALUE=DATE:${r.check_out.replace(/-/g, "")}`,
      `SUMMARY:${escapeText("Réservé — " + r.reservation_number)}`,
      `DESCRIPTION:${escapeText(
        `Adults: ${r.nb_adults} Children: ${r.nb_children} Status: ${r.status}`
      )}`,
      "STATUS:CONFIRMED",
      "TRANSP:OPAQUE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function formatICalDate(d: Date, dateOnly: boolean): string {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  if (dateOnly) return `${yyyy}${mm}${dd}`;
  const hh = String(d.getUTCHours()).padStart(2, "0");
  const mi = String(d.getUTCMinutes()).padStart(2, "0");
  const ss = String(d.getUTCSeconds()).padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${mi}${ss}Z`;
}

function escapeText(s: string): string {
  return s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}
