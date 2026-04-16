import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

export interface ApiKeyRecord {
  id: string;
  name: string;
  key: string;
  tier: "free" | "pro" | "enterprise";
  source: "env" | "supabase";
  userId?: string | null;
}

export interface AuthSuccess {
  ok: true;
  keyRecord: ApiKeyRecord;
}

export interface AuthFailure {
  ok: false;
  response: NextResponse;
}

const TIER_LIMITS: Record<ApiKeyRecord["tier"], { perMinute: number; perDay: number }> = {
  free: { perMinute: 10, perDay: 200 },
  pro: { perMinute: 60, perDay: 5000 },
  enterprise: { perMinute: 600, perDay: 100000 },
};

// Clé sandbox publique pour la documentation API — rate-limitée comme
// un tier free (10/min, 200/j par IP). En lecture seule sur l'estimation.
const SANDBOX_KEY: ApiKeyRecord = {
  id: "sandbox:public",
  name: "sandbox-public",
  key: "tvx_sandbox_public_demo_key_read_only",
  tier: "free",
  source: "env",
};

function loadEnvKeys(): ApiKeyRecord[] {
  const raw = process.env.TEVAXIA_API_KEYS;
  const envKeys = raw
    ? raw
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .map((entry) => {
          const [name, key, tierRaw] = entry.split(":");
          const tier = (["free", "pro", "enterprise"].includes(tierRaw) ? tierRaw : "free") as ApiKeyRecord["tier"];
          return { id: `env:${name}`, name, key, tier, source: "env" as const };
        })
        .filter((r) => r.name && r.key)
    : [];
  return [...envKeys, SANDBOX_KEY];
}

interface BucketState {
  minuteCount: number;
  minuteWindowStart: number;
  dayCount: number;
  dayWindowStart: number;
}

const buckets = new Map<string, BucketState>();

function checkRateLimit(key: string, tier: ApiKeyRecord["tier"]): { allowed: boolean; retryAfter?: number; remaining?: number } {
  const limits = TIER_LIMITS[tier];
  const now = Date.now();
  const minuteMs = 60_000;
  const dayMs = 86_400_000;

  const state = buckets.get(key) ?? {
    minuteCount: 0,
    minuteWindowStart: now,
    dayCount: 0,
    dayWindowStart: now,
  };

  if (now - state.minuteWindowStart > minuteMs) {
    state.minuteCount = 0;
    state.minuteWindowStart = now;
  }
  if (now - state.dayWindowStart > dayMs) {
    state.dayCount = 0;
    state.dayWindowStart = now;
  }

  if (state.minuteCount >= limits.perMinute) {
    const retryAfter = Math.ceil((state.minuteWindowStart + minuteMs - now) / 1000);
    buckets.set(key, state);
    return { allowed: false, retryAfter };
  }
  if (state.dayCount >= limits.perDay) {
    const retryAfter = Math.ceil((state.dayWindowStart + dayMs - now) / 1000);
    buckets.set(key, state);
    return { allowed: false, retryAfter };
  }

  state.minuteCount += 1;
  state.dayCount += 1;
  buckets.set(key, state);
  return { allowed: true, remaining: limits.perDay - state.dayCount };
}

async function hashKey(plainKey: string): Promise<string> {
  const bytes = new TextEncoder().encode(plainKey);
  const hash = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function lookupSupabaseKey(plainKey: string): Promise<ApiKeyRecord | null> {
  const client = getServiceClient();
  if (!client) return null;
  const hash = await hashKey(plainKey);
  const { data, error } = await client
    .from("api_keys")
    .select("id, name, tier, active, user_id")
    .eq("key_hash", hash)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return {
    id: data.id,
    name: data.name,
    key: plainKey,
    tier: data.tier as ApiKeyRecord["tier"],
    source: "supabase",
    userId: (data as { user_id?: string }).user_id ?? null,
  };
}

export async function authenticateApiRequestAsync(request: Request): Promise<AuthSuccess | AuthFailure> {
  const apiKey =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Missing API key (use 'X-API-Key' or 'Authorization: Bearer ...' header)" },
        { status: 401, headers: API_CORS_HEADERS },
      ),
    };
  }

  // Try env first (fast), then Supabase
  let record = loadEnvKeys().find((r) => r.key === apiKey) ?? null;
  if (!record) {
    record = await lookupSupabaseKey(apiKey);
  }

  if (!record) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401, headers: API_CORS_HEADERS },
      ),
    };
  }

  const limit = checkRateLimit(apiKey, record.tier);
  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfterSeconds: limit.retryAfter },
        {
          status: 429,
          headers: {
            ...API_CORS_HEADERS,
            "Retry-After": String(limit.retryAfter ?? 60),
          },
        },
      ),
    };
  }

  return { ok: true, keyRecord: record };
}

// Backward-compat sync version (env-only) for tests and existing call sites.
export function authenticateApiRequest(request: Request): AuthSuccess | AuthFailure {
  const apiKey =
    request.headers.get("x-api-key") ??
    request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");

  if (!apiKey) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Missing API key (use 'X-API-Key' or 'Authorization: Bearer ...' header)" },
        { status: 401, headers: API_CORS_HEADERS },
      ),
    };
  }

  const record = loadEnvKeys().find((r) => r.key === apiKey);
  if (!record) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Invalid API key" },
        { status: 401, headers: API_CORS_HEADERS },
      ),
    };
  }

  const limit = checkRateLimit(apiKey, record.tier);
  if (!limit.allowed) {
    return {
      ok: false,
      response: NextResponse.json(
        { success: false, error: "Rate limit exceeded", retryAfterSeconds: limit.retryAfter },
        {
          status: 429,
          headers: {
            ...API_CORS_HEADERS,
            "Retry-After": String(limit.retryAfter ?? 60),
          },
        },
      ),
    };
  }

  return { ok: true, keyRecord: record };
}

export async function logApiCall(keyRecord: ApiKeyRecord, endpoint: string, statusCode: number, latencyMs: number): Promise<void> {
  if (keyRecord.source !== "supabase") return;
  const client = getServiceClient();
  if (!client) return;
  await client.from("api_calls").insert({
    api_key_id: keyRecord.id,
    endpoint,
    status_code: statusCode,
    latency_ms: latencyMs,
  });
  await client.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", keyRecord.id);
}

export function withCors(response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(API_CORS_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
