import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { authenticateApiRequestAsync, logApiCall, type ApiKeyRecord } from "@/lib/api-auth";

// ============================================================
// AI EXTRACT — Extraction structurée depuis PDF/image (BYOK only)
// ============================================================
// Accepte PDF (Anthropic natif) ou image (OpenAI / Anthropic).
// Nécessite une clé BYOK OpenAI ou Anthropic (Groq ne fait pas de vision).
// Rate-limit : quota JWT 5/jour gratuit OU illimité BYOK OU tier API key.

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

const MAX_FILE_SIZE_MB = 8;

const EXTRACTION_SCHEMAS: Record<string, { instructions: string; schema: string }> = {
  bilan_promoteur: {
    instructions:
      "Extrait les données d'un bilan prévisionnel de promoteur immobilier luxembourgeois. Toutes les valeurs sont en EUR sauf indication contraire. Pour les pourcentages, retourne la valeur numérique (ex. 15 pour 15%, pas 0.15).",
    schema: `{
  "typeOperation": "immeuble" | "lotissement" | "maisons",
  "surfaceVendable": number (m²),
  "prixVenteM2": number (€/m²),
  "nbParkings": number,
  "prixParking": number (€),
  "surfaceTerrain": number (m²),
  "prixTerrainM2": number (€/m², 0 si mode compte à rebours),
  "coutTerrainConnu": boolean,
  "coutConstructionM2": number (€/m²),
  "surfaceBrute": number (m²),
  "voirie": number (€),
  "honorairesArchitecte": number (% de la construction),
  "honorairesBET": number (% de la construction),
  "etudesAutres": number (€),
  "fraisCommerciaux": number (% du CA),
  "fraisFinanciers": number (% des coûts),
  "assurances": number (% de la construction),
  "fraisGestion": number (% du CA),
  "aleas": number (% de la construction),
  "margePromoteur": number (% du CA),
  "tauxPreCommercialisation": number (% pré-vendu)
}`,
  },
  plus_values: {
    instructions:
      "Extrait les données d'un acte notarié ou d'une déclaration fiscale de plus-value immobilière luxembourgeoise.",
    schema: `{
  "modeAcquisition": "achat" | "succession" | "donation",
  "prixAcquisition": number (€),
  "anneeAcquisition": number (AAAA),
  "prixCession": number (€),
  "anneeCession": number (AAAA),
  "fraisAcquisition": number (€, 0 si forfaitaire 25%),
  "travauxDeductibles": number (€),
  "estResidencePrincipale": boolean,
  "estCouple": boolean
}`,
  },
  dpe: {
    instructions:
      "Extrait les données d'un certificat de performance énergétique (CPE/DPE) luxembourgeois ou européen.",
    schema: `{
  "classeEnergie": "A" | "B" | "C" | "D" | "E" | "F" | "G",
  "classeIsolation": "A" | "B" | "C" | "D" | "E" | "F" | "G",
  "consommationKwhM2An": number,
  "emissionsCo2KgM2An": number,
  "surface": number (m²),
  "anneeConstruction": number (AAAA),
  "typeChauffage": string
}`,
  },
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
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

function buildPrompt(schemaKey: string): string {
  const s = EXTRACTION_SCHEMAS[schemaKey];
  return (
    `${s.instructions}\n\n` +
    `Retourne STRICTEMENT un objet JSON valide suivant ce schéma. N'INVENTE PAS de valeurs : si un champ est absent du document, utilise null.\n\n` +
    `Schéma JSON attendu :\n${s.schema}\n\n` +
    `Réponds UNIQUEMENT avec le JSON, sans préambule, sans markdown, sans backticks.`
  );
}

async function callAnthropicVision(apiKey: string, fileBase64: string, mediaType: string, prompt: string) {
  const isPdf = mediaType === "application/pdf";
  const contentBlocks: unknown[] = isPdf
    ? [
        { type: "document", source: { type: "base64", media_type: "application/pdf", data: fileBase64 } },
        { type: "text", text: prompt },
      ]
    : [
        { type: "image", source: { type: "base64", media_type: mediaType, data: fileBase64 } },
        { type: "text", text: prompt },
      ];
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [{ role: "user", content: contentBlocks }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.content?.[0]?.text ?? "";
}

async function callOpenAIVision(apiKey: string, fileBase64: string, mediaType: string, prompt: string) {
  if (mediaType === "application/pdf") {
    throw new Error("OpenAI vision ne supporte pas les PDF directement — utilisez une image (JPG/PNG) ou une clé Anthropic.");
  }
  const dataUrl = `data:${mediaType};base64,${fileBase64}`;
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl } },
          ],
        },
      ],
      max_tokens: 2048,
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`OpenAI API ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
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

    let body: { schema?: string; fileBase64?: string; mediaType?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400, headers: CORS_HEADERS });
    }

    const { schema, fileBase64, mediaType } = body;
    if (!schema || !fileBase64 || !mediaType) {
      return NextResponse.json(
        { error: "Champs requis : schema, fileBase64, mediaType" },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (!EXTRACTION_SCHEMAS[schema]) {
      return NextResponse.json(
        { error: `Schema inconnu. Disponibles : ${Object.keys(EXTRACTION_SCHEMAS).join(", ")}` },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    const sizeBytes = Math.floor(fileBase64.length * 0.75);
    if (sizeBytes > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE_MB} MB)` },
        { status: 413, headers: CORS_HEADERS },
      );
    }

    const settings = await getAiSettings(auth.userId);
    if (!settings?.ai_api_key_encrypted) {
      return NextResponse.json(
        {
          error:
            "Extraction PDF nécessite une clé API BYOK OpenAI ou Anthropic (Groq ne supporte pas la vision). Configurez votre clé dans /profil.",
        },
        { status: 402, headers: CORS_HEADERS },
      );
    }

    const provider = settings.ai_provider;
    if (provider !== "openai" && provider !== "anthropic") {
      return NextResponse.json(
        { error: "Le provider BYOK configuré (Groq) ne supporte pas l'extraction vision. Utilisez OpenAI ou Anthropic." },
        { status: 400, headers: CORS_HEADERS },
      );
    }
    if (provider === "openai" && mediaType === "application/pdf") {
      return NextResponse.json(
        { error: "OpenAI ne supporte pas les PDF directement. Utilisez Anthropic BYOK pour les PDF, ou convertissez en image (JPG/PNG)." },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    const prompt = buildPrompt(schema);
    let rawText: string;
    try {
      rawText =
        provider === "anthropic"
          ? await callAnthropicVision(settings.ai_api_key_encrypted, fileBase64, mediaType, prompt)
          : await callOpenAIVision(settings.ai_api_key_encrypted, fileBase64, mediaType, prompt);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur API LLM";
      return NextResponse.json({ error: `Erreur fournisseur : ${message}` }, { status: 502, headers: CORS_HEADERS });
    }

    // Parse JSON from response
    let extracted: unknown = null;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("Pas de JSON détecté dans la réponse");
      extracted = JSON.parse(jsonMatch[0]);
    } catch (err) {
      return NextResponse.json(
        { error: `Parsing JSON échoué : ${err instanceof Error ? err.message : "inconnu"}`, rawText },
        { status: 502, headers: CORS_HEADERS },
      );
    }

    const response = NextResponse.json(
      { data: extracted, schema, provider, model: provider === "anthropic" ? "claude-sonnet-4-20250514" : "gpt-4o" },
      { status: 200, headers: CORS_HEADERS },
    );
    if (auth.keyRecord) {
      await logApiCall(auth.keyRecord, "/api/v1/ai/extract", 200, Date.now() - t0);
    }
    return response;
  } catch (err) {
    console.error("[AI Extract] Unexpected error:", err);
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500, headers: CORS_HEADERS });
  }
}
