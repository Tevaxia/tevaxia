import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { parseDemoRequest } from "@/lib/demo-request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
const MAX_BODY_BYTES = 8_000;

const reply = (body: Record<string, unknown>, status: number) => NextResponse.json(body, { status, headers });

/** Empreinte de l'adresse d'envoi, renouvelée chaque jour : elle sert à limiter
 * le nombre de demandes par expéditeur, pas à l'identifier. */
async function senderHash(req: Request): Promise<string | null> {
  const ip = (req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? "").split(",")[0].trim();
  if (!ip) return null;
  const day = new Date().toISOString().slice(0, 10);
  const digest = await globalThis.crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}|${day}`));
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
}

/** Un formulaire d'un autre site ne doit pas pouvoir poster ici. */
function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try { return new URL(origin).host === host; } catch { return false; }
}

/**
 * POST /api/demo-request
 *
 * Enregistre une demande de démonstration dans la table `demo_requests`
 * (migration 074). Aucun e-mail n'est envoyé : les demandes se lisent dans
 * Supabase. Si la table n'existe pas encore, la route répond 503 et le
 * formulaire propose d'écrire à l'adresse de contact.
 */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return reply({ error: "forbidden" }, 403);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return reply({ error: "too_large" }, 413);

  let body: unknown;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return reply({ error: "too_large" }, 413);
    body = JSON.parse(raw);
  } catch { return reply({ error: "invalid", field: "product" }, 400); }

  const parsed = parseDemoRequest(body);
  if (!parsed.ok) return reply({ error: "invalid", field: parsed.field }, 400);
  // Champ piège rempli : on répond comme si la demande était enregistrée.
  if (parsed.spam) return reply({ ok: true }, 201);

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return reply({ error: "unavailable" }, 503);

  const request = parsed.value;
  try {
    const supabase = createClient(url, serviceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
    });
    const { data, error } = await supabase.rpc("submit_demo_request", {
      p_product: request.product, p_name: request.name, p_company: request.company,
      p_email: request.email, p_phone: request.phone, p_size_hint: request.size,
      p_message: request.message, p_locale: request.locale, p_page: request.page,
      p_ip_hash: await senderHash(req),
    });
    if (error) {
      // Code de diagnostic seulement : ni coordonnées ni message de la base.
      const code = typeof error.code === "string" && /^[A-Z0-9_]{1,32}$/.test(error.code) ? error.code : "UNKNOWN";
      console.error("DEMO_REQUEST_UNAVAILABLE", code);
      return reply({ error: "unavailable" }, 503);
    }
    const result = data as { success?: unknown; error?: unknown } | null;
    if (result?.success === true) return reply({ ok: true }, 201);
    return result?.error === "rate_limited" ? reply({ error: "rate_limited" }, 429) : reply({ error: "unavailable" }, 503);
  } catch {
    console.error("DEMO_REQUEST_UNAVAILABLE", "NETWORK");
    return reply({ error: "unavailable" }, 503);
  }
}
