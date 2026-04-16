"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import {
  listYears, openYear, closeYear,
  listAccounts, seedChart,
  listEntries, createEntryWithLines, deleteEntry, listLines,
  getBalance, computeResult,
  JOURNAL_LABEL, CLASSE_LABEL,
  type AccountingYear, type Account, type Entry, type EntryLine, type BalanceRow, type JournalCode,
} from "@/lib/coownership-accounting";
import { formatEUR } from "@/lib/calculations";

type DraftLine = { account_id: string; debit: number; credit: number; line_label: string };

export default function AccountingPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");
  const thisYear = new Date().getFullYear();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [years, setYears] = useState<AccountingYear[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [linesByEntry, setLinesByEntry] = useState<Record<string, EntryLine[]>>({});
  const [balance, setBalance] = useState<BalanceRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"journal" | "balance">("journal");

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [newEntry, setNewEntry] = useState<{
    entry_date: string;
    reference: string;
    label: string;
    journal_code: JournalCode;
    lines: DraftLine[];
  }>({
    entry_date: new Date().toISOString().slice(0, 10),
    reference: "",
    label: "",
    journal_code: "OD",
    lines: [
      { account_id: "", debit: 0, credit: 0, line_label: "" },
      { account_id: "", debit: 0, credit: 0, line_label: "" },
    ],
  });

  const refresh = async () => {
    try {
      const [c, y, a] = await Promise.all([getCoownership(id), listYears(id), listAccounts(id)]);
      setCoown(c); setYears(y); setAccounts(a);
      if (!activeYearId && y.length > 0) setActiveYearId(y[0].id);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const loadYearDetails = async (yearId: string, year: number) => {
    const [es, b] = await Promise.all([listEntries(yearId), getBalance(id, year)]);
    setEntries(es);
    setBalance(b);
    const linesMap: Record<string, EntryLine[]> = {};
    for (const e of es) {
      linesMap[e.id] = await listLines(e.id);
    }
    setLinesByEntry(linesMap);
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const activeYear = useMemo(() => years.find((y) => y.id === activeYearId) ?? null, [years, activeYearId]);

  useEffect(() => {
    if (activeYear) void loadYearDetails(activeYear.id, activeYear.year);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeYear]);

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const needsSeed = accounts.length === 0;

  const handleSeedChart = async () => {
    try { await seedChart(id); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleOpenYear = async (year: number) => {
    try { const y = await openYear(id, year); setActiveYearId(y.id); await refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleCloseYear = async () => {
    if (!activeYear) return;
    if (!confirm(`Clôturer l'exercice ${activeYear.year} ? Les écritures seront verrouillées (non modifiables).`)) return;
    try {
      const result = await closeYear(activeYear.id);
      alert(`Exercice ${activeYear.year} clôturé. Résultat : ${formatEUR(result)}`);
      await refresh();
      if (activeYear) await loadYearDetails(activeYear.id, activeYear.year);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const addLine = () => setNewEntry((p) => ({
    ...p, lines: [...p.lines, { account_id: "", debit: 0, credit: 0, line_label: "" }],
  }));

  const updateLine = (i: number, patch: Partial<DraftLine>) =>
    setNewEntry((p) => ({ ...p, lines: p.lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)) }));

  const removeLine = (i: number) =>
    setNewEntry((p) => ({ ...p, lines: p.lines.filter((_, idx) => idx !== i) }));

  const totalDebit = newEntry.lines.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = newEntry.lines.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSaveEntry = async () => {
    if (!activeYear) return;
    try {
      await createEntryWithLines({
        coownership_id: id,
        year_id: activeYear.id,
        entry_date: newEntry.entry_date,
        reference: newEntry.reference || undefined,
        label: newEntry.label,
        journal_code: newEntry.journal_code,
        lines: newEntry.lines.filter((l) => l.account_id && (l.debit > 0 || l.credit > 0)),
      });
      setShowNewEntry(false);
      setNewEntry({
        entry_date: new Date().toISOString().slice(0, 10),
        reference: "", label: "", journal_code: "OD",
        lines: [
          { account_id: "", debit: 0, credit: 0, line_label: "" },
          { account_id: "", debit: 0, credit: 0, line_label: "" },
        ],
      });
      await loadYearDetails(activeYear.id, activeYear.year);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!activeYear) return;
    if (!confirm("Supprimer cette écriture ?")) return;
    try { await deleteEntry(entryId); await loadYearDetails(activeYear.id, activeYear.year); }
    catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const resultInfo = computeResult(balance);
  const lockedYear = activeYear?.status === "closed";

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">← {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Comptabilité copropriété</h1>
        <p className="mt-1 text-sm text-muted">
          Plan comptable standardisé LU · double-entrée · journal, balance et clôture annuelle avec calcul du résultat.
        </p>

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {needsSeed && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <h2 className="text-sm font-semibold text-amber-900">Plan comptable non initialisé</h2>
            <p className="mt-1 text-xs text-amber-800">
              Créez le plan comptable standardisé (classes 1 à 7, 22 comptes système) avant toute saisie.
            </p>
            <button onClick={handleSeedChart} className="mt-3 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              Initialiser le plan comptable
            </button>
          </div>
        )}

        {!needsSeed && (
          <>
            {/* Year selector */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {years.map((y) => (
                  <button key={y.id} onClick={() => setActiveYearId(y.id)}
                    className={`rounded-lg border px-3 py-2 text-xs ${
                      y.id === activeYearId ? "border-navy bg-navy text-white" : "border-card-border bg-card text-navy hover:bg-slate-50"
                    }`}>
                    Exercice {y.year}
                    <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${
                      y.status === "closed" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {y.status === "closed" ? "Clôturé" : "Ouvert"}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!years.find((y) => y.year === thisYear) && (
                  <button onClick={() => handleOpenYear(thisYear)}
                    className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                    + Ouvrir exercice {thisYear}
                  </button>
                )}
                {activeYear && activeYear.status === "open" && (
                  <button onClick={handleCloseYear}
                    className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
                    Clôturer {activeYear.year}
                  </button>
                )}
              </div>
            </div>

            {activeYear && (
              <>
                {/* KPIs */}
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-card-border bg-card p-4">
                    <div className="text-xs uppercase tracking-wider text-muted font-semibold">Écritures</div>
                    <div className="mt-1 text-2xl font-bold text-navy">{entries.length}</div>
                  </div>
                  <div className="rounded-xl border border-card-border bg-card p-4">
                    <div className="text-xs uppercase tracking-wider text-muted font-semibold">Produits (cl. 7)</div>
                    <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(resultInfo.income)}</div>
                  </div>
                  <div className="rounded-xl border border-card-border bg-card p-4">
                    <div className="text-xs uppercase tracking-wider text-muted font-semibold">Charges (cl. 6)</div>
                    <div className="mt-1 text-2xl font-bold text-rose-700">{formatEUR(resultInfo.expense)}</div>
                  </div>
                  <div className="rounded-xl border border-card-border bg-card p-4">
                    <div className="text-xs uppercase tracking-wider text-muted font-semibold">Résultat</div>
                    <div className={`mt-1 text-2xl font-bold ${resultInfo.result >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                      {formatEUR(resultInfo.result)}
                    </div>
                  </div>
                </div>

                {/* View toggle + new entry */}
                <div className="mt-6 flex items-center justify-between">
                  <div className="inline-flex rounded-lg border border-card-border bg-card">
                    <button onClick={() => setView("journal")}
                      className={`px-3 py-1.5 text-xs ${view === "journal" ? "bg-navy text-white rounded-l-lg" : "text-navy"}`}>
                      Journal
                    </button>
                    <button onClick={() => setView("balance")}
                      className={`px-3 py-1.5 text-xs ${view === "balance" ? "bg-navy text-white rounded-r-lg" : "text-navy"}`}>
                      Balance
                    </button>
                  </div>
                  {!lockedYear && (
                    <button onClick={() => setShowNewEntry(!showNewEntry)}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">
                      {showNewEntry ? "Annuler" : "+ Nouvelle écriture"}
                    </button>
                  )}
                </div>

                {/* New entry form */}
                {showNewEntry && !lockedYear && (
                  <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
                    <div className="grid gap-3 sm:grid-cols-4">
                      <input type="date" value={newEntry.entry_date}
                        onChange={(e) => setNewEntry({ ...newEntry, entry_date: e.target.value })}
                        className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                      <input type="text" placeholder="Référence pièce"
                        value={newEntry.reference}
                        onChange={(e) => setNewEntry({ ...newEntry, reference: e.target.value })}
                        className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                      <select value={newEntry.journal_code}
                        onChange={(e) => setNewEntry({ ...newEntry, journal_code: e.target.value as JournalCode })}
                        className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                        {(Object.keys(JOURNAL_LABEL) as JournalCode[]).map((k) => (
                          <option key={k} value={k}>{k} — {JOURNAL_LABEL[k]}</option>
                        ))}
                      </select>
                      <input type="text" placeholder="Libellé de l'écriture"
                        value={newEntry.label}
                        onChange={(e) => setNewEntry({ ...newEntry, label: e.target.value })}
                        className="sm:col-span-1 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
                    </div>

                    <table className="mt-3 w-full text-xs">
                      <thead className="bg-background text-[10px] uppercase tracking-wider text-muted">
                        <tr>
                          <th className="px-2 py-1.5 text-left">Compte</th>
                          <th className="px-2 py-1.5 text-left">Libellé ligne</th>
                          <th className="px-2 py-1.5 text-right w-32">Débit</th>
                          <th className="px-2 py-1.5 text-right w-32">Crédit</th>
                          <th className="px-2 py-1.5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {newEntry.lines.map((l, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1">
                              <select value={l.account_id}
                                onChange={(e) => updateLine(i, { account_id: e.target.value })}
                                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs">
                                <option value="">— Sélectionner —</option>
                                {accounts.map((a) => (
                                  <option key={a.id} value={a.id}>{a.code} · {a.label}</option>
                                ))}
                              </select>
                            </td>
                            <td className="px-2 py-1">
                              <input type="text" value={l.line_label}
                                onChange={(e) => updateLine(i, { line_label: e.target.value })}
                                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={l.debit || ""}
                                onChange={(e) => updateLine(i, { debit: Number(e.target.value) || 0, credit: 0 })}
                                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-right text-xs" />
                            </td>
                            <td className="px-2 py-1">
                              <input type="number" step="0.01" value={l.credit || ""}
                                onChange={(e) => updateLine(i, { credit: Number(e.target.value) || 0, debit: 0 })}
                                className="w-full rounded border border-input-border bg-input-bg px-2 py-1 text-right text-xs" />
                            </td>
                            <td className="px-2 py-1 text-right">
                              {newEntry.lines.length > 2 && (
                                <button onClick={() => removeLine(i)} className="text-muted hover:text-rose-600" title="Supprimer ligne">×</button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="border-t border-card-border font-semibold">
                          <td colSpan={2} className="px-2 py-2 text-right">Totaux</td>
                          <td className="px-2 py-2 text-right">{formatEUR(totalDebit)}</td>
                          <td className="px-2 py-2 text-right">{formatEUR(totalCredit)}</td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </table>

                    <div className="mt-3 flex items-center justify-between">
                      <button onClick={addLine} className="text-xs text-navy hover:underline">+ Ajouter une ligne</button>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-medium ${isBalanced ? "text-emerald-700" : "text-amber-700"}`}>
                          {isBalanced ? "✓ Écriture équilibrée" : `Écart : ${formatEUR(totalDebit - totalCredit)}`}
                        </span>
                        <button onClick={handleSaveEntry}
                          disabled={!isBalanced || !newEntry.label.trim()}
                          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                          Enregistrer
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Journal view */}
                {view === "journal" && (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-card-border bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border bg-background text-left uppercase tracking-wider text-muted text-[10px]">
                          <th className="px-3 py-2">Date</th>
                          <th className="px-3 py-2">Journal</th>
                          <th className="px-3 py-2">Réf.</th>
                          <th className="px-3 py-2">Libellé</th>
                          <th className="px-3 py-2">Lignes</th>
                          <th className="px-3 py-2 text-right">Débit</th>
                          <th className="px-3 py-2 text-right">Crédit</th>
                          <th className="px-3 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {entries.length === 0 && (
                          <tr><td colSpan={8} className="px-3 py-6 text-center text-muted">Aucune écriture saisie.</td></tr>
                        )}
                        {entries.map((e) => {
                          const lines = linesByEntry[e.id] ?? [];
                          const ed = lines.reduce((s, l) => s + Number(l.debit), 0);
                          const ec = lines.reduce((s, l) => s + Number(l.credit), 0);
                          return (
                            <tr key={e.id} className={e.is_locked ? "bg-slate-50/40" : ""}>
                              <td className="px-3 py-1.5">{new Date(e.entry_date).toLocaleDateString("fr-LU")}</td>
                              <td className="px-3 py-1.5"><span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-700">{e.journal_code}</span></td>
                              <td className="px-3 py-1.5 text-muted">{e.reference ?? "—"}</td>
                              <td className="px-3 py-1.5 font-medium text-navy">{e.label}</td>
                              <td className="px-3 py-1.5 text-muted">
                                {lines.map((l) => {
                                  const acc = accounts.find((a) => a.id === l.account_id);
                                  return (
                                    <div key={l.id} className="flex justify-between gap-2">
                                      <span>{acc?.code} · {acc?.label}</span>
                                      <span className="text-[10px]">{l.debit > 0 ? `D ${formatEUR(l.debit)}` : `C ${formatEUR(l.credit)}`}</span>
                                    </div>
                                  );
                                })}
                              </td>
                              <td className="px-3 py-1.5 text-right font-medium">{formatEUR(ed)}</td>
                              <td className="px-3 py-1.5 text-right font-medium">{formatEUR(ec)}</td>
                              <td className="px-3 py-1.5 text-right">
                                {!e.is_locked && (
                                  <button onClick={() => handleDeleteEntry(e.id)}
                                    className="rounded p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title="Supprimer">
                                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9" />
                                    </svg>
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Balance view */}
                {view === "balance" && (
                  <div className="mt-4 overflow-x-auto rounded-xl border border-card-border bg-card">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border bg-background text-left uppercase tracking-wider text-muted text-[10px]">
                          <th className="px-3 py-2">Code</th>
                          <th className="px-3 py-2">Libellé</th>
                          <th className="px-3 py-2">Classe</th>
                          <th className="px-3 py-2 text-right">Débit cumul.</th>
                          <th className="px-3 py-2 text-right">Crédit cumul.</th>
                          <th className="px-3 py-2 text-right">Solde</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {balance.map((b) => (
                          <tr key={b.account_id} className={b.total_debit === 0 && b.total_credit === 0 ? "opacity-50" : ""}>
                            <td className="px-3 py-1.5 font-mono text-navy">{b.code}</td>
                            <td className="px-3 py-1.5">{b.label}</td>
                            <td className="px-3 py-1.5 text-muted text-[10px]">{b.classe} · {CLASSE_LABEL[b.classe]}</td>
                            <td className="px-3 py-1.5 text-right">{formatEUR(b.total_debit)}</td>
                            <td className="px-3 py-1.5 text-right">{formatEUR(b.total_credit)}</td>
                            <td className={`px-3 py-1.5 text-right font-semibold ${b.balance >= 0 ? "text-navy" : "text-rose-700"}`}>
                              {formatEUR(b.balance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </>
        )}

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Plan comptable LU :</strong> ce module propose un plan simplifié adapté aux syndics (classes 1, 4, 5, 6, 7).
          Les écritures respectent le principe de la partie double. La clôture fige les écritures et calcule automatiquement
          le résultat (produits cl. 7 – charges cl. 6). Pour les copropriétés soumises à contrôle comptable, un expert-comptable
          peut récupérer la balance et le journal au format standard.
        </div>
      </div>
    </div>
  );
}
