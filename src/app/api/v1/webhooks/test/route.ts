import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// POST /api/v1/webhooks/test
// Déclenche un test de webhook sur la base de l'user session (Bearer token).
// Envoie un payload signé HMAC-SHA256 à l'URL enregistrée.

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}

async function sign(secret: string, body: string): Promise<string> {
  const key = await globalThis.crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await globalThis.crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");
  if (!token) {
    return NextResponse.json({ error: "missing_token" }, { status: 401 });
  }

  const client = getServiceClient();
  if (!client) {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 503 });
  }

  const { data: userData, error: userErr } = await client.auth.getUser(token);
  if (userErr || !userData?.user) {
    return NextResponse.json({ error: "invalid_token" }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const webhookId: string | undefined = body?.webhook_id;
  if (!webhookId) {
    return NextResponse.json({ error: "missing_webhook_id" }, { status: 400 });
  }

  // Lookup webhook
  const { data: webhook, error: whErr } = await client
    .from("api_webhooks")
    .select("id, user_id, event_type, url, secret, active")
    .eq("id", webhookId)
    .eq("user_id", userData.user.id)
    .maybeSingle();
  if (whErr || !webhook) {
    return NextResponse.json({ error: "webhook_not_found" }, { status: 404 });
  }
  if (!webhook.active) {
    return NextResponse.json({ error: "webhook_inactive" }, { status: 400 });
  }

  // Build test payload
  const payload = {
    event: "health.check",
    webhook_id: webhook.id,
    timestamp: new Date().toISOString(),
    data: {
      message: "Test webhook delivery from tevaxia.lu",
      sample_estimation: {
        commune: "Luxembourg",
        surface: 75,
        classeEnergie: "C",
        valeurCentrale: 780000,
      },
    },
  };
  const payloadStr = JSON.stringify(payload);
  const signature = await sign(webhook.secret, payloadStr);

  const start = Date.now();
  let status = 0;
  let responseBody = "";
  let error: string | undefined;

  try {
    const res = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Tevaxia-Event": "health.check",
        "X-Tevaxia-Signature": `sha256=${signature}`,
        "User-Agent": "tevaxia-webhooks/1.0",
      },
      body: payloadStr,
      signal: AbortSignal.timeout(8000),
    });
    status = res.status;
    responseBody = (await res.text()).slice(0, 2000);
  } catch (e) {
    error = e instanceof Error ? e.message : "unknown_error";
  }

  const durationMs = Date.now() - start;

  // Log delivery
  await client.from("api_webhook_deliveries").insert({
    webhook_id: webhook.id,
    event_type: "health.check",
    payload,
    status_code: status || null,
    response_body: error ?? responseBody,
    duration_ms: durationMs,
  });

  if (status > 0) {
    await client.from("api_webhooks").update({ last_triggered_at: new Date().toISOString() }).eq("id", webhook.id);
  }

  if (error) {
    return NextResponse.json({ ok: false, error, durationMs }, { status: 200 });
  }
  return NextResponse.json({ ok: status >= 200 && status < 300, status, durationMs });
}
