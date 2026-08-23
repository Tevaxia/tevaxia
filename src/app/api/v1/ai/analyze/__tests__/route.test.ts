import { describe, it, expect, beforeEach, vi } from "vitest";

// Mock @supabase/supabase-js so the route's auth path can resolve to a fake user.
// Factory must be self-contained (hoisted above imports).
vi.mock("@supabase/supabase-js", () => {
  const settings = {
    ai_provider: "cerebras",
    ai_api_key_encrypted: null,
    daily_usage: 0,
    last_usage_date: "2020-01-01",
  };
  const maybeSingle = vi.fn().mockResolvedValue({ data: settings });
  const eq = vi.fn().mockReturnValue({ maybeSingle });
  const select = vi.fn().mockReturnValue({ eq });
  const upsert = vi.fn().mockResolvedValue({ error: null });
  const fromFn = vi.fn().mockReturnValue({ select, upsert });
  const getUser = vi.fn().mockResolvedValue({ data: { user: { id: "user-123" } } });
  return {
    createClient: vi.fn().mockReturnValue({
      from: fromFn,
      auth: { getUser },
    }),
  };
});

import { OPTIONS, POST } from "@/app/api/v1/ai/analyze/route";

function req(headers: Record<string, string> = {}, body?: unknown): Request {
  return new Request("https://tevaxia.lu/api/v1/ai/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/v1/ai/analyze", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-key";
    process.env.CEREBRAS_API_KEY = "csk-test";
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    vi.restoreAllMocks();
  });

  it("OPTIONS returns 204 with CORS headers", async () => {
    const res = await OPTIONS();
    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
  });

  it("401 when no auth header", async () => {
    const res = await POST(req({}, { context: "x", prompt: "y" }));
    expect(res.status).toBe(401);
  });

  it("400 on invalid JSON body", async () => {
    const res = await POST(new Request("https://tevaxia.lu/api/v1/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer fake-jwt" },
      body: "{not valid",
    }));
    expect(res.status).toBe(400);
  });

  it("400 when context or prompt missing", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "only-context" }));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/context, prompt/i);
  });

  it("503 when no server AI key configured", async () => {
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "c", prompt: "p" }));
    expect(res.status).toBe(503);
  });

  it("préfère Gemini quand sa clé est configurée", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Réponse Gemini" } }] }), { status: 200 }),
    );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "c", prompt: "p" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.provider).toBe("gemini");
    expect(json.model).toBe("gemini-2.5-flash");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  // Régression : le repli existait mais restait inerte faute de clé configurée,
  // ce qui a transformé le 402 PayGo de Cerebras en panne du tier gratuit.
  it("bascule sur le fournisseur suivant quand le premier échoue", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("quota", { status: 402 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "Repli" } }] }), { status: 200 }),
      );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "c", prompt: "p" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe("Repli");
    expect(json.provider).toBe("cerebras");
    expect(json.model).toBe("gpt-oss-120b");
    expect(fetchSpy).toHaveBeenNthCalledWith(2,
      "https://api.cerebras.ai/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("502 seulement quand toute la chaîne échoue", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("quota", { status: 402 }));
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "c", prompt: "p" }));
    expect(res.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it("200 on happy path (mocked LLM)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Réponse IA" } }] }), { status: 200 }),
    );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "Commune: LU", prompt: "Analyse" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe("Réponse IA");
    expect(json.provider).toBe("cerebras");
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.cerebras.ai/v1/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("502 when LLM provider errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("rate limited", { status: 429 }),
    );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { context: "c", prompt: "p" }));
    expect(res.status).toBe(502);
  });
});
