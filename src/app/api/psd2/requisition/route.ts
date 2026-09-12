import { getAssuredUser } from "@/lib/mfa-assurance";
import { bankingStore } from "@/lib/banking-store";
import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { isConfigured, startAuth, createSession, getSession } from "@/lib/enable-banking";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

async function authUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await getAssuredUser(sb, token);
  return data?.user ?? null;
}

/**
 * POST /api/psd2/requisition
 * Body: { institutionId: string, country: string, redirect: string }
 * institutionId = nom ASPSP Enable Banking (ex "Spuerkeess")
 * Retourne { link } pour rediriger vers SCA bancaire.
 */
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Enable Banking not configured" }, { status: 501 });
  }
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as
    | { institutionId?: string; country?: string; redirect?: string }
    | null;
  if (!body?.institutionId || !body?.country || !body?.redirect) {
    return NextResponse.json({ error: "institutionId, country, redirect required" }, { status: 400 });
  }

  try {
    const validUntil = new Date(Date.now() + 180 * 86_400_000).toISOString(); // 180 j (max PSD2)
    const redirect = new URL(body.redirect);
    if (redirect.origin !== new URL(req.url).origin) return NextResponse.json({ error: "Invalid redirect" }, { status: 400 });
    const state = randomUUID();
    const { error: stateError } = await bankingStore().from("banking_auth_states").insert({ state, user_id: user.id });
    if (stateError) throw new Error("Banking authorization storage failed");
    const auth = await startAuth({
      aspsp: { name: body.institutionId, country: body.country },
      redirectUrl: body.redirect,
      validUntil,
      state,
      psuType: "personal",
    });
    return NextResponse.json({ id: auth.authorization_id, link: auth.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/**
 * GET /api/psd2/requisition?code=xxx → échange code oauth pour session
 * GET /api/psd2/requisition?id=session_xxx → récupère session existante
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Enable Banking not configured" }, { status: 501 });
  }
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const id = url.searchParams.get("id");
  if (!code && !id) return NextResponse.json({ error: "code or id required" }, { status: 400 });

  try {
    const store = bankingStore();
    if (code) {
      const state = url.searchParams.get("state");
      if (!state || !/^[0-9a-f-]{36}$/i.test(state)) return NextResponse.json({ error: "Invalid authorization state" }, { status: 403 });
      const { data: consumed, error } = await store.from("banking_auth_states").delete()
        .eq("state", state).eq("user_id", user.id).gt("expires_at", new Date().toISOString()).select("state");
      if (error || !consumed?.length) return NextResponse.json({ error: "Authorization expired or already used" }, { status: 403 });
    } else {
      const { data: owned, error } = await store.from("banking_connections").select("session_id")
        .eq("session_id", id!).eq("user_id", user.id).gt("valid_until", new Date().toISOString()).maybeSingle();
      if (error || !owned) return NextResponse.json({ error: "Session not owned by user" }, { status: 403 });
    }
    const session = code ? await createSession(code) : await getSession(id!);
    if (code) {
      const { error } = await store.from("banking_connections").insert({
        session_id: session.session_id, user_id: user.id,
        account_ids: session.accounts.map(a => a.uid), valid_until: session.access.valid_until,
      });
      if (error) throw new Error("Banking session ownership storage failed");
    }
    return NextResponse.json({
      id: session.session_id,
      accounts: session.accounts.map((a) => a.uid),
      accountsData: session.accounts_data ?? [],
      validUntil: session.access.valid_until,
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
