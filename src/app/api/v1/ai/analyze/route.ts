import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

/** Extract user id from Supabase JWT or API key bearer token. */
async function resolveUserId(request: Request): Promise<string | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  // Try to validate as a Supabase JWT
  const { createClient: createServerClient } = await import("@supabase/supabase-js");
  const supabase = createServerClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id ?? null;
}

interface AiSettings {
  ai_provider: "groq" | "openai" | "anthropic";
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
    ai_provider: settings?.ai_provider ?? "groq",
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
async function callGroq(apiKey: string, model: string, context: string, prompt: string) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
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
    throw new Error(`Groq API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

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

const DEFAULT_MODELS: Record<string, string> = {
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
};

// ── Route handlers ─────────────────────────────────────────
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  try {
    // ── Auth ──
    const userId = await resolveUserId(request);
    if (!userId) {
      return NextResponse.json(
        { error: "Authentification requise. Connectez-vous ou utilisez un Bearer token." },
        { status: 401, headers: CORS_HEADERS },
      );
    }

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

    let provider = (body.provider ?? settings?.ai_provider ?? "groq") as string;
    let apiKey: string | null = null;

    if (hasByok && settings?.ai_api_key_encrypted) {
      // BYOK: use stored key (stored as plain text in this v1 — encryption note below)
      apiKey = settings.ai_api_key_encrypted;
      provider = settings.ai_provider;
    } else {
      // Free tier: server-side Groq key
      provider = "groq";
      apiKey = process.env.GROQ_API_KEY ?? null;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Service IA temporairement indisponible (clé serveur non configurée)" },
          { status: 503, headers: CORS_HEADERS },
        );
      }
    }

    // ── Rate limit (free tier only) ──
    if (!hasByok) {
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
    const model = body.model ?? DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.groq;
    let text: string;

    try {
      switch (provider) {
        case "openai":
          text = await callOpenAI(apiKey!, model, context, prompt);
          break;
        case "anthropic":
          text = await callAnthropic(apiKey!, model, context, prompt);
          break;
        default:
          text = await callGroq(apiKey!, model, context, prompt);
          provider = "groq";
          break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur API LLM";
      return NextResponse.json(
        { error: `Erreur du fournisseur IA : ${message}` },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    // ── Increment usage (free tier) ──
    if (!hasByok) {
      await incrementUsage(userId, settings);
    }

    const remaining = hasByok ? -1 : getRemainingQuota(settings) - 1;

    return NextResponse.json(
      { text, model, provider, remaining },
      { status: 200, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[AI Analyze] Unexpected error:", err);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
