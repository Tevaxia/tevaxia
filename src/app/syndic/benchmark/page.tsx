"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { listCoownerships, type Coownership } from "@/lib/coownerships";
import { errMsg } from "@/lib/errors";

interface BenchmarkRow {
  copro: Coownership;
  nbLots: number;
  totalSurface: number;
  budget: number;
  chargesPerM2: number | null;
  fundsPerM2: number | null;
  recouvrementPct: number | null;
  retardMoyenJ: number | null;
  relancesParLot: number | null;
  coutSyndicParLot: number | null;
}

async function loadBenchmark(copros: Coownership[]): Promise<BenchmarkRow[]> {
  if (!supabase) return [];
  const currentYear = new Date().getFullYear();

  const rows: BenchmarkRow[] = [];
  for (const c of copros) {
    const [unitsRes, budgetRes, callsRes] = await Promise.all([
      supabase.from("coownership_units").select("id,surface_m2").eq("coownership_id", c.id),
      supabase
        .from("coownership_budgets")
        .select("total_budget,categories,year")
        .eq("coownership_id", c.id)
        .eq("year", currentYear)
        .maybeSingle(),
      supabase
        .from("coownership_calls")
        .select("id")
        .eq("coownership_id", c.id)
        .in("status", ["issued", "partially_paid", "paid", "overdue"]),
    ]);

    const units = (unitsRes.data ?? []) as { id: string; surface_m2: number | null }[];
    const totalSurface = units.reduce((s, u) => s + (u.surface_m2 ?? 0), 0);
    const budget = ((budgetRes.data as { total_budget?: number } | null)?.total_budget) ?? 0;
    const categories = ((budgetRes.data as { categories?: Record<string, number> } | null)?.categories) ?? {};
    const nbLots = c.nb_lots ?? units.length;
    const funds = c.works_fund_balance ?? 0;
    const honoraires = Number(categories["syndic_honoraires"] ?? 0);

    const callIds = ((callsRes.data ?? []) as { id: string }[]).map((x) => x.id);
    let chargesData: { amount_due: number; amount_paid: number; paid_at: string | null; reminder_count: number; call_id: string }[] = [];
    if (callIds.length > 0) {
      const chRes = await supabase
        .from("coownership_unit_charges")
        .select("amount_due,amount_paid,paid_at,reminder_count,call_id")
        .in("call_id", callIds);
      chargesData = ((chRes.data ?? []) as typeof chargesData);
    }

    const totalDue = chargesData.reduce((s, x) => s + Number(x.amount_due ?? 0), 0);
    const totalPaid = chargesData.reduce((s, x) => s + Number(x.amount_paid ?? 0), 0);
    const recouvrementPct = totalDue > 0 ? (totalPaid / totalDue) * 100 : null;

    // retard moyen: pour les lignes payées, calculer days(paid_at - call.due_date)
    // On charge juste les calls pour leur due_date
    let retardMoyenJ: number | null = null;
    if (chargesData.length > 0 && callIds.length > 0) {
      const duesRes = await supabase
        .from("coownership_calls")
        .select("id,due_date")
        .in("id", callIds);
      const dueDateById: Record<string, string> = {};
      for (const row of (duesRes.data ?? []) as { id: string; due_date: string }[]) {
        dueDateById[row.id] = row.due_date;
      }
      const retards: number[] = [];
      for (const ch of chargesData) {
        if (!ch.paid_at) continue;
        const dd = dueDateById[ch.call_id];
        if (!dd) continue;
        const days = Math.round(
          (new Date(ch.paid_at).getTime() - new Date(dd).getTime()) / (1000 * 60 * 60 * 24),
        );
        retards.push(Math.max(0, days));
      }
      if (retards.length > 0) {
        retardMoyenJ = retards.reduce((a, b) => a + b, 0) / retards.length;
      }
    }

    const totalReminders = chargesData.reduce((s, x) => s + (x.reminder_count ?? 0), 0);
    const relancesParLot = nbLots > 0 ? totalReminders / nbLots : null;

    rows.push({
      copro: c,
      nbLots,
      totalSurface,
      budget,
      chargesPerM2: totalSurface > 0 ? budget / totalSurface : null,
      fundsPerM2: totalSurface > 0 ? funds / totalSurface : null,
      recouvrementPct,
      retardMoyenJ,
      relancesParLot,
      coutSyndicParLot: nbLots > 0 && honoraires > 0 ? honoraires / nbLots : null,
    });
  }
  return rows;
}

function percentile(values: number[], v: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const i = sorted.findIndex((x) => x >= v);
  return i === -1 ? 100 : (i / sorted.length) * 100;
}

function cellClass(pct: number | null, invert = false): string {
  if (pct === null) return "text-muted";
  const score = invert ? 100 - pct : pct;
  if (score >= 75) return "text-emerald-700 font-semibold";
  if (score >= 50) return "text-amber-700";
  return "text-rose-700 font-semibold";
}

export default function SyndicBenchmarkPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const numberLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const t = useTranslations("syndicBenchmark");
  const { user } = useAuth();

  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null);
  const [rows, setRows] = useState<BenchmarkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !isSupabaseConfigured) return;
    listMyOrganizations()
      .then((list) => {
        const syndicOrgs = list.filter((o) => o.org_type === "syndic");
        setOrgs(syndicOrgs);
        if (syndicOrgs.length > 0 && !activeOrgId) setActiveOrgId(syndicOrgs[0].id);
      })
      .catch((e) => setError(errMsg(e, String(e))));
  }, [user, activeOrgId]);

  useEffect(() => {
    if (!activeOrgId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    (async () => {
      try {
        const copros = await listCoownerships(activeOrgId);
        if (cancelled) return;
        const bench = await loadBenchmark(copros);
        if (cancelled) return;
        setRows(bench);
      } catch (e) {
        if (!cancelled) setError(errMsg(e, String(e)));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeOrgId]);

  const allCharges = rows.map((r) => r.chargesPerM2).filter((x): x is number => x !== null);
  const allFunds = rows.map((r) => r.fundsPerM2).filter((x): x is number => x !== null);
  const allRec = rows.map((r) => r.recouvrementPct).filter((x): x is number => x !== null);
  const allRetards = rows.map((r) => r.retardMoyenJ).filter((x): x is number => x !== null);
  const allRelances = rows.map((r) => r.relancesParLot).filter((x): x is number => x !== null);
  const allSyndic = rows.map((r) => r.coutSyndicParLot).filter((x): x is number => x !== null);

  const overallScore = useMemo(() => {
    return rows.map((r) => {
      const scores: number[] = [];
      if (r.chargesPerM2 !== null && allCharges.length > 1) scores.push(100 - percentile(allCharges, r.chargesPerM2));
      if (r.fundsPerM2 !== null && allFunds.length > 1) scores.push(percentile(allFunds, r.fundsPerM2));
      if (r.recouvrementPct !== null && allRec.length > 1) scores.push(percentile(allRec, r.recouvrementPct));
      if (r.retardMoyenJ !== null && allRetards.length > 1) scores.push(100 - percentile(allRetards, r.retardMoyenJ));
      if (r.relancesParLot !== null && allRelances.length > 1) scores.push(100 - percentile(allRelances, r.relancesParLot));
      const avg = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : null;
      return { id: r.copro.id, score: avg };
    });
  }, [rows, allCharges, allFunds, allRec, allRetards, allRelances]);

  if (!user) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-sm text-muted">{t("loginPrompt")}</p>
        <Link href={`${lp}/connexion`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          {t("loginButton")}
        </Link>
      </div>
    );
  }

  const fmtEUR = (n: number) => `${n.toLocaleString(numberLocale, { maximumFractionDigits: 0 })} €`;
  const fmtPct = (n: number | null) => (n === null ? "—" : `${n.toFixed(0)} %`);
  const fmtDec = (n: number | null, d = 1) => (n === null ? "—" : n.toFixed(d));

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes`} className="text-xs text-muted hover:text-navy">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

        {orgs.length > 1 && (
          <div className="mt-6 flex items-center gap-2">
            <label className="text-xs text-muted">{t("cabinetLabel")}</label>
            <select
              value={activeOrgId ?? ""}
              onChange={(e) => setActiveOrgId(e.target.value)}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm"
            >
              {orgs.map((o) => (<option key={o.id} value={o.id}>{o.name}</option>))}
            </select>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {loading ? (
          <p className="mt-10 text-sm text-muted">{t("loading")}</p>
        ) : rows.length < 2 ? (
          <div className="mt-8 rounded-xl border border-dashed border-card-border bg-card p-10 text-center">
            <p className="text-sm text-muted">{t("needTwo")}</p>
            <Link href={`${lp}/syndic/coproprietes`} className="mt-4 inline-flex rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
              {t("manageCopros")}
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-muted">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">{t("colCopro")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colLots")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colSurface")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colBudget", { year: new Date().getFullYear() })}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colChargesM2")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colFundsM2")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colRecouvrement")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colRetard")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colRelances")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colSyndicLot")}</th>
                    <th className="px-3 py-3 text-right font-semibold">{t("colScore")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const sc = overallScore.find((s) => s.id === r.copro.id)?.score ?? null;
                    return (
                      <tr key={r.copro.id} className="border-t border-card-border">
                        <td className="px-4 py-2">
                          <Link href={`${lp}/syndic/coproprietes/${r.copro.id}`} className="font-medium text-navy hover:underline">
                            {r.copro.name}
                          </Link>
                          {r.copro.commune && (
                            <div className="text-[10px] text-muted">{r.copro.commune}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.nbLots}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.totalSurface > 0 ? `${r.totalSurface.toFixed(0)} m²` : "—"}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{r.budget > 0 ? fmtEUR(r.budget) : "—"}</td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.chargesPerM2 !== null && allCharges.length > 1 ? 100 - percentile(allCharges, r.chargesPerM2) : null)}`}>
                          {r.chargesPerM2 !== null ? `${r.chargesPerM2.toFixed(1)} €/m²` : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.fundsPerM2 !== null && allFunds.length > 1 ? percentile(allFunds, r.fundsPerM2) : null)}`}>
                          {r.fundsPerM2 !== null ? `${r.fundsPerM2.toFixed(1)} €/m²` : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.recouvrementPct !== null && allRec.length > 1 ? percentile(allRec, r.recouvrementPct) : null)}`}>
                          {fmtPct(r.recouvrementPct)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.retardMoyenJ !== null && allRetards.length > 1 ? 100 - percentile(allRetards, r.retardMoyenJ) : null)}`}>
                          {r.retardMoyenJ !== null ? `${r.retardMoyenJ.toFixed(0)} j` : "—"}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.relancesParLot !== null && allRelances.length > 1 ? 100 - percentile(allRelances, r.relancesParLot) : null)}`}>
                          {fmtDec(r.relancesParLot, 2)}
                        </td>
                        <td className={`px-3 py-2 text-right tabular-nums ${cellClass(r.coutSyndicParLot !== null && allSyndic.length > 1 ? 100 - percentile(allSyndic, r.coutSyndicParLot) : null)}`}>
                          {r.coutSyndicParLot !== null ? fmtEUR(r.coutSyndicParLot) : "—"}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {sc !== null ? (
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-bold ${
                              sc >= 75 ? "bg-emerald-100 text-emerald-800" :
                              sc >= 50 ? "bg-amber-100 text-amber-800" :
                              "bg-rose-100 text-rose-800"
                            }`}>
                              {sc.toFixed(0)}
                            </span>
                          ) : <span className="text-muted">—</span>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-xs text-muted">
              <div className="rounded-lg border border-card-border bg-card p-3">
                <div className="font-semibold text-navy">{t("colChargesM2")}</div>
                <div>{t("hintChargesM2")}</div>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-3">
                <div className="font-semibold text-navy">{t("colFundsM2")}</div>
                <div>{t("hintFundsM2")}</div>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-3">
                <div className="font-semibold text-navy">{t("colRecouvrement")}</div>
                <div>{t("hintRecouvrement")}</div>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-3">
                <div className="font-semibold text-navy">{t("colRetard")}</div>
                <div>{t("hintRetard")}</div>
              </div>
              <div className="rounded-lg border border-card-border bg-card p-3">
                <div className="font-semibold text-navy">{t("colScore")}</div>
                <div>{t("hintScore")}</div>
              </div>
            </div>

            <p className="mt-6 text-xs text-muted">{t("methodology")}</p>
          </>
        )}
      </div>
    </div>
  );
}
