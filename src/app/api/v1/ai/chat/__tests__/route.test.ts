import { describe, it, expect, beforeEach, vi } from "vitest";

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

import { OPTIONS, POST } from "@/app/api/v1/ai/chat/route";

function req(headers: Record<string, string> = {}, body?: unknown): Request {
  return new Request("https://tevaxia.lu/api/v1/ai/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

describe("POST /api/v1/ai/chat", () => {
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
    const res = await POST(req({}, { messages: [{ role: "user", content: "hi" }] }));
    expect(res.status).toBe(401);
  });

  it("400 when messages missing or empty", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {}));
    expect(res.status).toBe(400);
  });

  it("400 when last message is not user", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      messages: [
        { role: "user", content: "q" },
        { role: "assistant", content: "a" },
      ],
    }));
    expect(res.status).toBe(400);
  });

  it("400 when message role is invalid", async () => {
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      messages: [{ role: "system", content: "oops" }],
    }));
    expect(res.status).toBe(400);
  });

  it("400 when more than 20 messages", async () => {
    const many = Array.from({ length: 21 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `msg ${i}`,
    }));
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, { messages: many }));
    expect(res.status).toBe(400);
  });

  it("200 on happy path (mocked Cerebras)", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ choices: [{ message: { content: "Bonjour!" } }] }), { status: 200 }),
    );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      messages: [{ role: "user", content: "Bonjour" }],
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.text).toBe("Bonjour!");
    expect(json.provider).toBe("cerebras");
  });

  it("503 when no server AI key", async () => {
    delete process.env.CEREBRAS_API_KEY;
    delete process.env.GROQ_API_KEY;
    delete process.env.GEMINI_API_KEY;
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      messages: [{ role: "user", content: "hi" }],
    }));
    expect(res.status).toBe(503);
  });

  it("préfère Gemini et bascule sur le suivant en cas d'échec", async () => {
    process.env.GEMINI_API_KEY = "AIza-test";
    const fetchSpy = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response("quota", { status: 402 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ choices: [{ message: { content: "Repli" } }] }), { status: 200 }),
      );
    const res = await POST(req({ Authorization: "Bearer fake-jwt" }, {
      messages: [{ role: "user", content: "hi" }],
    }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.provider).toBe("cerebras");
    expect(fetchSpy).toHaveBeenNthCalledWith(1,
      "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
