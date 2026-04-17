import { NextResponse } from "next/server";
import { isConfigured, createRequisition, getRequisition } from "@/lib/gocardless-bad";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

async function authUser(req: Request) {
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await sb.auth.getUser();
  return data?.user ?? null;
}

/**
 * POST /api/psd2/requisition
 * Body: { institutionId: string, redirect: string }
 * Crée une requisition GoCardless, renvoie l'URL d'authentification bancaire.
 */
export async function POST(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "GoCardless BAD not configured" }, { status: 501 });
  }
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null) as { institutionId?: string; redirect?: string } | null;
  if (!body?.institutionId || !body?.redirect) {
    return NextResponse.json({ error: "institutionId and redirect required" }, { status: 400 });
  }

  try {
    const req_ = await createRequisition({
      institutionId: body.institutionId,
      redirect: body.redirect,
      reference: `user-${user.id}-${Date.now()}`,
      userLanguage: "FR",
    });
    return NextResponse.json({ id: req_.id, link: req_.link, status: req_.status });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}

/**
 * GET /api/psd2/requisition?id=xxx
 * Récupère le statut + comptes liés après redirection bancaire.
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "GoCardless BAD not configured" }, { status: 501 });
  }
  const user = await authUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const id = new URL(req.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  try {
    const r = await getRequisition(id);
    return NextResponse.json({ id: r.id, status: r.status, accounts: r.accounts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
