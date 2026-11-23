import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const rpc = vi.fn();
vi.mock("@supabase/supabase-js", () => ({ createClient: vi.fn(() => ({ rpc })) }));

import { POST } from "../route";

const valid = { product: "pms", name: "Marc Schmit", email: "marc@example.lu", size: "42 chambres", locale: "fr", page: "/solutions/hotel" };

function post(body: unknown, extra: Record<string, string> = {}) {
  return POST(new Request("https://tevaxia.lu/api/demo-request", {
    method: "POST",
    headers: { "content-type": "application/json", host: "tevaxia.lu", origin: "https://tevaxia.lu", "x-forwarded-for": "203.0.113.7, 10.0.0.1", ...extra },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }));
}

describe("POST /api/demo-request", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
    rpc.mockReset();
    rpc.mockResolvedValue({ data: { success: true }, error: null });
    vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); });

  it("stores a valid request with a hashed sender address", async () => {
    const res = await post(valid);
    expect(res.status).toBe(201);
    expect(res.headers.get("cache-control")).toBe("no-store");
    expect(rpc).toHaveBeenCalledTimes(1);
    const [name, args] = rpc.mock.calls[0];
    expect(name).toBe("submit_demo_request");
    expect(args).toMatchObject({ p_product: "pms", p_name: "Marc Schmit", p_email: "marc@example.lu", p_size_hint: "42 chambres", p_company: null, p_locale: "fr", p_page: "/solutions/hotel" });
    expect(args.p_ip_hash).toMatch(/^[a-f0-9]{64}$/);
    expect(JSON.stringify(args)).not.toContain("203.0.113.7");
  });

  it("rejects invalid input without calling the database", async () => {
    const res = await post({ ...valid, email: "marc" });
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "invalid", field: "email" });
    expect((await post("{not json")).status).toBe(400);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("answers a filled honeypot as a success and stores nothing", async () => {
    const res = await post({ ...valid, website: "https://spam.example" });
    expect(res.status).toBe(201);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses a request posted from another site", async () => {
    const res = await post(valid, { origin: "https://evil.example" });
    expect(res.status).toBe(403);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("refuses an oversized body", async () => {
    const res = await post({ ...valid, message: "x".repeat(9000) });
    expect(res.status).toBe(413);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("reports the rate limit", async () => {
    rpc.mockResolvedValue({ data: { success: false, error: "rate_limited" }, error: null });
    expect((await post(valid)).status).toBe(429);
  });

  it("answers 503 when the table is missing or the database fails, without leaking details", async () => {
    rpc.mockResolvedValue({ data: null, error: { code: "PGRST202", message: "Could not find the function public.submit_demo_request" } });
    const res = await post(valid);
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "unavailable" });
    expect(console.error).toHaveBeenCalledWith("DEMO_REQUEST_UNAVAILABLE", "PGRST202");
    rpc.mockRejectedValue(new Error("network"));
    expect((await post(valid)).status).toBe(503);
  });

  it("answers 503 when the server is not configured", async () => {
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    expect((await post(valid)).status).toBe(503);
    expect(rpc).not.toHaveBeenCalled();
  });
});
