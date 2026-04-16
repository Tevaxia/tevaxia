"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import FundsCallPdf from "@/components/FundsCallPdf";
import { getProfile } from "@/lib/profile";
import { getCoownership, listUnits, type Coownership, type CoownershipUnit } from "@/lib/coownerships";
import {
  listCalls, createCall, updateCall, deleteCall,
  listCharges, generateChargesForCall, markChargePaid, resetCharge,
  type CoownershipCall, type UnitCharge, type CallStatus,
} from "@/lib/coownership-finance";
import { formatEUR } from "@/lib/calculations";

const STATUS_LABEL: Record<CallStatus, string> = {
  draft: "Brouillon",
  issued: "Émis",
  partially_paid: "Partiellement réglé",
  paid: "Réglé",
  overdue: "En retard",
  cancelled: "Annulé",
};

const STATUS_COLOR: Record<CallStatus, string> = {
  draft: "bg-slate-100 text-slate-800",
  issued: "bg-blue-100 text-blue-800",
  partially_paid: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  overdue: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-200 text-slate-600",
};

export default function FundsCallsPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [units, setUnits] = useState<CoownershipUnit[]>([]);
  const [calls, setCalls] = useState<CoownershipCall[]>([]);
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [charges, setCharges] = useState<UnitCharge[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showNewCall, setShowNewCall] = useState(false);
  const thisYear = new Date().getFullYear();
  const [draft, setDraft] = useState<Partial<CoownershipCall>>({
    label: `T1 ${thisYear} — Appel provisionnel`,
    period_start: `${thisYear}-01-01`,
    period_end: `${thisYear}-03-31`,
    due_date: `${thisYear}-02-15`,
    total_amount: 0,
    bank_iban: "",
    bank_bic: "",
    bank_account_holder: "",
    payment_reference_template: "COPRO-{lot}-{period}",
  });

  const refresh = async () => {
    try {
      const [c, u, cs] = await Promise.all([getCoownership(id), listUnits(id), listCalls(id)]);
      setCoown(c); setUnits(u); setCalls(cs);
      if (activeCallId && cs.find((x) => x.id === activeCallId)) {
        setCharges(await listCharges(activeCallId));
      } else if (cs.length > 0) {
        setActiveCallId(cs[0].id);
        setCharges(await listCharges(cs[0].id));
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  useEffect(() => {
    if (!activeCallId) return;
    listCharges(activeCallId).then(setCharges).catch(() => setCharges([]));
  }, [activeCallId]);

  const handleCreateCall = async () => {
    if (!draft.label || !draft.period_start || !draft.period_end || !draft.due_date) return;
    try {
      const created = await createCall({
        coownership_id: id,
        label: draft.label,
        period_start: draft.period_start,
        period_end: draft.period_end,
        due_date: draft.due_date,
        total_amount: draft.total_amount ?? 0,
        budget_share_pct: null,
        bank_iban: draft.bank_iban ?? null,
        bank_bic: draft.bank_bic ?? null,
        bank_account_holder: draft.bank_account_holder ?? null,
        payment_reference_template: draft.payment_reference_template ?? "COPRO-{lot}-{period}",
        notes: null,
        status: "draft",
      });
      setShowNewCall(false);
      setActiveCallId(created.id);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleGenerate = async (callId: string) => {
    try {
      const n = await generateChargesForCall(callId);
      setCharges(await listCharges(callId));
      alert(`${n} charges générées selon les tantièmes.`);
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur génération"); }
  };

  const handleIssue = async (callId: string) => {
    if (!confirm("Émettre cet appel de fonds ? Il deviendra officiel et les charges seront appelées.")) return;
    try {
      await updateCall(callId, { status: "issued" });
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!confirm("Supprimer cet appel de fonds ? Toutes les charges associées seront perdues.")) return;
    try {
      await deleteCall(callId);
      if (activeCallId === callId) setActiveCallId(null);
      await refresh();
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleMarkPaid = async (chargeId: string, amount: number) => {
    try {
      await markChargePaid(chargeId, amount, "virement");
      if (activeCallId) setCharges(await listCharges(activeCallId));
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const handleReset = async (chargeId: string) => {
    try {
      await resetCharge(chargeId);
      if (activeCallId) setCharges(await listCharges(activeCallId));
    } catch (e) { setError(e instanceof Error ? e.message : "Erreur"); }
  };

  const downloadCallPdf = async (call: CoownershipCall, unit: CoownershipUnit, charge: UnitCharge) => {
    if (!coown) return;
    const profile = getProfile();
    const blob = await pdf(
      <FundsCallPdf
        coownership={{ name: coown.name, address: coown.address, commune: coown.commune, total_tantiemes: coown.total_tantiemes }}
        syndic={{
          name: profile.nomComplet || profile.societe || "Syndic",
          address: profile.adresse,
          email: profile.email,
          phone: profile.telephone,
        }}
        call={call}
        unit={unit}
        charge={charge}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appel-${unit.lot_number}-${call.period_start.slice(0, 7)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllPdfs = async (call: CoownershipCall) => {
    for (const charge of charges) {
      const unit = units.find((u) => u.id === charge.unit_id);
      if (unit) await downloadCallPdf(call, unit, charge);
    }
  };

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;

  const activeCall = calls.find((c) => c.id === activeCallId) ?? null;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">← {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Appels de fonds</h1>
        <p className="mt-1 text-sm text-muted">
          Génération et suivi des appels de fonds par période. Répartition automatique selon les tantièmes.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">Appels émis</h2>
          <button onClick={() => setShowNewCall(!showNewCall)}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {showNewCall ? "Annuler" : "+ Nouvel appel"}
          </button>
        </div>

        {showNewCall && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="text" placeholder="Libellé (ex. T1 2026)" value={draft.label ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-2" />
              <input type="number" placeholder="Montant total (€)" value={draft.total_amount || ""}
                onChange={(e) => setDraft((p) => ({ ...p, total_amount: Number(e.target.value) || 0 }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <div><label className="block text-xs text-muted mb-1">Début période</label>
                <input type="date" value={draft.period_start ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_start: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">Fin période</label>
                <input type="date" value={draft.period_end ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_end: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">Échéance paiement</label>
                <input type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <input type="text" placeholder="IBAN (LUxx xxxx xxxx xxxx xxxx)" value={draft.bank_iban ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_iban: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono sm:col-span-2" />
              <input type="text" placeholder="BIC" value={draft.bank_bic ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_bic: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
              <input type="text" placeholder="Titulaire du compte" value={draft.bank_account_holder ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_account_holder: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-3" />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleCreateCall}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                Créer l&apos;appel (brouillon)
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Liste appels */}
          <div className="space-y-2">
            {calls.length === 0 && <div className="rounded-xl border border-dashed border-card-border bg-card p-6 text-center text-sm text-muted">Aucun appel. Créez-en un.</div>}
            {calls.map((c) => (
              <button key={c.id} onClick={() => setActiveCallId(c.id)}
                className={`w-full text-left rounded-xl border bg-card p-4 transition-colors ${activeCallId === c.id ? "border-navy ring-1 ring-navy" : "border-card-border hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy truncate">{c.label}</div>
                    <div className="mt-0.5 text-xs text-muted">{formatEUR(c.total_amount)} · échéance {new Date(c.due_date).toLocaleDateString("fr-LU")}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Détail appel sélectionné */}
          <div>
            {activeCall && (
              <div className="rounded-xl border border-card-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-navy">{activeCall.label}</div>
                    <div className="mt-1 text-xs text-muted">
                      du {new Date(activeCall.period_start).toLocaleDateString("fr-LU")} au {new Date(activeCall.period_end).toLocaleDateString("fr-LU")}
                      {" · "}échéance {new Date(activeCall.due_date).toLocaleDateString("fr-LU")}
                    </div>
                    <div className="mt-1 text-lg font-bold text-navy">{formatEUR(activeCall.total_amount)}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLOR[activeCall.status]}`}>{STATUS_LABEL[activeCall.status]}</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {activeCall.status === "draft" && (
                    <>
                      <button onClick={() => handleGenerate(activeCall.id)}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700">
                        Générer les charges par lot
                      </button>
                      {charges.length > 0 && (
                        <button onClick={() => handleIssue(activeCall.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          Émettre l&apos;appel
                        </button>
                      )}
                    </>
                  )}
                  {charges.length > 0 && (
                    <button onClick={() => downloadAllPdfs(activeCall)}
                      className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                      Télécharger tous les PDFs
                    </button>
                  )}
                  <button onClick={() => handleDeleteCall(activeCall.id)}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50">
                    Supprimer
                  </button>
                </div>

                {/* Tableau charges */}
                {charges.length > 0 && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                          <th className="px-2 py-2">Lot</th>
                          <th className="px-2 py-2">Copropriétaire</th>
                          <th className="px-2 py-2 text-right">Tantièmes</th>
                          <th className="px-2 py-2 text-right">Montant dû</th>
                          <th className="px-2 py-2 text-right">Payé</th>
                          <th className="px-2 py-2">Référence</th>
                          <th className="px-2 py-2"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-card-border/50">
                        {charges.map((ch) => {
                          const unit = units.find((u) => u.id === ch.unit_id);
                          if (!unit) return null;
                          const fullyPaid = ch.amount_paid >= ch.amount_due && ch.amount_due > 0;
                          return (
                            <tr key={ch.id} className={fullyPaid ? "bg-emerald-50/40" : ""}>
                              <td className="px-2 py-2 font-medium text-navy">{unit.lot_number}</td>
                              <td className="px-2 py-2">{unit.owner_name || "—"}</td>
                              <td className="px-2 py-2 text-right font-mono">{unit.tantiemes.toLocaleString("fr-LU")}</td>
                              <td className="px-2 py-2 text-right font-mono">{ch.amount_due.toFixed(2)}</td>
                              <td className={`px-2 py-2 text-right font-mono ${fullyPaid ? "text-emerald-700 font-semibold" : "text-muted"}`}>
                                {ch.amount_paid.toFixed(2)}
                              </td>
                              <td className="px-2 py-2 font-mono text-[10px]">{ch.payment_reference}</td>
                              <td className="px-2 py-2 text-right space-x-1">
                                {!fullyPaid ? (
                                  <button onClick={() => handleMarkPaid(ch.id, ch.amount_due)}
                                    className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[10px] font-medium text-emerald-800 hover:bg-emerald-100">
                                    Marquer payé
                                  </button>
                                ) : (
                                  <button onClick={() => handleReset(ch.id)}
                                    className="rounded-md border border-card-border bg-white px-2 py-1 text-[10px] font-medium text-muted hover:bg-slate-50">
                                    Réinit.
                                  </button>
                                )}
                                <button onClick={() => downloadCallPdf(activeCall, unit, ch)}
                                  className="rounded-md border border-card-border bg-white px-2 py-1 text-[10px] font-medium text-navy hover:bg-slate-50">
                                  PDF
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {charges.length === 0 && activeCall.status === "draft" && (
                  <p className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                    Cliquez sur « Générer les charges par lot » pour répartir automatiquement le montant total selon les tantièmes de chaque lot.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
