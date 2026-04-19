"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import FundsCallPdf from "@/components/FundsCallPdf";
import { getProfile } from "@/lib/profile";
import { getCoownership, listUnits, type Coownership, type CoownershipUnit } from "@/lib/coownerships";
import {
  listCalls, createCall, updateCall, deleteCall,
  listCharges, generateChargesForCall, markChargePaid, resetCharge,
  type CoownershipCall, type UnitCharge, type CallStatus, type CallNature,
} from "@/lib/coownership-finance";
import { listAllocationKeys, type AllocationKey } from "@/lib/coownership-allocations";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";
import { buildCoproFacturX } from "@/lib/facturation/factur-x-syndic-builder";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";
import { track, captureError } from "@/lib/analytics";

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
  const t = useTranslations("syndicAppels");
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const STATUS_LABEL: Record<CallStatus, string> = {
    draft: t("statusDraft"),
    issued: t("statusIssued"),
    partially_paid: t("statusPartiallyPaid"),
    paid: t("statusPaid"),
    overdue: t("statusOverdue"),
    cancelled: t("statusCancelled"),
  };

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [units, setUnits] = useState<CoownershipUnit[]>([]);
  const [calls, setCalls] = useState<CoownershipCall[]>([]);
  const [keys, setKeys] = useState<AllocationKey[]>([]);
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
    allocation_key_id: null,
    nature: "courantes",
  });

  const refresh = async () => {
    try {
      const [c, u, cs, ks] = await Promise.all([getCoownership(id), listUnits(id), listCalls(id), listAllocationKeys(id)]);
      setCoown(c); setUnits(u); setCalls(cs); setKeys(ks);
      if (activeCallId && cs.find((x) => x.id === activeCallId)) {
        setCharges(await listCharges(activeCallId));
      } else if (cs.length > 0) {
        setActiveCallId(cs[0].id);
        setCharges(await listCharges(cs[0].id));
      }
    } catch (e) { setError(errMsg(e, t("error"))); }
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
        allocation_key_id: draft.allocation_key_id ?? null,
        nature: draft.nature ?? "courantes",
      });
      setShowNewCall(false);
      setActiveCallId(created.id);
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleGenerate = async (callId: string) => {
    try {
      const n = await generateChargesForCall(callId);
      setCharges(await listCharges(callId));
      alert(`${n} ${t("chargesGenerated")}`);
    } catch (e) { setError(errMsg(e, t("errorGeneration"))); }
  };

  const handleIssue = async (callId: string) => {
    if (!confirm(t("confirmIssue"))) return;
    try {
      await updateCall(callId, { status: "issued" });
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleDeleteCall = async (callId: string) => {
    if (!confirm(t("confirmDeleteCall"))) return;
    try {
      await deleteCall(callId);
      if (activeCallId === callId) setActiveCallId(null);
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleMarkPaid = async (chargeId: string, amount: number) => {
    try {
      await markChargePaid(chargeId, amount, "virement");
      if (activeCallId) setCharges(await listCharges(activeCallId));
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleReset = async (chargeId: string) => {
    try {
      await resetCharge(chargeId);
      if (activeCallId) setCharges(await listCharges(activeCallId));
    } catch (e) { setError(errMsg(e, t("error"))); }
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

  const downloadFacturX = async (call: CoownershipCall, unit: CoownershipUnit, charge: UnitCharge) => {
    if (!coown) return;
    const profile = getProfile();
    const inv = buildCoproFacturX({
      call: {
        id: call.id, label: call.label,
        period_start: call.period_start, period_end: call.period_end, due_date: call.due_date,
        bank_iban: call.bank_iban, bank_bic: call.bank_bic, bank_account_holder: call.bank_account_holder,
      },
      charge: { id: charge.id, amount_due: charge.amount_due, payment_reference: charge.payment_reference ?? "" },
      unit: { lot_number: unit.lot_number, owner_name: unit.owner_name, tantiemes: unit.tantiemes },
      coownership: {
        name: coown.name, address: coown.address, commune: coown.commune,
        total_tantiemes: coown.total_tantiemes,
      },
      syndic: {
        name: profile.nomComplet || profile.societe || "Syndic",
        address: profile.adresse, country_code: "LU",
      },
    });
    const artifacts = await generateFacturXPdf(inv);
    const blob = new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = artifacts.pdfFilename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAllFacturX = async (call: CoownershipCall) => {
    if (!coown) return;
    let count = 0;
    try {
      for (const charge of charges) {
        const unit = units.find((u) => u.id === charge.unit_id);
        if (unit) {
          await downloadFacturX(call, unit, charge);
          count++;
          // small delay so browser doesn't throttle multi-downloads
          await new Promise((r) => setTimeout(r, 200));
        }
      }
      track("syndic_facturx_batch", { call_id: call.id, nb_invoices: count, total_amount: call.total_amount });
    } catch (e) {
      captureError(e, { module: "syndic_facturx_batch", call_id: call.id, partial_count: count });
      setError(errMsg(e, t("error")));
    }
  };

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;

  const activeCall = calls.find((c) => c.id === activeCallId) ?? null;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">&larr; {coown.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>

        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">{t("callsIssued")}</h2>
          <button onClick={() => setShowNewCall(!showNewCall)}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {showNewCall ? t("cancel") : t("newCall")}
          </button>
        </div>

        {showNewCall && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="text" placeholder={t("placeholderLabel")} value={draft.label ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, label: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-2" />
              <input type="number" placeholder={t("placeholderAmount")} value={draft.total_amount || ""}
                onChange={(e) => setDraft((p) => ({ ...p, total_amount: Number(e.target.value) || 0 }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <div><label className="block text-xs text-muted mb-1">{t("periodStart")}</label>
                <input type="date" value={draft.period_start ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_start: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">{t("periodEnd")}</label>
                <input type="date" value={draft.period_end ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_end: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">{t("paymentDue")}</label>
                <input type="date" value={draft.due_date ?? ""} onChange={(e) => setDraft((p) => ({ ...p, due_date: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <input type="text" placeholder={t("placeholderIban")} value={draft.bank_iban ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_iban: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono sm:col-span-2" />
              <input type="text" placeholder={t("placeholderBic")} value={draft.bank_bic ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_bic: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
              <input type="text" placeholder={t("placeholderHolder")} value={draft.bank_account_holder ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, bank_account_holder: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-3" />

              <div className="sm:col-span-2">
                <label className="block text-xs text-muted mb-1">Clé de répartition</label>
                <select value={draft.allocation_key_id ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, allocation_key_id: e.target.value || null }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                  <option value="">Tantièmes généraux (par défaut)</option>
                  {keys.filter((k) => k.code !== "tantiemes_generaux").map((k) => (
                    <option key={k.id} value={k.id}>{k.label}{k.total_shares > 0 ? "" : " (aucune part définie)"}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs text-muted mb-1">Nature</label>
                <select value={draft.nature ?? "courantes"}
                  onChange={(e) => setDraft((p) => ({ ...p, nature: e.target.value as CallNature }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                  <option value="courantes">Charges courantes</option>
                  <option value="travaux">Travaux</option>
                  <option value="fonds_travaux">Fonds travaux</option>
                  <option value="exceptionnel">Exceptionnel</option>
                </select>
              </div>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleCreateCall}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {t("createDraft")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_2fr]">
          {/* Calls list */}
          <div className="space-y-2">
            {calls.length === 0 && <div className="rounded-xl border border-dashed border-card-border bg-card p-6 text-center text-sm text-muted">{t("noCalls")}</div>}
            {calls.map((c) => (
              <button key={c.id} onClick={() => setActiveCallId(c.id)}
                className={`w-full text-left rounded-xl border bg-card p-4 transition-colors ${activeCallId === c.id ? "border-navy ring-1 ring-navy" : "border-card-border hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-navy truncate">{c.label}</div>
                    <div className="mt-0.5 text-xs text-muted">{formatEUR(c.total_amount)} · {t("dueDate")} {new Date(c.due_date).toLocaleDateString("fr-LU")}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[c.status]}`}>{STATUS_LABEL[c.status]}</span>
                </div>
              </button>
            ))}
          </div>

          {/* Selected call detail */}
          <div>
            {activeCall && (
              <div className="rounded-xl border border-card-border bg-card p-5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-navy">{activeCall.label}</div>
                    <div className="mt-1 text-xs text-muted">
                      {t("fromDate")} {new Date(activeCall.period_start).toLocaleDateString("fr-LU")} {t("toDate")} {new Date(activeCall.period_end).toLocaleDateString("fr-LU")}
                      {" · "}{t("dueDate")} {new Date(activeCall.due_date).toLocaleDateString("fr-LU")}
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
                        {t("generateCharges")}
                      </button>
                      {charges.length > 0 && (
                        <button onClick={() => handleIssue(activeCall.id)}
                          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
                          {t("issueCall")}
                        </button>
                      )}
                    </>
                  )}
                  {charges.length > 0 && (
                    <>
                      <button onClick={() => downloadAllPdfs(activeCall)}
                        className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
                        {t("downloadAllPdfs")}
                      </button>
                      <button onClick={() => downloadAllFacturX(activeCall)}
                        className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 hover:bg-amber-100"
                        title="Génère N Factur-X EN 16931 (1 par copropriétaire) pour transmission e-invoicing">
                        ⚡ Factur-X (×{charges.length})
                      </button>
                    </>
                  )}
                  <button onClick={() => handleDeleteCall(activeCall.id)}
                    className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-medium text-rose-700 hover:bg-rose-50">
                    {t("deleteButton")}
                  </button>
                </div>

                {/* Charges table */}
                {charges.length > 0 && (
                  <div className="mt-5 overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-card-border text-left text-[10px] uppercase tracking-wider text-muted">
                          <th className="px-2 py-2">{t("thLot")}</th>
                          <th className="px-2 py-2">{t("thOwner")}</th>
                          <th className="px-2 py-2 text-right">{t("thTantiemes")}</th>
                          <th className="px-2 py-2 text-right">{t("thAmountDue")}</th>
                          <th className="px-2 py-2 text-right">{t("thPaid")}</th>
                          <th className="px-2 py-2">{t("thReference")}</th>
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
                              <td className="px-2 py-2">{unit.owner_name || "\u2014"}</td>
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
                                    {t("markPaid")}
                                  </button>
                                ) : (
                                  <button onClick={() => handleReset(ch.id)}
                                    className="rounded-md border border-card-border bg-white px-2 py-1 text-[10px] font-medium text-muted hover:bg-slate-50">
                                    {t("reset")}
                                  </button>
                                )}
                                <button onClick={() => downloadCallPdf(activeCall, unit, ch)}
                                  className="rounded-md border border-card-border bg-white px-2 py-1 text-[10px] font-medium text-navy hover:bg-slate-50">
                                  PDF
                                </button>
                                <button onClick={() => downloadFacturX(activeCall, unit, ch)}
                                  className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[10px] font-medium text-amber-900 hover:bg-amber-100"
                                  title="Génère Factur-X EN 16931 (PDF/A-3 + XML embarqué)">
                                  ⚡ Factur-X
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
                    {t("generateHint")}
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
