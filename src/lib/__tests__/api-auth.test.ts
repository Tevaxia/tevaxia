import { describe, it, expect, beforeEach } from "vitest";
import { authenticateApiRequest } from "@/lib/api-auth";

function mkRequest(headers: Record<string, string> = {}): Request {
  return new Request("https://api.tevaxia.lu/v1/estimation", {
    method: "POST",
    headers,
  });
}

describe("API auth", () => {
  beforeEach(() => {
    process.env.TEVAXIA_API_KEYS = "demo:test-key-abc:free,bgl:bgl-key-xyz:pro";
  });

  it("rejects requests with no key", async () => {
    const result = authenticateApiRequest(mkRequest());
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("rejects unknown keys", async () => {
    const result = authenticateApiRequest(mkRequest({ "X-API-Key": "wrong-key" }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.response.status).toBe(401);
    }
  });

  it("accepts valid X-API-Key header", () => {
    const result = authenticateApiRequest(mkRequest({ "X-API-Key": "test-key-abc" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.keyRecord.name).toBe("demo");
      expect(result.keyRecord.tier).toBe("free");
    }
  });

  it("accepts Bearer token in Authorization header", () => {
    const result = authenticateApiRequest(mkRequest({ Authorization: "Bearer bgl-key-xyz" }));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.keyRecord.tier).toBe("pro");
    }
  });

  it("rate-limits free tier after 10 requests/min", () => {
    process.env.TEVAXIA_API_KEYS = "burst:burst-key:free";
    let lastResult;
    for (let i = 0; i < 11; i++) {
      lastResult = authenticateApiRequest(mkRequest({ "X-API-Key": "burst-key" }));
    }
    expect(lastResult?.ok).toBe(false);
    if (lastResult && !lastResult.ok) {
      expect(lastResult.response.status).toBe(429);
    }
  });
});
