"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import { listAccounts, listYears, openYear, type Account, type AccountingYear, CLASSE_LABEL } from "@/lib/coownership-accounting";
import {
  listBudgetLines, upsertBudgetLine, deleteBudgetLine,
  getBudgetVsActual, cloneBudgetFromPreviousYear,
  summarizeBudgetVsActual, NATURE_LABELS, NATURE_COLORS,
  type BudgetLine, type BudgetVsActualRow, type BudgetNature,
} from "@/lib/coownership-budgets";
import { listAllocationKeys, type AllocationKey } from "@/lib/coownership-allocations";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

function consumedColor(pct: number | null): string {
  if (pct === null) return "bg-slate-100 text-slate-700";
  if (pct > 100) return "bg-rose-100 text-rose-900";
  if (pct > 90) return "bg-amber-100 text-amber-900";
  if (pct > 50) return "bg-blue-100 text-blue-900";
  return "bg-emerald-100 text-emerald-900";
}

export default function BudgetPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");
  const thisYear = new Date().getFullYear();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [years, setYears] = useState<AccountingYear[]>([]);
  const [activeYear, setActiveYear] = useState<number>(thisYear);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [keys, setKeys] = useState<AllocationKey[]>([]);
  const [lines, setLines] = useState<BudgetLine[]>([]);
  const [actualRows, setActualRows] = useState<BudgetVsActualRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Record<string, number>>({});

  const reload = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, ys, ac, ks, ls, av] = await Promise.all([
        getCoownership(id),
        listYears(id),
        listAccounts(id),
        listAllocationKeys(id),
        listBudgetLines(id, activeYear),
        getBudgetVsActual(id, activeYear),
      ]);
      setCoown(c); setYears(ys); setAccounts(ac); setKeys(ks);
      setLines(ls); setActualRows(av);
    } catch (e) {
      setError(errMsg(e, "Erreur de chargement"));
    }
    setLoading(false);
  }, [id, activeYear]);

  useEffect(() => { if (user) void reload(); }, [user, reload]);

  const summary = useMemo(() => summarizeBudgetVsActual(actualRows), [actualRows]);

  const getLine = (accountId: string): BudgetLine | null =>
    lines.find((l) => l.account_id === accountId) ?? null;

  const getActual = (accountId: string): BudgetVsActualRow | null =>
    actualRows.find((r) => r.account_id === accountId) ?? null;

  const saveBudget = async (account: Account, amount: number, nature: BudgetNature, keyId: string | null) => {
    if (!id) return;
    try {
      await upsertBudgetLine({
        coownership_id: id,
        year: activeYear,
        account_id: account.id,
        amount_budgeted: amount,
        allocation_key_id: keyId,
        nature,
      });
      await reload();
    } catch (e) {
      setError(errMsg(e, "Erreur"));
    }
  };

  const removeLine = async (lineId: string) => {
    if (!confirm("Supprimer cette ligne de budget ?")) return;
    await deleteBudgetLine(lineId);
    await reload();
  };

  const clonePrevious = async () => {
    if (!id) return;
    if (!confirm(`Cloner le budget ${activeYear - 1} vers ${activeYear} avec indexation +2% ?`)) return;
    try {
      const n = await cloneBudgetFromPreviousYear(id, activeYear - 1, activeYear, 0.02);
      alert(`${n} lignes clonées.`);
      await reload();
    } catch (e) {
      setError(errMsg(e, "Erreur clonage"));
    }
  };

  const handleOpenYear = async (y: number) => {
    if (!id) return;
    try { await openYear(id, y); await reload(); }
    catch (e) { setError(errMsg(e, "Erreur")); }
  };

  if (loading || !coown) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  }

  const chargeAccounts = accounts.filter((a) => a.classe === 6);
  const incomeAccounts = accounts.filter((a) => a.classe === 7);
  const otherAccounts = accounts.filter((a) => a.classe !== 6 && a.classe !== 7);

  const renderRow = (account: Account) => {
    const line = getLine(account.id);
    const actual = getActual(account.id);
    const edKey = `${account.id}_amount`;
    const edValue = editing[edKey];
    const amt = edValue !== undefined ? edValue : (line?.amount_budgeted ?? 0);
    const nature = line?.nature ?? "courantes";
    const keyId = line?.allocation_key_id ?? null;

    return (
      <tr key={account.id} className="border-b border-card-border/40 hover:bg-background/40">
        <td className="px-3 py-2 font-mono text-xs text-navy">{account.code}</td>
        <td className="px-3 py-2 text-sm">{account.label}</td>
        <td className="px-3 py-2">
          <input type="number" step={100}
            value={amt || ""}
            placeholder="0"
            onChange={(e) => setEditing({ ...editing, [edKey]: Number(e.target.value) || 0 })}
            onBlur={async () => {
              if (edValue !== undefined && edValue !== line?.amount_budgeted) {
                await saveBudget(account, edValue, nature, keyId);
                const { [edKey]: _omit, ...rest } = editing;
                setEditing(rest);
              }
            }}
            className="w-28 rounded border border-input-border bg-input-bg px-2 py-1 text-right text-xs font-mono" />
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs">
          {actual ? formatEUR(actual.amount_actual) : "—"}
        </td>
        <td className="px-3 py-2 text-right">
          {actual && actual.amount_budgeted > 0 ? (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${consumedColor(actual.pct_consumed)}`}>
              {actual.pct_consumed?.toFixed(1)}%
            </span>
          ) : <span className="text-[10px] text-muted">—</span>}
        </td>
        <td className="px-3 py-2 text-right font-mono text-xs">
          {actual && actual.amount_budgeted > 0 ? (
            <span className={actual.variance >= 0 ? "text-emerald-700" : "text-rose-700"}>
              {actual.variance >= 0 ? "+" : ""}{formatEUR(actual.variance)}
            </span>
          ) : "—"}
        </td>
        <td className="px-3 py-2">
          <select value={nature}
            onChange={async (e) => await saveBudget(account, amt, e.target.value as BudgetNature, keyId)}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold border-none ${NATURE_COLORS[nature]}`}>
            {(Object.keys(NATURE_LABELS) as BudgetNature[]).map((n) => (
              <option key={n} value={n}>{NATURE_LABELS[n]}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <select value={keyId ?? ""}
            onChange={async (e) => await saveBudget(account, amt, nature, e.target.value || null)}
            className="rounded border border-input-border bg-input-bg px-2 py-1 text-[10px] max-w-[140px]">
            <option value="">— tantièmes par défaut —</option>
            {keys.map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2 text-right">
          {line && (
            <button onClick={() => removeLine(line.id)} className="text-[10px] text-rose-700 hover:underline">×</button>
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">
          ← {coown.name}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Budget prévisionnel</h1>
        <p className="mt-1 text-sm text-muted">
          Budget par compte avec comparatif réalisé en temps réel. Base des appels de fonds et
          des annexes comptables pour l&apos;AG annuelle (loi copropriété LU 1988).
        </p>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

        {/* Year selector */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {[thisYear - 1, thisYear, thisYear + 1].map((y) => (
              <button key={y} onClick={() => setActiveYear(y)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  y === activeYear ? "border-navy bg-navy text-white" : "border-card-border bg-card text-navy hover:bg-slate-50"
                }`}>
                Exercice {y}
                {!years.find((yr) => yr.year === y) && (
                  <span className="ml-1 rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] font-normal text-slate-600">
                    Non ouvert
                  </span>
                )}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            {!years.find((y) => y.year === activeYear) && (
              <button onClick={() => handleOpenYear(activeYear)}
                className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                Ouvrir exercice {activeYear}
              </button>
            )}
            {lines.length === 0 && years.find((y) => y.year === activeYear - 1) && (
              <button onClick={clonePrevious}
                className="rounded-lg border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5">
                Cloner {activeYear - 1} (+2%)
              </button>
            )}
          </div>
        </div>

        {accounts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            Le plan comptable n&apos;est pas encore initialisé.{" "}
            <Link href={`${lp}/syndic/coproprietes/${id}/comptabilite`} className="underline font-semibold">
              Aller à la comptabilité
            </Link>{" "}
            pour l&apos;initialiser.
          </div>
        ) : (
          <>
            {/* KPIs budget vs réalisé */}
            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Budget charges</div>
                <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(summary.expensesBudgeted)}</div>
                <div className="mt-0.5 text-[11px] text-muted">Réalisé : {formatEUR(summary.expensesActual)}</div>
              </div>
              <div className={`rounded-xl border p-4 ${
                summary.pctConsumed !== null && summary.pctConsumed > 100
                  ? "border-rose-200 bg-rose-50"
                  : "border-card-border bg-card"
              }`}>
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Consommation</div>
                <div className={`mt-1 text-2xl font-bold ${
                  summary.pctConsumed !== null && summary.pctConsumed > 100 ? "text-rose-900" : "text-navy"
                }`}>
                  {summary.pctConsumed !== null ? `${summary.pctConsumed.toFixed(1)}%` : "—"}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">
                  {summary.pctConsumed !== null && summary.pctConsumed > 100 ? "Dépassement budget" : "Sous budget"}
                </div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Appels prévus</div>
                <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(summary.incomeBudgeted)}</div>
                <div className="mt-0.5 text-[11px] text-muted">Encaissé : {formatEUR(summary.incomeActual)}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-4">
                <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Écart</div>
                <div className={`mt-1 text-2xl font-bold ${summary.variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                  {summary.variance >= 0 ? "+" : ""}{formatEUR(summary.variance)}
                </div>
                <div className="mt-0.5 text-[11px] text-muted">Budget - réalisé</div>
              </div>
            </div>

            {/* Tables */}
            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-2">
                Charges prévisionnelles (classe {CLASSE_LABEL[6]})
              </h2>
              <div className="rounded-xl border border-card-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background/60">
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Compte</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Libellé</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Budget</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Réalisé</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">%</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Écart</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Nature</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Clé</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>{chargeAccounts.map(renderRow)}</tbody>
                </table>
              </div>
            </div>

            <div className="mt-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-2">
                Produits prévisionnels (classe {CLASSE_LABEL[7]})
              </h2>
              <div className="rounded-xl border border-card-border bg-card overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-card-border bg-background/60">
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Compte</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Libellé</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Budget</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Réalisé</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">%</th>
                      <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Écart</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Nature</th>
                      <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Clé</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>{incomeAccounts.map(renderRow)}</tbody>
                </table>
              </div>
            </div>

            {otherAccounts.length > 0 && (
              <details className="mt-6">
                <summary className="cursor-pointer text-xs font-semibold text-muted">
                  Autres comptes (classes 1-5) — avancé
                </summary>
                <div className="mt-2 rounded-xl border border-card-border bg-card overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-card-border bg-background/60">
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Compte</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Libellé</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Budget</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Réalisé</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">%</th>
                        <th className="px-3 py-2 text-right text-[10px] uppercase tracking-wider text-muted">Écart</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Nature</th>
                        <th className="px-3 py-2 text-left text-[10px] uppercase tracking-wider text-muted">Clé</th>
                        <th className="px-3 py-2"></th>
                      </tr>
                    </thead>
                    <tbody>{otherAccounts.map(renderRow)}</tbody>
                  </table>
                </div>
              </details>
            )}

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
              <strong>Nature des charges :</strong> courantes (budget annuel voté), travaux (hors budget,
              vote spécifique), fonds travaux (provision loi 10 juin 1999 — obligatoire &gt; 10 lots au LU),
              exceptionnel (sinistre, contentieux). La ventilation définit la répartition dans les appels
              de fonds et les annexes comptables de l&apos;AG.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
