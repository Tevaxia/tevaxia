"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

interface StripeInvoice {
  id: string;
  number: string | null;
  date: string | null;
  amount: number;
  currency: string;
  status: string;
  paid: boolean;
  periodEnd: string | null;
  hostedUrl: string | null;
  pdfUrl: string | null;
}

export default function StripeInvoicesSection() {
  const t = useTranslations("profil.invoices");
  const { user } = useAuth();
  const [invoices, setInvoices] = useState<StripeInvoice[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    setLoading(true);
    void (async () => {
      try {
        const { data: { session } } = await supabase!.auth.getSession();
        const token = session?.access_token;
        if (!token) throw new Error(t("authRequired"));
        const res = await fetch("/api/stripe/invoices", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          if (res.status === 501) { setInvoices([]); return; }
          throw new Error(`HTTP ${res.status}`);
        }
        const data = await res.json();
        setInvoices(data.invoices ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [user, t]);

  if (!user) return null;

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-navy mb-1">{t("title")}</h3>
      <p className="text-xs text-muted mb-3">{t("description")}</p>

      {loading && <p className="text-xs text-muted">{t("loading")}</p>}
      {error && <p className="text-xs text-rose-700">{error}</p>}

      {invoices && invoices.length === 0 && (
        <p className="rounded-lg border border-dashed border-card-border bg-background p-4 text-center text-xs text-muted">
          {t("empty")}
        </p>
      )}

      {invoices && invoices.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">{t("colNumber")}</th>
                <th className="px-3 py-2 text-left font-semibold">{t("colDate")}</th>
                <th className="px-3 py-2 text-right font-semibold">{t("colAmount")}</th>
                <th className="px-3 py-2 text-center font-semibold">{t("colStatus")}</th>
                <th className="px-3 py-2 text-center font-semibold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t border-card-border">
                  <td className="px-3 py-2 font-mono">{inv.number ?? inv.id.slice(-8)}</td>
                  <td className="px-3 py-2">{inv.date ?? "—"}</td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums">
                    {new Intl.NumberFormat("fr-LU", { style: "currency", currency: inv.currency }).format(inv.amount)}
                  </td>
                  <td className="px-3 py-2 text-center">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      inv.paid ? "bg-emerald-100 text-emerald-800"
                        : inv.status === "open" ? "bg-amber-100 text-amber-800"
                        : "bg-slate-100 text-slate-700"
                    }`}>
                      {inv.paid ? t("statusPaid") : inv.status === "open" ? t("statusOpen") : inv.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <div className="flex gap-1 justify-center">
                      {inv.pdfUrl && (
                        <a href={inv.pdfUrl} target="_blank" rel="noreferrer" className="rounded px-2 py-0.5 text-[10px] border border-navy text-navy hover:bg-navy/5">
                          PDF
                        </a>
                      )}
                      {inv.hostedUrl && (
                        <a href={inv.hostedUrl} target="_blank" rel="noreferrer" className="rounded px-2 py-0.5 text-[10px] border border-card-border text-muted hover:bg-slate-50">
                          {t("view")}
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="mt-3 text-[10px] text-muted">
        {t("legalNote")}
      </p>
    </div>
  );
}
