import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiRequestAsync, logApiCall, type ApiKeyRecord } from "@/lib/api-auth";

// ============================================================
// AI CHAT — Assistant conversationnel multi-tour
// ============================================================
// Auth : Supabase JWT Bearer.
// Rate-limit : 5 messages/jour gratuit (compteur partagé avec /analyze),
//              illimité BYOK.
// Providers : Groq (défaut gratuit), OpenAI, Anthropic (BYOK).

const SYSTEM_PROMPT =
  "Tu es l'assistant immobilier tevaxia.lu, spécialisé sur le marché luxembourgeois. " +
  "Expertise : évaluation EVS 2025 / TEGOVA, fiscalité LIR (art. 102bis, 98bis, bail emphytéotique), " +
  "VEFA et droits d'enregistrement (Bëllegen Akt), copropriété (loi 16 mai 1975), AML/KYC (loi 12 novembre 2004), " +
  "hôtellerie USALI/HVS, promotion immobilière, marché locatif et vente LU. " +
  "Réponds de façon concise, factuelle, référencée. Cite les sources (Observatoire de l'Habitat, STATEC, Legilux). " +
  "Si une question sort de ton champ (médecine, droit pénal, etc.) décline poliment. " +
  "Réponds dans la langue de l'utilisateur (français par défaut).";

const FREE_DAILY_LIMIT = 5;
const MAX_MESSAGES = 20;
const MAX_CONTENT_LENGTH = 4000;

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

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

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) return null;
  return { userId: user.id, source: "jwt" };
}

interface AiSettings {
  ai_provider: "cerebras" | "groq" | "openai" | "anthropic";
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
    ai_provider: settings?.ai_provider ?? "cerebras",
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

const DEFAULT_MODELS: Record<string, string> = {
  cerebras: "llama-3.3-70b",
  groq: "llama-3.3-70b-versatile",
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-20250514",
};

async function callOpenAICompatible(endpoint: string, apiKey: string, model: string, messages: ChatMessage[]) {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  if (!res.ok) throw new Error(`LLM API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

const callCerebras = (apiKey: string, model: string, messages: ChatMessage[]) =>
  callOpenAICompatible("https://api.cerebras.ai/v1/chat/completions", apiKey, model, messages);
const callGroq = (apiKey: string, model: string, messages: ChatMessage[]) =>
  callOpenAICompatible("https://api.groq.com/openai/v1/chat/completions", apiKey, model, messages);

async function callOpenAI(apiKey: string, model: string, messages: ChatMessage[]) {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      temperature: 0.4,
      max_tokens: 800,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callAnthropic(apiKey: string, model: string, messages: ChatMessage[]) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 800,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request) {
  const t0 = Date.now();
  try {
    const auth = await resolveAuth(request);
    if (!auth) {
      return NextResponse.json(
        { error: "Authentification requise (JWT Supabase ou X-API-Key)." },
        { status: 401, headers: CORS_HEADERS },
      );
    }
    const userId = auth.userId;

    let body: { messages?: unknown };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400, headers: CORS_HEADERS });
    }

    if (!Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json({ error: "Champ 'messages' requis (array)" }, { status: 400, headers: CORS_HEADERS });
    }
    if (body.messages.length > MAX_MESSAGES) {
      return NextResponse.json({ error: `Max ${MAX_MESSAGES} messages par requête` }, { status: 400, headers: CORS_HEADERS });
    }

    const messages: ChatMessage[] = [];
    for (const m of body.messages) {
      if (
        !m || typeof m !== "object"
        || (m as ChatMessage).role !== "user" && (m as ChatMessage).role !== "assistant"
        || typeof (m as ChatMessage).content !== "string"
      ) {
        return NextResponse.json({ error: "Format message invalide" }, { status: 400, headers: CORS_HEADERS });
      }
      const content = (m as ChatMessage).content.slice(0, MAX_CONTENT_LENGTH);
      messages.push({ role: (m as ChatMessage).role, content });
    }

    if (messages[messages.length - 1].role !== "user") {
      return NextResponse.json({ error: "Le dernier message doit venir de l'utilisateur" }, { status: 400, headers: CORS_HEADERS });
    }

    const settings = await getAiSettings(userId);
    const hasByok = !!settings?.ai_api_key_encrypted;

    let provider: string;
    let apiKey: string | null = null;

    if (hasByok && settings?.ai_api_key_encrypted) {
      apiKey = settings.ai_api_key_encrypted;
      provider = settings.ai_provider;
    } else {
      const cerebrasKey = process.env.CEREBRAS_API_KEY;
      const groqKey = process.env.GROQ_API_KEY;
      if (cerebrasKey) {
        provider = "cerebras";
        apiKey = cerebrasKey;
      } else if (groqKey) {
        provider = "groq";
        apiKey = groqKey;
      } else {
        return NextResponse.json(
          { error: "Service IA temporairement indisponible (clé serveur non configurée)" },
          { status: 503, headers: CORS_HEADERS },
        );
      }
    }

    if (!hasByok && auth.source === "jwt") {
      const remaining = getRemainingQuota(settings);
      if (remaining <= 0) {
        return NextResponse.json(
          { error: "Quota quotidien atteint. Ajoutez votre clé API dans le profil pour un usage illimité.", remaining: 0 },
          { status: 429, headers: { ...CORS_HEADERS, "Retry-After": "86400" } },
        );
      }
    }

    const model = DEFAULT_MODELS[provider] ?? DEFAULT_MODELS.cerebras;
    let text: string;

    try {
      switch (provider) {
        case "openai": text = await callOpenAI(apiKey!, model, messages); break;
        case "anthropic": text = await callAnthropic(apiKey!, model, messages); break;
        case "groq": text = await callGroq(apiKey!, model, messages); break;
        default: text = await callCerebras(apiKey!, model, messages); provider = "cerebras"; break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur API LLM";
      return NextResponse.json({ error: `Erreur du fournisseur IA : ${message}` }, { status: 502, headers: CORS_HEADERS });
    }

    if (!hasByok && auth.source === "jwt") {
      await incrementUsage(userId, settings);
    }

    const remaining = hasByok || auth.source === "apikey"
      ? -1
      : getRemainingQuota(settings) - 1;

    const response = NextResponse.json({ text, model, provider, remaining }, { status: 200, headers: CORS_HEADERS });
    if (auth.keyRecord) {
      await logApiCall(auth.keyRecord, "/api/v1/ai/chat", 200, Date.now() - t0);
    }
    return response;
  } catch (err) {
    console.error("[AI Chat] Unexpected error:", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500, headers: CORS_HEADERS });
  }
}
