"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { listHistory, deleteHistoryEntry, type FacturXHistoryEntry } from "@/lib/facturation/history";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";

function formatEUR(n: number, currency = "EUR"): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

export default function HistoriquePage() {
  const t = useTranslations("facturation.historique");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const [entries, setEntries] = useState<FacturXHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mount/dep-driven sync with external source (URL, localStorage, Supabase)
    if (authLoading || !user) { if (!authLoading) setLoading(false); return; }
    (async () => {
      setLoading(true);
      setEntries(await listHistory(200));
      setLoading(false);
    })();
  }, [user, authLoading]);

  const reDownload = async (e: FacturXHistoryEntry) => {
    const artifacts = await generateFacturXPdf(e.invoice_data);
    const pdfBlob = new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url; a.download = artifacts.pdfFilename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const editEntry = (e: FacturXHistoryEntry) => {
    try { localStorage.setItem("tevaxia-facturation-draft", JSON.stringify(e.invoice_data)); } catch {}
    window.location.href = `${lp}/facturation/emission`;
  };

  const remove = async (e: FacturXHistoryEntry) => {
    if (!confirm(t("deleteConfirm", { num: e.invoice_number }))) return;
    const ok = await deleteHistoryEntry(e.id);
    if (ok) setEntries(entries.filter((x) => x.id !== e.id));
  };

  const filtered = entries.filter((e) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return e.invoice_number.toLowerCase().includes(q)
      || e.buyer_name.toLowerCase().includes(q)
      || e.seller_name.toLowerCase().includes(q);
  });

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12 text-center">
        <Link href={`${lp}/connexion`} className="text-navy underline">{t("signIn")}</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href={`${lp}/facturation`} className="text-xs text-muted hover:text-navy">← {t("back")}</Link>
          <h1 className="text-2xl font-bold text-navy mt-1">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <Link href={`${lp}/facturation/emission`}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          + {t("newInvoice")}
        </Link>
      </div>

      <div className="mb-4">
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full sm:w-96 rounded border border-input-border bg-input-bg px-3 py-2 text-sm" />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
          <div className="text-4xl mb-2">📄</div>
          <p className="text-sm text-muted">{query ? t("noResults") : t("empty")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-3 py-2">{t("col.number")}</th>
                <th className="px-3 py-2">{t("col.date")}</th>
                <th className="px-3 py-2">{t("col.buyer")}</th>
                <th className="px-3 py-2 text-right">{t("col.ttc")}</th>
                <th className="px-3 py-2">{t("col.template")}</th>
                <th className="px-3 py-2 text-right">{t("col.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {filtered.map((e) => (
                <tr key={e.id}>
                  <td className="px-3 py-2 font-mono text-xs">{e.invoice_number}</td>
                  <td className="px-3 py-2 text-xs">{new Date(e.invoice_date).toLocaleDateString(locale === "fr" ? "fr-FR" : locale)}</td>
                  <td className="px-3 py-2 text-xs">{e.buyer_name}</td>
                  <td className="px-3 py-2 text-xs text-right font-mono">{formatEUR(e.total_ttc, e.currency)}</td>
                  <td className="px-3 py-2 text-xs">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">{e.template ?? "generic"}</span>
                  </td>
                  <td className="px-3 py-2 text-right space-x-1">
                    <button onClick={() => reDownload(e)}
                      className="rounded-md bg-navy/10 px-2 py-1 text-[11px] font-medium text-navy hover:bg-navy/20">
                      {t("actions.download")}
                    </button>
                    <button onClick={() => editEntry(e)}
                      className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-slate hover:bg-slate-50">
                      {t("actions.edit")}
                    </button>
                    <button onClick={() => remove(e)}
                      className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title={t("actions.delete")}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("hintTitle")}</strong> {t("hintBody")}
      </div>
    </div>
  );
}
