import { describe, it, expect, beforeEach, vi } from "vitest";
import { getLocalePrefix, localePath, localizePath, switchLocalePath } from "../locale-path";

function mockPathname(pathname: string) {
  vi.stubGlobal("window", { location: { pathname } });
}

describe("getLocalePrefix", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns empty string on French (no prefix)", () => {
    mockPathname("/estimation");
    expect(getLocalePrefix()).toBe("");
  });

  it("returns empty string on home /", () => {
    mockPathname("/");
    expect(getLocalePrefix()).toBe("");
  });

  it("returns /en for English pages", () => {
    mockPathname("/en/estimation");
    expect(getLocalePrefix()).toBe("/en");
  });

  it("returns /de for German pages", () => {
    mockPathname("/de/valorisation");
    expect(getLocalePrefix()).toBe("/de");
  });

  it("returns /pt for Portuguese pages", () => {
    mockPathname("/pt/frais-acquisition");
    expect(getLocalePrefix()).toBe("/pt");
  });

  it("returns /lb for Luxembourgish pages", () => {
    mockPathname("/lb/energy/impact");
    expect(getLocalePrefix()).toBe("/lb");
  });

  it("detects locale on home pages /en, /de etc.", () => {
    mockPathname("/en");
    expect(getLocalePrefix()).toBe("/en");
    mockPathname("/lb");
    expect(getLocalePrefix()).toBe("/lb");
  });

  it("returns empty string for SSR context (no window)", () => {
    vi.unstubAllGlobals();
    // @ts-expect-error — simulation SSR
    globalThis.window = undefined;
    expect(getLocalePrefix()).toBe("");
  });

  it("does not match partial words like /enfants/", () => {
    mockPathname("/enfants/hello");
    expect(getLocalePrefix()).toBe("");
  });
});

describe("localePath", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("French: returns path unchanged", () => {
    mockPathname("/estimation");
    expect(localePath("/valorisation")).toBe("/valorisation");
  });

  it("English: prefixes path with /en", () => {
    mockPathname("/en/estimation");
    expect(localePath("/valorisation")).toBe("/en/valorisation");
  });

  it("German: prefixes path with /de", () => {
    mockPathname("/de/home");
    expect(localePath("/energy/impact")).toBe("/de/energy/impact");
  });

  it("does not double-prefix already-prefixed paths", () => {
    mockPathname("/en/home");
    expect(localePath("/en/valorisation")).toBe("/en/valorisation");
  });

  it("handles root path /", () => {
    mockPathname("/en/home");
    expect(localePath("/")).toBe("/en/");
  });
});

describe("locale-aware URLs", () => {
  it.each(["fr", "en", "de", "pt", "lb"])("preserves encoded query and hash switching to %s", locale => {
    const suffix = "/estimation?c=Luxembourg&s=80&token=a%2Bb#resultats";
    expect(switchLocalePath("/en" + suffix, locale)).toBe((locale === "fr" ? "" : "/" + locale) + suffix);
  });
  it("preserves root-page query and fragment", () => {
    expect(switchLocalePath("/en?ref=abc#tools", "de")).toBe("/de?ref=abc#tools");
    expect(switchLocalePath("/en?ref=abc#tools", "fr")).toBe("/?ref=abc#tools");
  });
  it("matches complete locale segments, including the energy path", () => {
    expect(localizePath("/energy/impact", "en")).toBe("/en/energy/impact");
    expect(localizePath("/enfants", "en")).toBe("/en/enfants");
    expect(localizePath("/de/estimation", "en")).toBe("/de/estimation");
  });
  it.each(["https://example.com/foo", "//example.com/foo", "#result", "mailto:test@example.com", "/api/data?q=1", "/auth/callback", "/_next/static/test.js", "/download.pdf?x=1"])("does not localize endpoints or external targets: %s", href => {
    expect(localizePath(href, "en")).toBe(href);
  });
});
