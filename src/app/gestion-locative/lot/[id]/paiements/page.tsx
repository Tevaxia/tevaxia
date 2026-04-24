"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import RentReceiptPdf from "@/components/RentReceiptPdf";
import { getProfile } from "@/lib/profile";
import { getLot, type RentalLot } from "@/lib/gestion-locative";
import {
  listPaymentsForLot, upsertPayment, markPaid, seedYear, deletePayment,
  type RentalPayment,
} from "@/lib/rental-payments";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const STATUS_COLOR: Record<string, string> = {
  due: "bg-amber-100 text-amber-800",
  partial: "bg-orange-100 text-orange-800",
  paid: "bg-emerald-100 text-emerald-800",
  late: "bg-rose-100 text-rose-800",
  cancelled: "bg-slate-100 text-slate-600",
};

export default function PaymentsPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("paiementsLocatifs");
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");
  const thisYear = new Date().getFullYear();

  const MONTHS = [
    t("month1"), t("month2"), t("month3"), t("month4"),
    t("month5"), t("month6"), t("month7"), t("month8"),
    t("month9"), t("month10"), t("month11"), t("month12"),
  ];

  const STATUS_LABEL: Record<string, string> = {
    due: t("statusDue"),
    partial: t("statusPartial"),
    paid: t("statusPaid"),
    late: t("statusLate"),
    cancelled: t("statusCancelled"),
  };

  const [lot, setLot] = useState<RentalLot | null>(null);
  const [payments, setPayments] = useState<RentalPayment[]>([]);
  const [selectedYear, setSelectedYear] = useState(thisYear);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState(0);

  const refresh = async () => {
    if (!id) return;
    try {
      const l = getLot(id);
      setLot(l);
      const ps = await listPaymentsForLot(id);
      setPayments(ps);
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  if (!lot) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;

  const yearPayments = payments.filter((p) => p.period_year === selectedYear);
  const byMonth = new Map<number, RentalPayment>();
  for (const p of yearPayments) byMonth.set(p.period_month, p);

  const totalExpected = lot.loyerMensuelActuel * 12 + lot.chargesMensuelles * 12;
  const totalPaid = yearPayments
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + p.amount_total, 0);

  const handleSeedYear = async () => {
    if (!confirm(t("confirmSeed", { year: selectedYear, rent: formatEUR(lot.loyerMensuelActuel), charges: formatEUR(lot.chargesMensuelles) }))) return;
    try {
      await seedYear(id, selectedYear, lot.loyerMensuelActuel, lot.chargesMensuelles);
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleCreateMonth = async (month: number) => {
    try {
      await upsertPayment({
        lot_id: id,
        period_year: selectedYear,
        period_month: month,
        amount_rent: lot.loyerMensuelActuel,
        amount_charges: lot.chargesMensuelles,
      });
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleMarkPaid = async (paymentId: string) => {
    try { await markPaid(paymentId); await refresh(); }
    catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleDelete = async (paymentId: string) => {
    if (!confirm(t("confirmDelete"))) return;
    try { await deletePayment(paymentId); await refresh(); }
    catch (e) { setError(errMsg(e, t("error"))); }
  };

  const handleSaveEdit = async (payment: RentalPayment) => {
    try {
      await upsertPayment({
        id: payment.id,
        lot_id: id,
        period_year: payment.period_year,
        period_month: payment.period_month,
        amount_rent: editAmount - payment.amount_charges,
        amount_charges: payment.amount_charges,
      });
      setEditingId(null);
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const prefillFacturX = (payment: RentalPayment, monthIdx: number) => {
    if (!lot) return;
    const profile = getProfile();
    const monthLabel = MONTHS[monthIdx - 1];
    const now = new Date(selectedYear, monthIdx - 1, 1);
    const due = new Date(selectedYear, monthIdx - 1, 5);
    const invNum = `LOY-${selectedYear}-${String(monthIdx).padStart(2, "0")}-${lot.name.replace(/[^A-Za-z0-9]/g, "").slice(0, 6).toUpperCase()}`;
    const draft = {
      profile: "BASIC",
      document_type: "380",
      invoice_number: invNum,
      issue_date: now.toISOString().slice(0, 10),
      due_date: due.toISOString().slice(0, 10),
      currency: "EUR",
      seller: {
        name: profile.nomComplet || "Bailleur",
        address_line1: profile.adresse ?? "",
        country_code: "FR",
      },
      buyer: {
        name: lot.tenantName ?? "Locataire",
        address_line1: lot.address ?? "",
        city: lot.commune ?? "",
        country_code: "FR",
      },
      lines: [
        {
          id: "1",
          name: `Loyer ${monthLabel} ${selectedYear}`,
          quantity: 1,
          unit_code: "MON",
          unit_price_net: payment.amount_rent,
          vat_category: "E",
          vat_rate_percent: 0,
        },
        ...(payment.amount_charges > 0 ? [{
          id: "2",
          name: `Charges ${monthLabel} ${selectedYear}`,
          quantity: 1,
          unit_code: "MON",
          unit_price_net: payment.amount_charges,
          vat_category: "E",
          vat_rate_percent: 0,
        }] : []),
      ],
      notes: ["Loyer d'habitation — exempt TVA art. 261 D CGI"],
      payment_terms: "Paiement avant le 5 du mois",
    };
    try { localStorage.setItem("tevaxia-facturation-draft", JSON.stringify(draft)); } catch {}
    window.location.href = `${lp}/facturation/emission`;
  };

  const downloadReceipt = async (payment: RentalPayment) => {
    const profile = getProfile();
    const blob = await pdf(
      <RentReceiptPdf
        lot={lot}
        landlord={{
          name: profile.nomComplet || "Bailleur",
          address: profile.adresse,
          email: profile.email,
          phone: profile.telephone,
        }}
        payment={payment}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = lot.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `quittance-${safeName}-${payment.period_year}-${String(payment.period_month).padStart(2, "0")}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/gestion-locative/lot/${id}`} className="text-xs text-muted hover:text-navy">&larr; {lot.name}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("subtitle")}
        </p>

        {/* KPIs + year selector */}
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            {[thisYear - 2, thisYear - 1, thisYear, thisYear + 1].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button onClick={handleSeedYear}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {t("generateYear")} {selectedYear}
          </button>
          <button onClick={async () => {
            const { createTenantToken, buildTenantPortalUrl } = await import("@/lib/tenant-portal");
            try {
              const tok = await createTenantToken({ lot_id: id, tenant_name: null, tenant_email: null, expires_in_days: 365 });
              const url = buildTenantPortalUrl(tok.token);
              await navigator.clipboard.writeText(url);
              alert(t("tenantPortalCopied", { url }));
            } catch (err) {
              alert(t("errCopyGeneric", { msg: err instanceof Error ? err.message : t("errUnknown") }));
            }
          }}
            className="rounded-lg bg-gradient-to-r from-teal-600 to-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:from-teal-700 hover:to-cyan-700">
            {t("tenantPortalBtn")}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiExpected")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalExpected)}</div>
            <div className="mt-0.5 text-xs text-muted">{t("kpiExpectedDetail")} {formatEUR(lot.loyerMensuelActuel + lot.chargesMensuelles)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiCollected")} {selectedYear}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(totalPaid)}</div>
            <div className="mt-0.5 text-xs text-muted">{yearPayments.filter((p) => p.status === "paid").length} {t("kpiMonths")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiRemaining")}</div>
            <div className="mt-1 text-2xl font-bold text-amber-700">{formatEUR(totalExpected - totalPaid)}</div>
            <div className="mt-0.5 text-xs text-muted">{yearPayments.filter((p) => p.status !== "paid").length} {t("kpiPending")}</div>
          </div>
        </div>

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {/* Graphique cumul paiements */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
          <h3 className="text-base font-semibold text-navy">{t("cumTitle", { year: selectedYear })}</h3>
          <p className="mt-0.5 text-xs text-muted mb-3">{t("cumSubtitle")}</p>
          {(() => {
            const monthLabels = [t("month1Short"),t("month2Short"),t("month3Short"),t("month4Short"),t("month5Short"),t("month6Short"),t("month7Short"),t("month8Short"),t("month9Short"),t("month10Short"),t("month11Short"),t("month12Short")];
            const expectedMonthly = lot.loyerMensuelActuel + lot.chargesMensuelles;
            let cumPaid = 0;
            let cumExpected = 0;
            const data = Array.from({ length: 12 }, (_, i) => {
              const m = i + 1;
              cumExpected += expectedMonthly;
              const p = byMonth.get(m);
              if (p?.status === "paid") {
                cumPaid += Number(p.amount_total);
              }
              return {
                month: monthLabels[i],
                paid: Math.round(cumPaid),
                expected: Math.round(cumExpected),
              };
            });
            const maxY = Math.max(cumExpected, 1);
            return (
              <div className="space-y-2">
                {data.map((d) => {
                  const pctPaid = (d.paid / maxY) * 100;
                  const pctExpected = (d.expected / maxY) * 100;
                  const ontrack = d.paid >= d.expected * 0.95;
                  return (
                    <div key={d.month} className="flex items-center gap-2 text-xs">
                      <div className="w-8 shrink-0 text-muted">{d.month}</div>
                      <div className="relative flex-1 h-5 rounded bg-background border border-card-border/40 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-navy/20"
                          style={{ width: `${pctExpected}%` }}
                        />
                        <div
                          className={`absolute inset-y-0 left-0 ${ontrack ? "bg-emerald-500" : "bg-amber-500"}`}
                          style={{ width: `${pctPaid}%` }}
                        />
                      </div>
                      <div className="w-24 shrink-0 text-right font-mono text-[10px] tabular-nums">
                        {formatEUR(d.paid)} / {formatEUR(d.expected)}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-3 flex items-center gap-4 text-[10px] text-muted">
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-navy/20" /> {t("legendDue")}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-emerald-500" /> {t("legendPaidOnTime")}</span>
                  <span className="flex items-center gap-1.5"><span className="inline-block h-2.5 w-4 rounded bg-amber-500" /> {t("legendPaidLate")}</span>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Month-by-month table */}
        <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2">{t("thMonth")}</th>
                <th className="px-4 py-2 text-right">{t("thAmount")}</th>
                <th className="px-4 py-2">{t("thStatus")}</th>
                <th className="px-4 py-2">{t("thPaymentDate")}</th>
                <th className="px-4 py-2">{t("thMethod")}</th>
                <th className="px-4 py-2 text-right">{t("thActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                const p = byMonth.get(m);
                if (!p) {
                  return (
                    <tr key={m} className="opacity-60">
                      <td className="px-4 py-2 font-medium text-navy">{MONTHS[m - 1]} {selectedYear}</td>
                      <td className="px-4 py-2 text-right text-muted">&mdash;</td>
                      <td className="px-4 py-2"><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">{t("statusNotCreated")}</span></td>
                      <td className="px-4 py-2 text-muted">&mdash;</td>
                      <td className="px-4 py-2 text-muted">&mdash;</td>
                      <td className="px-4 py-2 text-right">
                        <button onClick={() => handleCreateMonth(m)}
                          className="rounded-md bg-navy/10 px-2 py-1 text-[11px] font-medium text-navy hover:bg-navy/20">
                          {t("create")}
                        </button>
                      </td>
                    </tr>
                  );
                }
                const isEditing = editingId === p.id;
                return (
                  <tr key={p.id} className={p.status === "paid" ? "bg-emerald-50/40" : ""}>
                    <td className="px-4 py-2 font-medium text-navy">{MONTHS[m - 1]} {selectedYear}</td>
                    <td className="px-4 py-2 text-right">
                      {isEditing ? (
                        <input type="number" value={editAmount} onChange={(e) => setEditAmount(Number(e.target.value) || 0)}
                          className="w-24 rounded border border-input-border bg-input-bg px-2 py-0.5 text-right text-sm" />
                      ) : formatEUR(p.amount_total)}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLOR[p.status]}`}>
                        {STATUS_LABEL[p.status]}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-xs">{p.paid_at ? new Date(p.paid_at).toLocaleDateString("fr-LU") : "\u2014"}</td>
                    <td className="px-4 py-2 text-xs">{p.payment_method ?? "\u2014"}</td>
                    <td className="px-4 py-2 text-right space-x-1">
                      {isEditing ? (
                        <>
                          <button onClick={() => handleSaveEdit(p)}
                            className="rounded-md bg-emerald-600 text-white px-2 py-1 text-[11px] font-semibold hover:bg-emerald-700">OK</button>
                          <button onClick={() => setEditingId(null)}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] text-slate-700 hover:bg-slate-50">{t("cancel")}</button>
                        </>
                      ) : (
                        <>
                          {p.status !== "paid" && (
                            <button onClick={() => handleMarkPaid(p.id)}
                              className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-1 text-[11px] font-medium text-emerald-800 hover:bg-emerald-100">
                              {t("markPaid")}
                            </button>
                          )}
                          {p.status === "paid" && (
                            <button onClick={() => downloadReceipt(p)}
                              className="rounded-md bg-blue-50 border border-blue-200 px-2 py-1 text-[11px] font-medium text-blue-800 hover:bg-blue-100">
                              {t("receiptPdf")}
                            </button>
                          )}
                          <button onClick={() => prefillFacturX(p, m)}
                            className="rounded-md bg-amber-50 border border-amber-200 px-2 py-1 text-[11px] font-medium text-amber-900 hover:bg-amber-100"
                            title={t("facturxTitle")}>
                            Factur-X
                          </button>
                          <button onClick={() => { setEditingId(p.id); setEditAmount(p.amount_total); }}
                            className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                            {t("edit")}
                          </button>
                          <button onClick={() => handleDelete(p.id)}
                            className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title={t("deleteTitle")}>
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9" />
                            </svg>
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("legalNote")}</strong>
        </div>
      </div>
    </div>
  );
}
