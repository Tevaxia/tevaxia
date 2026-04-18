"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listInvoices, issueInvoice, markInvoicePaid } from "@/lib/pms/invoices";
import type { PmsProperty, PmsInvoice } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { generatePmsInvoiceBlob } from "@/components/PmsInvoicePdf";
import { errMsg } from "@/lib/pms/errors";

export default function InvoicesPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const t = useTranslations("pms.invoices");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [invoices, setInvoices] = useState<PmsInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [p, inv] = await Promise.all([getProperty(propertyId), listInvoices(propertyId)]);
    setProperty(p);
    setInvoices(inv);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleDownloadPdf = async (inv: PmsInvoice) => {
    if (!property) return;
    try {
      const blob = await generatePmsInvoiceBlob(inv, property);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${inv.invoice_number}.pdf`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (e) { setError(errMsg(e)); }
  };

  const handleIssue = async (inv: PmsInvoice) => {
    if (!confirm(t("confirmIssue", { number: inv.invoice_number }))) return;
    try {
      await issueInvoice(inv.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleMarkPaid = async (inv: PmsInvoice) => {
    try {
      await markInvoicePaid(inv.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;

  const totalIssued = invoices.filter((i) => i.issued).reduce((s, i) => s + Number(i.total_ttc || 0), 0);
  const totalPaid = invoices.filter((i) => i.paid).reduce((s, i) => s + Number(i.total_ttc || 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("intro")}</p>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-xs text-muted">{t("kpiTotal")}</div>
          <div className="text-xl font-bold text-navy">{invoices.length}</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4">
          <div className="text-xs text-muted">{t("kpiIssued")}</div>
          <div className="text-xl font-bold text-navy">{formatEUR(totalIssued)}</div>
        </div>
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="text-xs text-emerald-800">{t("kpiCollected")}</div>
          <div className="text-xl font-bold text-emerald-900">{formatEUR(totalPaid)}</div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-card-border bg-card p-3">
        {invoices.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">{t("empty")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colNumber")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colDate")}</th>
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
                  <td className="py-2 px-2 font-mono">{inv.issue_date}</td>
                  <td className="py-2 px-2">{inv.customer_name}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.total_ht))}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.total_tva))}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(inv.taxe_sejour))}</td>
                  <td className="py-2 px-2 text-right font-mono font-semibold">{formatEUR(Number(inv.total_ttc))}</td>
                  <td className="py-2 px-2 text-center">
                    {inv.issued ? <span className="text-emerald-700">✓</span> : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center">
                    {inv.paid ? <span className="text-emerald-700">✓</span> : <span className="text-muted">—</span>}
                  </td>
                  <td className="py-2 px-2 text-right text-[11px]">
                    <button type="button" onClick={() => handleDownloadPdf(inv)} className="text-navy hover:underline mr-2">{t("actionPdf")}</button>
                    {!inv.issued && (
                      <button type="button" onClick={() => handleIssue(inv)} className="text-emerald-700 hover:underline mr-2">{t("actionIssue")}</button>
                    )}
                    {inv.issued && !inv.paid && (
                      <button type="button" onClick={() => handleMarkPaid(inv)} className="text-emerald-700 hover:underline">{t("actionMarkPaid")}</button>
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
