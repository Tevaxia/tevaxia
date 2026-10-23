"use client";

import { useEffect, useState, use, useCallback, useRef } from "react";
import Link from "@/components/LocaleLink";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listInvoices, issueInvoice, markInvoicePaid } from "@/lib/pms/invoices";
import type { PmsProperty, PmsInvoice } from "@/lib/pms/types";
import { prepareInvoiceRecord, INVOICE_RECORD_LABEL_KEYS } from "@/lib/pms/invoice-record";
import { invoiceDocumentTotals } from "@/lib/pms/invoice-status";

function InvoicesScreen(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const t = useTranslations("pms.invoices");
  const tr = useTranslations("pmsInvoiceRecord");
  const locale = useLocale();
  const formatEUR = (n: number, currency: string) => new Intl.NumberFormat(locale === "lb" ? "de-LU" : locale, { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
  const prefix = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [invoices, setInvoices] = useState<PmsInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actionLock = useRef(false);
  const [busy, setBusy] = useState<string | null>(null);
  const exportLock = useRef(false);
  const [exporting, setExporting] = useState<string | null>(null);
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const reload = useCallback(async () => {
    if (!user) return;
    const current = ++request.current;
    setLoading(true); setError(null);
    try {
      const [p, inv] = await Promise.all([getProperty(propertyId), listInvoices(propertyId, user.id)]);
      if (!p) throw new Error("Property unavailable");
      if (current !== request.current) return;
      setProperty(p); setInvoices(inv);
    } catch {
      if (current === request.current) { setProperty(null); setInvoices([]); setError(t("loadError")); }
    } finally { if (current === request.current) setLoading(false); }
  }, [propertyId, user, t]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleDownloadPdf = async (inv: PmsInvoice) => {
    if (!property || exportLock.current || actionLock.current) return;
    exportLock.current = true; setExporting(inv.id); setError(null);
    const current = request.current;
    try {
      const record = prepareInvoiceRecord(inv, property);
      const labels = Object.fromEntries(INVOICE_RECORD_LABEL_KEYS.map(key => [key, tr(key)]));
      const { generatePmsInvoiceBlob } = await import("@/components/PmsInvoicePdf");
      const blob = await generatePmsInvoiceBlob(record, labels, locale, new Date().toISOString());
      if (current !== request.current) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `releve-${inv.id}.pdf`; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch { if (current === request.current) setError(tr("downloadError")); }
    finally { exportLock.current = false; setExporting(null); }
  };

  const handleStatus = async (inv: PmsInvoice, status: "issued" | "paid") => {
    if (!user || actionLock.current || exportLock.current) return;
    if (status === "issued" && !confirm(t("confirmIssue", { number: inv.invoice_number }))) return;
    actionLock.current = true; setBusy(inv.id); setError(null);
    const current = request.current;
    try {
      const input = { id: inv.id, propertyId, userId: user.id, updatedAt: inv.updated_at, invoiceNumber: inv.invoice_number };
      if (status === "issued") await issueInvoice(input); else await markInvoicePaid(input);
      if (current === request.current) await reload();
    } catch { if (current === request.current) setError(t("statusError")); }
    finally { actionLock.current = false; setBusy(null); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (error && !property) return <div className="p-6"><h1 className="break-words text-2xl font-bold">{t("title")}</h1><p role="alert" className="mt-3">{error}</p><button className="mt-3 underline" onClick={() => { void reload(); }}>{t("retry")}</button></div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;

  const totals = invoiceDocumentTotals(invoices);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`${prefix}/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 break-words text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("intro")}</p>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900"><p role="alert">{error}</p><button className="mt-2 underline" disabled={busy !== null || exporting !== null} onClick={() => { void reload(); }}>{t("retry")}</button></div>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-xs text-muted">{t("kpiTotal")}</div>
          <div className="text-xl font-bold text-navy">{invoices.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-xs text-muted">{t("kpiIssued")}</div>
          <div className="text-xl font-bold text-navy">{totals.length ? totals.map(row => <div key={`${row.type}:${row.currency}`} className="mt-2"><div className="text-xs font-normal">{tr(row.type)}</div>{formatEUR(row.issued, row.currency)}</div>) : "—"}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-800">{t("kpiCollected")}</div>
          <div className="text-xl font-bold text-emerald-900">{totals.length ? totals.map(row => <div key={`${row.type}:${row.currency}`} className="mt-2"><div className="text-xs font-normal">{tr(row.type)}</div>{formatEUR(row.paid, row.currency)}</div>) : "—"}</div>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-card-border bg-card p-3">
        {invoices.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">{t("empty")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colNumber")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{tr("type")}</th><th className="py-2 px-2 text-left font-medium text-muted">{t("colDate")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colClient")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colHt")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colTva")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colTaxeSej")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colTtc")}</th>
                <th className="py-2 px-2 text-center font-medium text-muted">{t("colIssued")}</th>
                <th className="py-2 px-2 text-center font-medium text-muted">{t("colPaid")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-card-border/40">
                  <td className="py-2 px-2 font-mono">{inv.invoice_number}</td>
                  <td className="py-2 px-2">{tr(inv.invoice_type)}</td><td className="py-2 px-2 font-mono">{inv.issue_date}</td>
                  <td className="py-2 px-2">{inv.customer_name}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.total_ht), inv.currency)}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.total_tva), inv.currency)}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.taxe_sejour), inv.currency)}</td>
                  <td className="py-2 px-2 text-right font-mono font-semibold">{formatEUR(Number(inv.total_ttc), inv.currency)}</td>
                  <td className="py-2 px-2 text-center">
                    {inv.issued ? <span className="text-emerald-700">✓</span> : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {inv.paid ? <span className="text-emerald-700">✓</span> : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-2 px-2 text-right text-[11px]">
                    <button type="button" disabled={exporting !== null || busy !== null} onClick={() => handleDownloadPdf(inv)} className="text-navy hover:underline mr-2 disabled:opacity-50">{exporting === inv.id ? tr("downloading") : tr("download")}</button>
                    {!inv.issued && (
                      <button type="button" aria-busy={busy === inv.id} disabled={busy !== null || exporting !== null} onClick={() => handleStatus(inv, "issued")} className="text-emerald-700 hover:underline mr-2">{busy === inv.id ? t("updating") : t("actionIssue")}</button>
                    )}
                    {inv.issued && !inv.paid && (
                      <button type="button" aria-busy={busy === inv.id} disabled={busy !== null || exporting !== null} onClick={() => handleStatus(inv, "paid")} className="text-emerald-700 hover:underline">{busy === inv.id ? t("updating") : t("actionMarkPaid")}</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function InvoicesPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params), { user, loading } = useAuth();
  const tc = useTranslations("pms.common"), t = useTranslations("pms.invoices"), locale = useLocale();
  if (loading) return <p className="p-6">{tc("loading")}</p>;
  if (!user) return <div className="p-6"><h1 className="break-words text-2xl font-bold">{t("title")}</h1><Link className="mt-4 inline-block underline" href={`${locale === "fr" ? "" : `/${locale}`}/connexion`}>{tc("signInLink")}</Link></div>;
  return <InvoicesScreen key={`${user.id}:${propertyId}`} {...props} />;
}
