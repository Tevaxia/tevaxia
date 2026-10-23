import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const qa = vi.hoisted(() => ({ read: vi.fn(), save: vi.fn(), update: vi.fn(), event: vi.fn(), filters: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ from: (table: string) => {
  if (table === "agency_signature_events") return { insert: qa.event };
  let writing = false;
  const q = {
    select: () => q,
    eq: (key: string, value: unknown) => { qa.filters("eq", key, value); return q; },
    gt: (key: string, value: unknown) => { qa.filters("gt", key, value); return q; },
    update: (value: unknown) => { writing = true; qa.update(value); return q; },
    maybeSingle: () => writing ? qa.save() : qa.read(),
  }; return q;
} }) }));
import { POST } from "@/app/api/signatures/[token]/route";
import { hashDocument } from "../agency-signatures";
const context = { params: Promise.resolve({ token: "test-token" }) };
const submit = (body: unknown = { action: "sign", consent_text: "Test consent" }) => POST(new Request("https://tevaxia.lu/api/signatures/test-token", { method: "POST", body: JSON.stringify(body) }), context);
let request: Record<string, unknown>;
beforeEach(async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://qa.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only");
  vi.useFakeTimers(); vi.setSystemTime(new Date("2026-10-23T10:00:00Z"));
  vi.clearAllMocks();
  request = { id: "request-1", status: "sent", expires_at: "2026-10-24T10:00:00Z", document_body: "Test document", document_hash: await hashDocument("Test document") };
  qa.read.mockResolvedValue({ data: request, error: null });
  qa.save.mockResolvedValue({ data: { status: "signed", signed_at: "2026-10-23T10:00:00.000Z" }, error: null });
  qa.event.mockResolvedValue({ error: null });
});
afterEach(() => { vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("signature submission persistence and validity", () => {
  it("returns the persisted timestamp only after both writes succeed", async () => {
    const res = await submit();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, status: "signed", signed_at: "2026-10-23T10:00:00.000Z" });
    expect(qa.update).toHaveBeenCalledWith(expect.objectContaining({ signed_at: "2026-10-23T10:00:00.000Z" }));
    expect(qa.filters).toHaveBeenCalledWith("eq", "status", "sent");
    expect(qa.filters).toHaveBeenCalledWith("eq", "document_hash", request.document_hash);
    expect(qa.filters).toHaveBeenCalledWith("gt", "expires_at", "2026-10-23T10:00:00.000Z");
  });
  it.each(["sign", "decline"])("never reports success when %s update fails", async action => {
    qa.save.mockResolvedValue({ data: null, error: { message: "private database details" } });
    const res = await submit({ action, consent_text: "Test consent" });
    expect(res.status).toBe(503); expect(await res.text()).not.toContain("private database details");
    expect(qa.event).not.toHaveBeenCalled();
  });
  it.each(["sign", "decline"])("reports a partial %s record when the audit write fails", async action => {
    qa.save.mockResolvedValue({ data: { status: action === "sign" ? "signed" : "declined" }, error: null });
    qa.event.mockResolvedValue({ error: {} });
    const res = await submit({ action, consent_text: "Test consent" });
    expect(res.status).toBe(503);
    expect(await res.json()).toMatchObject({ audit_incomplete: true, status: action === "sign" ? "signed" : "declined" });
  });
  it("rejects an update lost to another action without appending a false event", async () => {
    qa.save.mockResolvedValue({ data: null, error: null });
    expect((await submit()).status).toBe(409); expect(qa.event).not.toHaveBeenCalled();
  });
  it.each(["2026-10-22T10:00:00Z", "2026-10-23T10:00:00Z", "invalid"])("rejects expiry %s before writing", async expires_at => {
    request.expires_at = expires_at;
    expect((await submit()).status).toBe(410); expect(qa.update).not.toHaveBeenCalled();
  });
  it.each(["signed", "declined", "draft", "cancelled"])("rejects inactive state %s", async status => {
    request.status = status; expect((await submit()).status).toBe(409); expect(qa.update).not.toHaveBeenCalled();
  });
  it("distinguishes an unavailable database from a nonexistent request", async () => {
    qa.read.mockResolvedValue({ data: null, error: {} }); expect((await submit()).status).toBe(503);
    qa.read.mockResolvedValue({ data: null, error: null }); expect((await submit()).status).toBe(404);
  });
  it("rejects changed content and empty consent", async () => {
    request.document_body = "Changed document";
    expect((await submit()).status).toBe(400);
    expect((await submit({ action: "sign", consent_text: "  " })).status).toBe(400);
    expect(qa.update).not.toHaveBeenCalled();
  });
  it.each([null, { action: "sign", consent_text: 42 }, { action: "sign", timezone: {} }, { action: "bad" }])("rejects invalid body %o", async body => {
    expect((await submit(body)).status).toBe(400); expect(qa.read).not.toHaveBeenCalled();
  });
  it("records a decline and waits for its audit event", async () => {
    qa.save.mockResolvedValue({ data: { status: "declined" }, error: null });
    const res = await submit({ action: "decline", declined_reason: "Test refusal" });
    expect(res.status).toBe(200); expect(await res.json()).toEqual({ ok: true, status: "declined" });
    expect(qa.event).toHaveBeenCalledWith(expect.objectContaining({ event_type: "declined" }));
  });
});
