import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiRequestAsync, logApiCall, type ApiKeyRecord } from "@/lib/api-auth";

// ============================================================
// AI ANALYZE — Commentaire professionnel via LLM
// ============================================================
// Auth : Supabase JWT OU clé API (X-API-Key / Bearer).
// Rate-limit : 5/jour gratuit (compteur en DB), illimité BYOK.
// Providers : Groq (défaut gratuit), OpenAI, Anthropic (BYOK).

const SYSTEM_PROMPT =
  "Tu es un expert immobilier luxembourgeois certifié TEGOVA EVS 2025. " +
  "Tu analyses des résultats de calcul immobilier et fournis des commentaires professionnels, concis et factuels. " +
  "Cite les sources pertinentes (Observatoire de l'Habitat, STATEC, législation LU). " +
  "Réponds dans la langue de l'utilisateur.";

const FREE_DAILY_LIMIT = 5;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

// ── helpers ────────────────────────────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

interface AuthContext {
  userId: string;
  source: "jwt" | "apikey";
  keyRecord?: ApiKeyRecord;
}

/**
 * Resolve auth from either a Supabase JWT (interactive user) or an X-API-Key
 * / Bearer API key (B2B). API keys carry their own tier rate limit enforced
 * via authenticateApiRequestAsync, so JWT users still fall through the
 * per-day AI quota while API-key users are gated by tier limits.
 */
async function resolveAuth(request: Request): Promise<AuthContext | null> {
  const authHeader = request.headers.get("authorization");
  const apiKeyHeader = request.headers.get("x-api-key");

  if (apiKeyHeader || (authHeader && /^tvx_/i.test(authHeader.replace(/^Bearer\s+/i, "")))) {
    const result = await authenticateApiRequestAsync(request);
    if (!result.ok) return null;
    if (!result.keyRecord.userId) return null;
    return { userId: result.keyRecord.userId, source: "apikey", keyRecord: result.keyRecord };
  }

  if (!authHeader) return null;
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const { createClient: createServerClient } = await import("@supabase/supabase-js");
  const supabase = createServerClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  return { userId: user.id, source: "jwt" };
}

interface AiSettings {
  ai_provider: "gemini" | "cerebras" | "groq" | "openai" | "anthropic";
  ai_api_key_encrypted: string | null;
  daily_usage: number;
  last_usage_date: string;
}

async function getAiSettings(userId: string): Promise<AiSettings | null> {
  const client = getServiceClient();
  if (!client) return null;
  const { data } = await client
    .from("user_ai_settings")
    .select("ai_provider, ai_api_key_encrypted, daily_usage, last_usage_date")
    .eq("user_id", userId)
    .maybeSingle();
  return data as AiSettings | null;
}

async function incrementUsage(userId: string, settings: AiSettings | null): Promise<void> {
  const client = getServiceClient();
  if (!client) return;
  const today = new Date().toISOString().slice(0, 10);
  const isNewDay = !settings || settings.last_usage_date !== today;
  const newUsage = isNewDay ? 1 : (settings?.daily_usage ?? 0) + 1;

  await client.from("user_ai_settings").upsert({
    user_id: userId,
    ai_provider: settings?.ai_provider ?? "gemini",
    ai_api_key_encrypted: settings?.ai_api_key_encrypted ?? null,
    daily_usage: newUsage,
    last_usage_date: today,
  });
}

function getRemainingQuota(settings: AiSettings | null): number {
  if (!settings) return FREE_DAILY_LIMIT;
  const today = new Date().toISOString().slice(0, 10);
  if (settings.last_usage_date !== today) return FREE_DAILY_LIMIT;
  return Math.max(0, FREE_DAILY_LIMIT - settings.daily_usage);
}

// ── LLM call adapters ──────────────────────────────────────
// Gemini 3.x prélève son budget de raisonnement SUR max_tokens, sans le compter
// dans completion_tokens. Mesuré sur gemini-3.6-flash : avec max_tokens=800, le
// raisonnement consomme ~770 tokens et il ne reste que 27 tokens de réponse —
// tronquée (finish_reason "length"). D'où la marge et l'effort abaissé.
// `reasoning_effort: "none"` n'est pas accepté par l'API (400 INVALID_ARGUMENT).
const GEMINI_OVERRIDES = { max_tokens: 3000, reasoning_effort: "low" };

async function callOpenAICompatible(endpoint: string, apiKey: string, model: string, context: string, prompt: string, overrides: Record<string, unknown> = {}) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Contexte:\n${context}\n\nQuestion:\n${prompt}` },
      ],
      temperature: 0.3,
      max_tokens: 1024,
      ...overrides,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`LLM API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const callCerebras = (apiKey: string, model: string, context: string, prompt: string) =>
  callOpenAICompatible("https://api.cerebras.ai/v1/chat/completions", apiKey, model, context, prompt);
const callGroq = (apiKey: string, model: string, context: string, prompt: string) =>
  callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", apiKey, model, context, prompt);
// Gemini expose un endpoint OpenAI-compatible : même helper, autre base URL.
const callGemini = (apiKey: string, model: string, context: string, prompt: string) =>
  callOpenAICompatible(
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    apiKey, model, context, prompt, GEMINI_OVERRIDES,
  );

async function callOpenAI(apiKey: string, model: string, context: string, prompt: string) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Contexte:\n${context}\n\nQuestion:\n${prompt}` },
      ],
      temperature: 0.3,
      max_tokens: 1024,
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`OpenAI API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, model: string, context: string, prompt: string) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        { role: "user", content: `Contexte:\n${context}\n\nQuestion:\n${prompt}` },
      ],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Anthropic API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

function callProvider(provider: string, apiKey: string, model: string, context: string, prompt: string) {
  switch (provider) {
    case "openai": return callOpenAI(apiKey, model, context, prompt);
    case "anthropic": return callAnthropic(apiKey, model, context, prompt);
    case "groq": return callGroq(apiKey, model, context, prompt);
    case "cerebras": return callCerebras(apiKey, model, context, prompt);
    default: return callGemini(apiKey, model, context, prompt);
  }
}

// Tier gratuit : chaîne de repli, essayée dans l'ordre. Gemini d'abord (seul
// tier réellement gratuit, sans carte bancaire) ; les suivants ne sont tentés
// que si leur clé serveur est configurée. Ajouter un fournisseur = une ligne.
const FREE_TIER_CHAIN: { provider: string; env: string }[] = [
  { provider: "gemini", env: "GEMINI_API_KEY" },
  { provider: "groq", env: "GROQ_API_KEY" },
  { provider: "cerebras", env: "CEREBRAS_API_KEY" },
];

function resolveFreeTierChain(): { provider: string; apiKey: string }[] {
  return FREE_TIER_CHAIN
    .map((c) => ({ provider: c.provider, apiKey: process.env[c.env] }))
    .filter((c): c is { provider: string; apiKey: string } => !!c.apiKey);
}

// Modèle Gemini pilotable par variable d'env : Google ferme les anciens modèles
// aux nouveaux comptes (gemini-2.5-flash renvoie déjà 404 « no longer available
// to new users »). Une rotation se règle alors sur Vercel, sans redéploiement.
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-3.6-flash";

const DEFAULT_MODELS: Record<string, string> = {
  gemini: GEMINI_MODEL,
  cerebras: "gpt-oss-120b",
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-5",
};

// ── Route handlers ─────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    // ── Auth ──
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentification requise. JWT Supabase OU X-API-Key (voir /api-docs)." },
        { status: 401, headers: CORS_HEADERS },
      );
    }
    const userId = auth.userId;

    // ── Parse body ──
    let body: { context?: string; prompt?: string; provider?: string; model?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Corps JSON invalide" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const { context, prompt } = body;
    if (!context || !prompt) {
      return NextResponse.json(
        { error: "Champs requis : context, prompt" },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    // ── Determine provider + key ──
    const settings = await getAiSettings(userId);
    const hasByok = !!settings?.ai_api_key_encrypted;

    let provider = (body.provider ?? settings?.ai_provider ?? "gemini") as string;
    let apiKey: string | null = null;
    const freeChain = hasByok ? [] : resolveFreeTierChain();

    if (hasByok && settings?.ai_api_key_encrypted) {
      // BYOK: use stored key (stored as plain text in this v1 — encryption note below)
      apiKey = settings.ai_api_key_encrypted;
      provider = settings.ai_provider;
    } else if (freeChain.length > 0) {
      // Tier gratuit : premier fournisseur disponible de la chaîne (Gemini par défaut)
      provider = freeChain[0].provider;
      apiKey = freeChain[0].apiKey;
    } else {
      return NextResponse.json(
        { error: "Service IA temporairement indisponible (clé serveur non configurée)" },
        { status: 503, headers: CORS_HEADERS },
      );
    }

    // ── Rate limit (JWT free tier only — API keys already rate-limited by tier) ──
    if (!hasByok && auth.source === "jwt") {
      const remaining = getRemainingQuota(settings);
      if (remaining <= 0) {
        return NextResponse.json(
          {
            error: "Quota quotidien atteint (5 analyses/jour). Ajoutez votre propre clé API dans votre profil pour un usage illimité.",
            remaining: 0,
          },
          { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "86400" } },
        );
      }
    }

    // ── Call LLM ──
    let model = body.model ?? DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.gemini;
    let text: string | null = null;
    let lastError: unknown = null;

    if (hasByok) {
      try {
        text = await callProvider(provider, apiKey!, model, context, prompt);
      } catch (err) {
        lastError = err;
      }
    } else {
      // Tier gratuit : on parcourt la chaîne jusqu'à ce qu'un fournisseur réponde
      // (compte suspendu, quota épuisé, modèle retiré du catalogue…). Le modèle
      // demandé explicitement ne vaut que pour la première tentative : les replis
      // utilisent le modèle par défaut de LEUR fournisseur.
      for (const [i, candidate] of freeChain.entries()) {
        try {
          model = (i === 0 ? body.model : undefined) ?? DEFAULT_MODELS[candidate.provider] ?? model;
          text = await callProvider(candidate.provider, candidate.apiKey, model, context, prompt);
          provider = candidate.provider;
          lastError = null;
          break;
        } catch (err) {
          lastError = err;
        }
      }
    }

    if (text === null) {
      const message = lastError instanceof Error ? lastError.message : "Erreur API LLM";
      return NextResponse.json(
        { error: `Erreur du fournisseur IA : ${message}` },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    // ── Increment usage (JWT free tier) ──
    if (!hasByok && auth.source === "jwt") {
      await incrementUsage(userId, settings);
    }

    const remaining = hasByok || auth.source === "apikey"
      ? -1
      : getRemainingQuota(settings) - 1;

    const response = NextResponse.json(
      { text, model, provider, remaining },
      { status: 200, headers: CORS_HEADERS },
    );
    if (auth.keyRecord) {
      await logApiCall(auth.keyRecord, "/api/v1/ai/analyze", 200, Date.now() - t0);
    }
    return response;
  } catch (err) {
    console.error("[AI Analyze] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
