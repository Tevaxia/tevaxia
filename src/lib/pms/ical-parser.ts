/**
 * Parseur iCal RFC 5545 minimal — extrait les VEVENT d'un flux ICS.
 *
 * Conçu pour parser les flux des OTA (Airbnb, Booking, VRBO, HomeAway,
 * Expedia) qui n'utilisent que les propriétés standards. Pas de support
 * RRULE (pas utilisé par les OTA pour les blocs de disponibilité).
 *
 * Retourne les événements avec DTSTART / DTEND en dates ISO.
 */

export interface ICalEvent {
  uid: string;
  summary: string;
  description: string | null;
  start: string;  // YYYY-MM-DD
  end: string;    // YYYY-MM-DD (exclusif côté iCal)
  status: string | null; // CONFIRMED / TENTATIVE / CANCELLED
}

/**
 * Unfold lines per RFC 5545 : les lignes suivantes commençant par un
 * espace ou une tabulation sont la continuation de la précédente.
 */
function unfold(raw: string): string[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

/** Extrait la valeur d'une propriété ICS sans ses paramètres. */
function parseProperty(line: string): { key: string; params: Record<string, string>; value: string } {
  const colonIdx = line.indexOf(":");
  if (colonIdx < 0) return { key: "", params: {}, value: "" };
  const left = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);
  const semiIdx = left.indexOf(";");
  const key = semiIdx < 0 ? left : left.slice(0, semiIdx);
  const params: Record<string, string> = {};
  if (semiIdx >= 0) {
    const paramsStr = left.slice(semiIdx + 1);
    for (const p of paramsStr.split(";")) {
      const eq = p.indexOf("=");
      if (eq > 0) params[p.slice(0, eq).toUpperCase()] = p.slice(eq + 1);
    }
  }
  return { key: key.toUpperCase(), params, value };
}

/** Parse une date iCal (DATE ou DATE-TIME) vers ISO YYYY-MM-DD. */
function parseIcalDate(value: string): string | null {
  // DATE : YYYYMMDD
  const dm = value.match(/^(\d{4})(\d{2})(\d{2})/);
  if (!dm) return null;
  return `${dm[1]}-${dm[2]}-${dm[3]}`;
}

/** Unescape : \\ \, \; \n */
function unescape(s: string): string {
  return s.replace(/\\n/g, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");
}

export function parseICal(ics: string): ICalEvent[] {
  const lines = unfold(ics);
  const events: ICalEvent[] = [];
  let current: Partial<ICalEvent> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "BEGIN:VEVENT") {
      current = {};
      continue;
    }
    if (trimmed === "END:VEVENT") {
      if (current?.uid && current.start && current.end) {
        events.push({
          uid: current.uid,
          summary: current.summary ?? "",
          description: current.description ?? null,
          start: current.start,
          end: current.end,
          status: current.status ?? null,
        });
      }
      current = null;
      continue;
    }
    if (!current) continue;

    const { key, value } = parseProperty(line);
    switch (key) {
      case "UID":
        current.uid = value;
        break;
      case "SUMMARY":
        current.summary = unescape(value);
        break;
      case "DESCRIPTION":
        current.description = unescape(value);
        break;
      case "DTSTART":
        current.start = parseIcalDate(value) ?? current.start;
        break;
      case "DTEND":
        current.end = parseIcalDate(value) ?? current.end;
        break;
      case "STATUS":
        current.status = value;
        break;
    }
  }
  return events;
}

/**
 * Filtre pour ne garder que les événements futurs ou en cours
 * (pour éviter de créer des réservations historiques inutilement).
 */
export function filterFutureEvents(events: ICalEvent[], fromDate?: string): ICalEvent[] {
  const today = fromDate ?? new Date().toISOString().slice(0, 10);
  return events.filter((e) => e.end > today);
}

/**
 * Déduplication par UID (les OTA peuvent émettre plusieurs VEVENT
 * avec le même UID en cas de modification — on garde le dernier).
 */
export function dedupeByUid(events: ICalEvent[]): ICalEvent[] {
  const map = new Map<string, ICalEvent>();
  for (const e of events) map.set(e.uid, e);
  return Array.from(map.values());
}

/**
 * Un événement iCal représente-t-il une réservation active (non annulée) ?
 */
export function isActiveEvent(e: ICalEvent): boolean {
  if (!e.status) return true;
  return e.status.toUpperCase() !== "CANCELLED";
}
