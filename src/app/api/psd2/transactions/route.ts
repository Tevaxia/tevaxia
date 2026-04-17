import { NextResponse } from "next/server";
import { isConfigured, getAccountTransactions } from "@/lib/gocardless-bad";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * GET /api/psd2/transactions?accountId=xxx
 * Récupère les transactions booked + pending du compte.
 * Renvoie un format compatible avec le parser de réconciliation (BankMovement).
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "GoCardless BAD not configured" }, { status: 501 });
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await sb.auth.getUser();
  if (!data?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const accountId = new URL(req.url).searchParams.get("accountId");
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  try {
    const { booked } = await getAccountTransactions(accountId);
    const movements = booked.map((t) => ({
      date: t.bookingDate ?? t.valueDate ?? "",
      label: (t.remittanceInformationUnstructured ?? t.creditorName ?? t.debtorName ?? "—").slice(0, 100),
      amount: parseFloat(t.transactionAmount.amount),
      reference: t.transactionId ?? "",
    }));
    return NextResponse.json({ movements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
