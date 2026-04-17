import { supabase, isSupabaseConfigured } from "./supabase";

export type ApiWebhookEvent = "estimation.price_change" | "estimation.new" | "health.check";

export interface ApiWebhook {
  id: string;
  user_id: string;
  event_type: ApiWebhookEvent;
  url: string;
  secret: string;
  active: boolean;
  threshold_pct: number | null;
  created_at: string;
  last_triggered_at: string | null;
}

export interface ApiWebhookDelivery {
  id: number;
  webhook_id: string;
  event_type: ApiWebhookEvent;
  payload: Record<string, unknown>;
  status_code: number | null;
  response_body: string | null;
  delivered_at: string;
  duration_ms: number | null;
}

function ensureClient() {
  if (!isSupabaseConfigured || !supabase) throw new Error("Supabase n'est pas configuré.");
  return supabase;
}

export async function createWebhook(input: {
  event_type: ApiWebhookEvent;
  url: string;
  threshold_pct?: number;
}): Promise<ApiWebhook> {
  const client = ensureClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error("Connexion requise.");

  const { data, error } = await client
    .from("api_webhooks")
    .insert({
      user_id: user.id,
      event_type: input.event_type,
      url: input.url,
      threshold_pct: input.threshold_pct ?? 5,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ApiWebhook;
}

export async function listMyWebhooks(): Promise<ApiWebhook[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("api_webhooks")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ApiWebhook[];
}

export async function deleteWebhook(id: string): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("api_webhooks").delete().eq("id", id);
  if (error) throw error;
}

export async function toggleWebhookActive(id: string, active: boolean): Promise<void> {
  const client = ensureClient();
  const { error } = await client.from("api_webhooks").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function listRecentDeliveries(webhookId: string): Promise<ApiWebhookDelivery[]> {
  const client = ensureClient();
  const { data, error } = await client
    .from("api_webhook_deliveries")
    .select("*")
    .eq("webhook_id", webhookId)
    .order("delivered_at", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data ?? []) as ApiWebhookDelivery[];
}

/**
 * Déclenche un test de webhook via /api/v1/webhooks/test.
 * Renvoie le status_code et le temps de livraison.
 */
export async function triggerTestWebhook(webhookId: string): Promise<{ ok: boolean; status?: number; durationMs?: number; error?: string }> {
  const client = ensureClient();
  const { data: { session } } = await client.auth.getSession();
  const token = session?.access_token;
  if (!token) return { ok: false, error: "no_session" };

  const res = await fetch("/api/v1/webhooks/test", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ webhook_id: webhookId }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) return { ok: false, error: body.error ?? `HTTP ${res.status}` };
  return { ok: true, status: body.status, durationMs: body.durationMs };
}
