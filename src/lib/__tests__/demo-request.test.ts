import { describe, expect, it } from "vitest";
import { DEMO_LIMITS, parseDemoRequest } from "@/lib/demo-request";

const valid = { product: "syndic", name: "Anne Weber", email: "Anne.Weber@Example.lu", locale: "de", page: "/de/solutions/syndic" };

describe("demo request validation", () => {
  it("accepts a minimal request and normalises it", () => {
    const result = parseDemoRequest({ ...valid, name: "  Anne   Weber ", company: "", phone: undefined });
    expect(result).toEqual({
      ok: true,
      spam: false,
      value: {
        product: "syndic", name: "Anne Weber", company: null, email: "anne.weber@example.lu",
        phone: null, size: null, message: null, locale: "de", page: "/de/solutions/syndic",
      },
    });
  });

  it("keeps line breaks in the message and strips control characters", () => {
    const result = parseDemoRequest({ ...valid, message: "Bonjour,\r\n\r\n\r\n\r\n24 lots\u0007 à Strassen." });
    expect(result.ok && result.value.message).toBe("Bonjour,\n\n24 lots à Strassen.");
  });

  it.each([
    ["product", { product: "erp" }],
    ["name", { name: "A" }],
    ["name", { name: "x".repeat(DEMO_LIMITS.name + 1) }],
    ["email", { email: "anne@example" }],
    ["email", { email: "anne weber@example.lu" }],
    ["email", { email: "<script>@example.lu" }],
    ["company", { company: "x".repeat(DEMO_LIMITS.company + 1) }],
    ["phone", { phone: "appelez-moi" }],
    ["size", { size: "x".repeat(DEMO_LIMITS.size + 1) }],
    ["message", { message: "x".repeat(DEMO_LIMITS.message + 1) }],
  ])("rejects an invalid %s", (field, patch) => {
    expect(parseDemoRequest({ ...valid, ...patch })).toEqual({ ok: false, field });
  });

  it("rejects a body that is not an object", () => {
    for (const body of [null, "syndic", 12, [valid]]) expect(parseDemoRequest(body).ok).toBe(false);
  });

  it("falls back to French and drops an unexpected page value", () => {
    const result = parseDemoRequest({ ...valid, locale: "es", page: "https://evil.example/?q=1" });
    expect(result.ok && [result.value.locale, result.value.page]).toEqual(["fr", null]);
  });

  it("accepts an international phone number", () => {
    const result = parseDemoRequest({ ...valid, phone: "+352 621 123 456" });
    expect(result.ok && result.value.phone).toBe("+352 621 123 456");
  });

  it("flags a filled honeypot as spam without rejecting it", () => {
    const result = parseDemoRequest({ ...valid, website: "https://spam.example" });
    expect(result.ok && result.spam).toBe(true);
  });
});
