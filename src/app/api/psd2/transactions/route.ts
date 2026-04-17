import { NextResponse } from "next/server";
import { isConfigured, getAccountTransactions } from "@/lib/enable-banking";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

/**
 * GET /api/psd2/transactions?accountId=xxx&dateFrom=YYYY-MM-DD
 * Récupère les transactions d'un compte Enable Banking et renvoie un format
 * compatible avec BankMovement de la page réconciliation.
 */
export async function GET(req: Request) {
  if (!isConfigured()) {
    return NextResponse.json({ error: "Enable Banking not configured" }, { status: 501 });
  }
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) return NextResponse.json({ error: "Supabase not configured" }, { status: 501 });
  const sb = createClient(url, anon, { global: { headers: { Authorization: `Bearer ${token}` } } });
  const { data } = await sb.auth.getUser();
  if (!data?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const qp = new URL(req.url).searchParams;
  const accountId = qp.get("accountId");
  const dateFrom = qp.get("dateFrom") ?? undefined;
  if (!accountId) return NextResponse.json({ error: "accountId required" }, { status: 400 });

  try {
    const txs = await getAccountTransactions(accountId, dateFrom);
    const movements = txs
      .filter((t) => t.status === "BOOK")
      .map((t) => {
        const amt = parseFloat(t.transaction_amount.amount);
        return {
          date: t.booking_date ?? t.value_date ?? t.transaction_date ?? "",
          label: (t.remittance_information?.join(" ") ?? t.creditor?.name ?? t.debtor?.name ?? "—").slice(0, 100),
          amount: t.credit_debit_indicator === "CRDT" ? amt : -amt,
          reference: t.entry_reference ?? "",
        };
      });
    return NextResponse.json({ movements });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
