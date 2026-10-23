import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { proxy } from "@/proxy";
import { COMMUNE_ALIASES, resolveCommuneRoute } from "../commune-routes";

describe("commune URLs", () => {
  it("resolves each retired name to an existing commune", () => {
    for (const [former, current] of Object.entries(COMMUNE_ALIASES)) {
      expect(resolveCommuneRoute(former)).toBe(current);
      expect(resolveCommuneRoute(current)).toBe(current);
    }
  });
  it.each(["", "inexistante-audit", "%ZZ", "%2Fetc"]) ("rejects unknown/malformed slug %s", slug => {
    expect(resolveCommuneRoute(slug)).toBeNull();
  });
  it.each(["", "/en", "/de", "/pt", "/lb"]) ("keeps locale %s and query on redirects", locale => {
    const response = proxy(new NextRequest(`https://tevaxia.lu${locale}/commune/bous?from=carte`));
    expect(response.status).toBe(301);
    expect(response.headers.get("location")).toBe(`https://tevaxia.lu${locale}/commune/bous-waldbredimus?from=carte`);
  });
  it("sets 404 before streaming unknown commune pages", () => {
    const response = proxy(new NextRequest("https://tevaxia.lu/en/commune/inexistante-audit"));
    expect(response.status).toBe(404);
    expect(response.headers.get("X-Robots-Tag")).toContain("noindex");
    expect(response.headers.get("x-middleware-rewrite")).toBe("https://tevaxia.lu/en/commune-introuvable");
  });
  it("keeps a valid canonical URL and injects its route for locale detection", () => {
    const response = proxy(new NextRequest("https://tevaxia.lu/pt/commune/luxembourg"));
    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-request-x-url")).toBe("/pt/commune/luxembourg");
  });
});
