import { NextResponse } from "next/server";

export const API_CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
  "Access-Control-Max-Age": "86400",
};

export interface ApiKeyRecord {
  name: string;
  key: string;
  tier: "free" | "pro" | "enterprise";
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

function loadApiKeys(): ApiKeyRecord[] {
  const raw = process.env.TEVAXIA_API_KEYS;
  if (!raw) return [];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => {
      const [name, key, tierRaw] = entry.split(":");
      const tier = (["free", "pro", "enterprise"].includes(tierRaw) ? tierRaw : "free") as ApiKeyRecord["tier"];
      return { name, key, tier };
    })
    .filter((r) => r.name && r.key);
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

  const keys = loadApiKeys();
  const record = keys.find((r) => r.key === apiKey);
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

export function withCors(response: NextResponse): NextResponse {
  for (const [k, v] of Object.entries(API_CORS_HEADERS)) {
    response.headers.set(k, v);
  }
  return response;
}

export function corsPreflightResponse(): NextResponse {
  return new NextResponse(null, { status: 204, headers: API_CORS_HEADERS });
}
