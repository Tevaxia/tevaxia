"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import { markChargePaid } from "@/lib/coownership-finance";
import {
  parseBankStatement, matchTransactions,
  type BankTransaction, type ParsedBankStatement, type MatchResult, type UnpaidChargeForMatch,
} from "@/lib/syndic-bank-import";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

interface Psd2Institution { id: string; name: string; country: string; logo: string; bic: string }
interface Psd2Account { uid: string; account_id?: { iban?: string }; name?: string; currency?: string }
type PsdStep = "idle" | "select-bank" | "awaiting-callback" | "accounts" | "fetching" | "done";

export default function RapprochementPage() {
  const params = useParams();
  const coownershipId = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();
  const [coown, setCoown] = useState<Coownership | null>(null);
  const [unpaid, setUnpaid] = useState<UnpaidChargeForMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statement, setStatement] = useState<ParsedBankStatement | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [applying, setApplying] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PSD2 state
  const [psd2Enabled, setPsd2Enabled] = useState<boolean | null>(null);
  const [psd2Step, setPsd2Step] = useState<PsdStep>("idle");
  const [psd2Institutions, setPsd2Institutions] = useState<Psd2Institution[]>([]);
  const [psd2Country, setPsd2Country] = useState("LU");
  const [psd2Accounts, setPsd2Accounts] = useState<Psd2Account[]>([]);
  const [psd2DateFrom, setPsd2DateFrom] = useState(
    new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10),
  );

  const reload = useCallback(async () => {
    if (!coownershipId || !isSupabaseConfigured || !supabase) { setLoading(false); return; }
    setLoading(true);
    try {
      const c = await getCoownership(coownershipId);
      setCoown(c);
      const { data } = await supabase
        .from("coownership_unpaid_charges")
        .select("charge_id, unit_id, lot_number, owner_name, amount_due, amount_paid, amount_outstanding, payment_reference, call_label")
        .eq("coownership_id", coownershipId);
      const rows = ((data ?? []) as Array<{
        charge_id: string; unit_id: string; lot_number: string;
        owner_name: string | null; amount_due: number; amount_paid: number;
        amount_outstanding: number; payment_reference: string | null;
        call_label: string;
      }>).map((r) => ({
        charge_id: r.charge_id,
        unit_id: r.unit_id,
        lot_number: r.lot_number,
        owner_name: r.owner_name,
        amount_due: Number(r.amount_due),
        amount_paid: Number(r.amount_paid),
        outstanding: Number(r.amount_outstanding),
        payment_reference: r.payment_reference,
        call_label: r.call_label,
      }));
      setUnpaid(rows);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [coownershipId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const authFetch = useCallback(async (input: string, init?: RequestInit) => {
    if (!supabase) throw new Error("Supabase indisponible");
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    if (!token) throw new Error("Connexion requise");
    return fetch(input, { ...init, headers: { ...(init?.headers ?? {}), Authorization: `Bearer ${token}` } });
  }, []);

  // PSD2 — callback Enable Banking (?code=xxx après SCA bancaire)
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    if (!code) return;
    (async () => {
      setPsd2Step("awaiting-callback");
      try {
        const res = await authFetch(`/api/psd2/requisition?code=${encodeURIComponent(code)}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Erreur échange code");
        setPsd2Accounts((data.accountsData ?? []) as Psd2Account[]);
        setPsd2Step("accounts");
        window.history.replaceState({}, "", window.location.pathname);
      } catch (e) {
        setError(errMsg(e));
        setPsd2Step("idle");
      }
    })();
  }, [user, authFetch]);

  const openPsd2 = async () => {
    setError(null);
    setPsd2Step("select-bank");
    try {
      const res = await fetch(`/api/psd2/institutions?country=${psd2Country}`);
      if (res.status === 501) { setPsd2Enabled(false); return; }
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? `HTTP ${res.status}`);
      setPsd2Enabled(true);
      setPsd2Institutions(data.institutions ?? []);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const connectBank = async (inst: Psd2Institution) => {
    setError(null);
    try {
      const redirect = window.location.origin + window.location.pathname;
      const res = await authFetch("/api/psd2/requisition", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ institutionId: inst.id, country: inst.country, redirect }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      window.location.href = data.link;
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const fetchPsd2Transactions = async (accountUid: string) => {
    setPsd2Step("fetching");
    setError(null);
    try {
      const res = await authFetch(
        `/api/psd2/transactions?accountId=${encodeURIComponent(accountUid)}&dateFrom=${psd2DateFrom}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur récupération transactions");
      const movements = (data.movements ?? []) as Array<{ date: string; label: string; amount: number; reference: string }>;
      const txs: BankTransaction[] = movements.map((m) => ({
        date: m.date,
        amount: m.amount,
        label: m.label,
        reference: m.reference || null,
        counterparty: null,
        raw: {},
      }));
      const credits = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const debits = txs.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0);
      setStatement({
        transactions: txs,
        headers: ["date", "amount", "label", "reference"],
        delimiter: ",",
        format: "generic",
        total: txs.length,
        credits,
        debits,
      });
      setMatches(matchTransactions(txs, unpaid));
      setPsd2Step("done");
    } catch (e) {
      setError(errMsg(e));
      setPsd2Step("accounts");
    }
  };

  const handleFile = async (file: File) => {
    try {
      const content = await file.text();
      const parsed = parseBankStatement(content);
      setStatement(parsed);
      const matchResults = matchTransactions(parsed.transactions, unpaid);
      setMatches(matchResults);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const applyMatch = async (m: MatchResult) => {
    if (!m.matched_charge) return;
    await markChargePaid(m.matched_charge.charge_id, m.matched_charge.outstanding, "bank_transfer");
    setFlash(`✓ Charge lot ${m.matched_charge.lot_number} marquée payée`);
    setTimeout(() => setFlash(null), 3000);
    await reload();
  };

  const applyAll = async () => {
    const toApply = matches.filter((m) => m.matched_charge && m.match_score >= 60);
    if (toApply.length === 0) return;
    if (!confirm(`Valider ${toApply.length} rapprochements (score ≥ 60) ?`)) return;
    setApplying(true);
    let done = 0;
    for (const m of toApply) {
      if (m.matched_charge) {
        await markChargePaid(m.matched_charge.charge_id, m.matched_charge.outstanding, "bank_transfer");
        done++;
      }
    }
    setApplying(false);
    setFlash(`✓ ${done} charges marquées payées`);
    setTimeout(() => setFlash(null), 3500);
    await reload();
    setStatement(null);
    setMatches([]);
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !coown) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  const matchedCount = matches.filter((m) => m.matched_charge && m.match_score >= 60).length;
  const uncertainCount = matches.filter((m) => m.matched_charge && m.match_score >= 30 && m.match_score < 60).length;
  const unmatchedCount = matches.filter((m) => !m.matched_charge).length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">Rapprochement bancaire</h1>
      <p className="mt-1 text-sm text-muted">
        Upload du relevé bancaire CSV de la copropriété. Rapprochement automatique
        des crédits entrants avec les appels de fonds impayés via référence de paiement
        ou montant + nom propriétaire.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Stats impayés */}
      <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted">État actuel</div>
        <div className="mt-1 flex flex-wrap gap-4 text-sm">
          <div><strong>{unpaid.length}</strong> charges impayées</div>
          <div>Total outstanding : <strong>{formatEUR(unpaid.reduce((s, u) => s + u.outstanding, 0))}</strong></div>
        </div>
      </div>

      {/* Sources — CSV ou PSD2 */}
      {!statement && (
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          {/* CSV */}
          <div className="rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-8 text-center">
            <div className="text-3xl mb-2">📄</div>
            <h2 className="text-sm font-bold text-navy">Upload relevé CSV</h2>
            <p className="mt-1 text-[11px] text-muted">Export CSV depuis web banking LU.</p>
            <input type="file" ref={fileInputRef} accept=".csv,text/csv"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
              className="hidden" />
            <button onClick={() => fileInputRef.current?.click()}
              className="mt-4 rounded-lg bg-navy px-5 py-2 text-xs font-semibold text-white hover:bg-navy-light">
              Choisir un fichier CSV
            </button>
          </div>

          {/* PSD2 */}
          <div className="rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-8 text-center">
            <div className="text-3xl mb-2">🏦</div>
            <h2 className="text-sm font-bold text-emerald-900">Connexion banque PSD2</h2>
            <p className="mt-1 text-[11px] text-emerald-900/70">
              Récupère les transactions en direct via l&apos;API Enable Banking.
              SCA bancaire (LuxTrust / app mobile) requise. Lien 90 jours.
            </p>
            {psd2Step === "idle" && (
              <button onClick={openPsd2}
                className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-xs font-semibold text-white hover:bg-emerald-700">
                Connecter une banque
              </button>
            )}
            {psd2Step === "select-bank" && (
              <div className="mt-4 text-left">
                {psd2Enabled === false ? (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-[11px] text-amber-900">
                    PSD2 non configuré côté serveur. Contactez l&apos;administrateur.
                  </div>
                ) : psd2Institutions.length === 0 ? (
                  <div className="text-center text-xs text-muted">Chargement banques…</div>
                ) : (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-slate">
                        Pays :
                        <select value={psd2Country} onChange={(e) => { setPsd2Country(e.target.value); setPsd2Step("idle"); }}
                          className="ml-2 rounded border border-card-border bg-white px-2 py-1 text-[11px]">
                          <option value="LU">Luxembourg</option>
                          <option value="BE">Belgique</option>
                          <option value="FR">France</option>
                          <option value="DE">Allemagne</option>
                          <option value="NL">Pays-Bas</option>
                        </select>
                      </label>
                      <button onClick={() => setPsd2Step("idle")} className="text-[11px] text-muted hover:text-navy">Annuler</button>
                    </div>
                    <div className="max-h-64 overflow-y-auto space-y-1">
                      {psd2Institutions.map((inst) => (
                        <button key={inst.id} onClick={() => connectBank(inst)}
                          className="w-full flex items-center gap-3 rounded-lg border border-card-border bg-white px-3 py-2 text-left hover:border-emerald-400 hover:bg-emerald-50">
                          {inst.logo && <img src={inst.logo} alt="" className="h-6 w-6 object-contain" />}
                          <div className="flex-1">
                            <div className="text-xs font-semibold text-navy">{inst.name}</div>
                            <div className="text-[10px] text-muted font-mono">{inst.bic}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
            {psd2Step === "awaiting-callback" && (
              <div className="mt-4 text-xs text-emerald-900">
                Authentification bancaire en cours…
              </div>
            )}
            {psd2Step === "accounts" && psd2Accounts.length > 0 && (
              <div className="mt-4 text-left">
                <div className="mb-3 flex items-center gap-2">
                  <label className="text-[11px] font-semibold text-slate flex-1">
                    <div>Transactions depuis :</div>
                    <input type="date" value={psd2DateFrom} onChange={(e) => setPsd2DateFrom(e.target.value)}
                      className="mt-1 w-full rounded border border-card-border bg-white px-2 py-1 text-[11px]" />
                  </label>
                </div>
                <div className="text-[11px] font-semibold text-slate mb-1">Comptes disponibles :</div>
                <div className="space-y-1">
                  {psd2Accounts.map((acc) => (
                    <button key={acc.uid} onClick={() => fetchPsd2Transactions(acc.uid)}
                      className="w-full flex items-center justify-between rounded-lg border border-card-border bg-white px-3 py-2 text-left hover:border-emerald-400 hover:bg-emerald-50">
                      <div>
                        <div className="text-xs font-semibold text-navy">{acc.name ?? "Compte"}</div>
                        <div className="text-[10px] text-muted font-mono">{acc.account_id?.iban ?? acc.uid}</div>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold">Importer →</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {psd2Step === "fetching" && (
              <div className="mt-4 text-xs text-emerald-900">Import transactions en cours…</div>
            )}
          </div>
        </div>
      )}

      {/* Résultats rapprochement */}
      {statement && matches.length > 0 && (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-4">
            <Stat label="Transactions" value={String(statement.total)} />
            <Stat label="Matches fiables (≥60)" value={String(matchedCount)} tone="emerald" />
            <Stat label="Matches incertains (30-59)" value={String(uncertainCount)} tone="amber" />
            <Stat label="Non matchés" value={String(unmatchedCount)} tone="rose" />
          </div>

          <div className="mt-5 flex justify-between">
            <button onClick={() => { setStatement(null); setMatches([]); }}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate">
              Changer de fichier
            </button>
            {matchedCount > 0 && (
              <button onClick={applyAll} disabled={applying}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {applying ? "Application…" : `✓ Valider ${matchedCount} rapprochements fiables`}
              </button>
            )}
          </div>

          <div className="mt-5 space-y-2">
            {matches.map((m, i) => {
              const tier = m.match_score >= 60 ? "emerald" : m.match_score >= 30 ? "amber" : "slate";
              return (
                <div key={i} className={`rounded-xl border p-4 ${
                  tier === "emerald" ? "border-emerald-200 bg-emerald-50/30" :
                  tier === "amber" ? "border-amber-200 bg-amber-50/30" :
                  "border-card-border bg-card"
                }`}>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {/* Transaction */}
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Transaction</div>
                      <div className="mt-1 text-lg font-bold text-navy">
                        {m.tx.amount > 0 ? "+" : ""}{formatEUR(m.tx.amount)}
                      </div>
                      <div className="text-xs text-muted">{new Date(m.tx.date).toLocaleDateString("fr-LU")}</div>
                      <div className="mt-1 text-xs">{m.tx.label}</div>
                      {m.tx.reference && (
                        <div className="text-[11px] font-mono text-muted">Réf : {m.tx.reference}</div>
                      )}
                      {m.tx.counterparty && (
                        <div className="text-[11px] text-muted">{m.tx.counterparty}</div>
                      )}
                    </div>

                    {/* Match */}
                    <div>
                      {m.matched_charge ? (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
                              Appel proposé
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                              tier === "emerald" ? "bg-emerald-600 text-white" :
                              "bg-amber-600 text-white"
                            }`}>
                              Score {m.match_score}
                            </span>
                          </div>
                          <div className="mt-1 text-sm font-semibold text-navy">
                            Lot {m.matched_charge.lot_number} — {m.matched_charge.owner_name ?? "?"}
                          </div>
                          <div className="text-xs text-muted">{m.matched_charge.call_label}</div>
                          <div className="text-xs font-mono">
                            Dû : {formatEUR(m.matched_charge.outstanding)}
                            {" · "}
                            Réf : {m.matched_charge.payment_reference ?? "?"}
                          </div>
                          <div className="text-[10px] text-muted italic mt-1">
                            Critères : {m.match_reason}
                          </div>
                          <button onClick={() => applyMatch(m)}
                            className="mt-2 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                            ✓ Marquer payé
                          </button>
                        </>
                      ) : (
                        <div className="text-sm text-rose-700 font-semibold">Aucun appel correspondant</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Conseil :</strong> exportez le relevé CSV depuis votre web banking LU
        (BCEE : Menu &raquo; Extraits &raquo; Export CSV · BIL : Comptes &raquo; Historique &raquo; CSV).
        Les matches avec score ≥ 60 sont fiables (référence exacte + montant).
        Les scores 30–59 demandent une validation manuelle.
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "amber" | "rose" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" :
    tone === "rose" ? "bg-rose-50 border-rose-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "rose" ? "text-rose-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
