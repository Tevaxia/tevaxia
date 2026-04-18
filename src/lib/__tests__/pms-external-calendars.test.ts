import { describe, it, expect } from "vitest";
import {
  iCalUrlValidation, detectSourceFromUrl, SOURCE_LABELS, SOURCE_COLORS,
} from "../pms/external-calendars";

describe("iCalUrlValidation", () => {
  it("accepte https://", () => {
    expect(iCalUrlValidation("https://www.airbnb.com/calendar/ical/123.ics")).toBeNull();
  });
  it("accepte webcal://", () => {
    expect(iCalUrlValidation("webcal://admin.booking.com/ical/abc")).toBeNull();
  });
  it("refuse protocole inconnu", () => {
    expect(iCalUrlValidation("ftp://foo")).not.toBeNull();
  });
  it("refuse vide", () => {
    expect(iCalUrlValidation("")).not.toBeNull();
    expect(iCalUrlValidation("   ")).not.toBeNull();
  });
  it("refuse URL trop longue", () => {
    const huge = "https://" + "x".repeat(2000);
    expect(iCalUrlValidation(huge)).not.toBeNull();
  });
});

describe("detectSourceFromUrl", () => {
  it("airbnb", () => {
    expect(detectSourceFromUrl("https://www.airbnb.com/calendar/ical/abc.ics")).toBe("airbnb");
  });
  it("booking", () => {
    expect(detectSourceFromUrl("https://admin.booking.com/hotel/calendar.ics")).toBe("booking");
  });
  it("vrbo / homeaway / expedia / agoda / tripadvisor", () => {
    expect(detectSourceFromUrl("https://vrbo.com/cal")).toBe("vrbo");
    expect(detectSourceFromUrl("https://homeaway.com/cal")).toBe("homeaway");
    expect(detectSourceFromUrl("https://expedia.com/cal")).toBe("expedia");
    expect(detectSourceFromUrl("https://agoda.com/cal")).toBe("agoda");
    expect(detectSourceFromUrl("https://tripadvisor.com/cal")).toBe("tripadvisor");
  });
  it("URL inconnue → custom_ics", () => {
    expect(detectSourceFromUrl("https://example.com/cal.ics")).toBe("custom_ics");
  });
  it("insensible à la casse", () => {
    expect(detectSourceFromUrl("HTTPS://AIRBNB.COM/cal")).toBe("airbnb");
  });
});

describe("SOURCE_LABELS & COLORS exhaustifs", () => {
  const keys = ["airbnb", "booking", "vrbo", "homeaway", "expedia", "agoda", "tripadvisor", "custom_ics"] as const;
  it("chaque source a un label et une couleur hex", () => {
    for (const k of keys) {
      expect(SOURCE_LABELS[k]).toBeDefined();
      expect(SOURCE_COLORS[k]).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });
});
