import { describe, it, expect } from "vitest";
import {
  parseICal, filterFutureEvents, dedupeByUid, isActiveEvent,
} from "../pms/ical-parser";

const AIRBNB_SAMPLE = `BEGIN:VCALENDAR
PRODID:-//Airbnb Inc//Hosting Calendar 1.0//EN
VERSION:2.0
CALSCALE:GREGORIAN
BEGIN:VEVENT
DTEND;VALUE=DATE:20260425
DTSTART;VALUE=DATE:20260420
UID:abnb-abc123@airbnb.com
SUMMARY:Reserved
DESCRIPTION:Airbnb reservation for Doe Family (4 guests).
STATUS:CONFIRMED
END:VEVENT
BEGIN:VEVENT
DTEND;VALUE=DATE:20260510
DTSTART;VALUE=DATE:20260505
UID:abnb-def456@airbnb.com
SUMMARY:Reserved
END:VEVENT
END:VCALENDAR`;

const BOOKING_SAMPLE = `BEGIN:VCALENDAR
PRODID:-//Booking.com//Booking iCalendar 1.0//EN
VERSION:2.0
BEGIN:VEVENT
SUMMARY:CLOSED - Not available
DTSTART;VALUE=DATE:20260615
DTEND;VALUE=DATE:20260620
UID:booking-xyz789@booking.com
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

describe("parseICal — Airbnb sample", () => {
  it("extrait 2 événements", () => {
    const events = parseICal(AIRBNB_SAMPLE);
    expect(events).toHaveLength(2);
  });
  it("convertit DTSTART en format ISO", () => {
    const events = parseICal(AIRBNB_SAMPLE);
    expect(events[0].start).toBe("2026-04-20");
    expect(events[0].end).toBe("2026-04-25");
  });
  it("extrait UID et SUMMARY", () => {
    const events = parseICal(AIRBNB_SAMPLE);
    expect(events[0].uid).toBe("abnb-abc123@airbnb.com");
    expect(events[0].summary).toBe("Reserved");
    expect(events[0].description).toContain("Doe Family");
  });
  it("retourne status quand présent", () => {
    const events = parseICal(AIRBNB_SAMPLE);
    expect(events[0].status).toBe("CONFIRMED");
  });
});

describe("parseICal — Booking sample", () => {
  it("parse un événement Booking valide", () => {
    const events = parseICal(BOOKING_SAMPLE);
    expect(events).toHaveLength(1);
    expect(events[0].summary).toBe("CLOSED - Not available");
    expect(events[0].start).toBe("2026-06-15");
  });
});

describe("parseICal — cas limites", () => {
  it("retourne [] sur un contenu non-iCal", () => {
    expect(parseICal("")).toHaveLength(0);
    expect(parseICal("not ical content")).toHaveLength(0);
  });
  it("ignore les VEVENT sans UID", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
SUMMARY:No UID here
DTSTART;VALUE=DATE:20260101
DTEND;VALUE=DATE:20260102
END:VEVENT
END:VCALENDAR`;
    expect(parseICal(ics)).toHaveLength(0);
  });
  it("unfold les lignes continues (RFC 5545)", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:folded-1
SUMMARY:Line one
 continuation
DTSTART;VALUE=DATE:20260101
DTEND;VALUE=DATE:20260102
END:VEVENT
END:VCALENDAR`;
    const events = parseICal(ics);
    expect(events[0].summary).toBe("Line onecontinuation");
  });
  it("unescape \\\\n et \\\\,", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:esc-1
SUMMARY:Hello\\, world\\nLine 2
DTSTART;VALUE=DATE:20260101
DTEND;VALUE=DATE:20260102
END:VEVENT
END:VCALENDAR`;
    const events = parseICal(ics);
    expect(events[0].summary).toBe("Hello, world\nLine 2");
  });
});

describe("filterFutureEvents", () => {
  it("ne garde que les événements dont check_out est dans le futur", () => {
    const events = parseICal(AIRBNB_SAMPLE);
    const future = filterFutureEvents(events, "2026-04-24");
    expect(future).toHaveLength(2);
    const pastOnly = filterFutureEvents(events, "2026-05-20");
    expect(pastOnly).toHaveLength(0);
  });
});

describe("dedupeByUid", () => {
  it("garde le dernier événement par UID", () => {
    const ics = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:same-uid
DTSTART;VALUE=DATE:20260101
DTEND;VALUE=DATE:20260105
SUMMARY:First
END:VEVENT
BEGIN:VEVENT
UID:same-uid
DTSTART;VALUE=DATE:20260110
DTEND;VALUE=DATE:20260115
SUMMARY:Updated
END:VEVENT
END:VCALENDAR`;
    const events = parseICal(ics);
    const deduped = dedupeByUid(events);
    expect(deduped).toHaveLength(1);
    expect(deduped[0].summary).toBe("Updated");
    expect(deduped[0].start).toBe("2026-01-10");
  });
});

describe("isActiveEvent", () => {
  it("CONFIRMED → actif", () => {
    expect(isActiveEvent({ uid: "x", summary: "", description: null, start: "", end: "", status: "CONFIRMED" })).toBe(true);
  });
  it("CANCELLED → inactif", () => {
    expect(isActiveEvent({ uid: "x", summary: "", description: null, start: "", end: "", status: "CANCELLED" })).toBe(false);
  });
  it("null status → actif (défaut)", () => {
    expect(isActiveEvent({ uid: "x", summary: "", description: null, start: "", end: "", status: null })).toBe(true);
  });
  it("cancelled lowercase → inactif", () => {
    expect(isActiveEvent({ uid: "x", summary: "", description: null, start: "", end: "", status: "cancelled" })).toBe(false);
  });
});
