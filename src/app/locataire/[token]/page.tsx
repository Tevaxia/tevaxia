"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { getTenantPortalData, type TenantPortalData } from "@/lib/tenant-portal";
import { formatEUR } from "@/lib/calculations";

export default function TenantPortal() {
  const params = useParams();
  const locale = useLocale();
  const t = useTranslations("tenantPortal");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const token = String(params?.token ?? "");
  const [data, setData] = useState<TenantPortalData | null>(null);
  const [loading, setLoading] = useState(true);

  const STATUS_LABELS: Record<string, string> = {
    due: t("statusDue"),
    partial: t("statusPartial"),
    paid: t("statusPaid"),
    late: t("statusLate"),
    cancelled: t("statusCancelled"),
  };

  const STATUS_COLORS: Record<string, string> = {
    due: "bg-amber-100 text-amber-800",
    partial: "bg-orange-100 text-orange-800",
    paid: "bg-emerald-100 text-emerald-800",
    late: "bg-rose-100 text-rose-800",
    cancelled: "bg-slate-100 text-slate-700",
  };

  useEffect(() => {
    if (!token) return;
    getTenantPortalData(token)
      .then((d) => setData(d))
      .catch((e) => setData({ error: e?.message ?? t("errGeneric") } as TenantPortalData))
      .finally(() => setLoading(false));
  }, [token, t]);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  if (!data || data.error || !data.lot) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("invalidLinkTitle")}</h1>
        <p className="text-muted">{t("invalidLinkBody")}</p>
      </div>
    );
  }

  const { lot, tenant_name, payments } = data;
  const unpaid = payments.filter((p) => p.status === "due" || p.status === "late" || p.status === "partial");
  const totalDue = unpaid.reduce((sum, p) => sum + p.amount_total, 0);
  const paidCount = payments.filter((p) => p.status === "paid").length;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-teal-700 to-cyan-600 p-6 sm:p-8 text-white shadow-lg">
          <div className="text-xs uppercase tracking-wider text-white/70">{t("heroKicker")}</div>
          <h1 className="mt-1 text-2xl sm:text-3xl font-bold">{lot.name}</h1>
          {lot.address && <p className="mt-1 text-sm text-white/80">{lot.address}{lot.commune ? `, ${lot.commune}` : ""}</p>}
          {tenant_name && <p className="mt-2 text-sm text-white/70">{t("tenantLabel")} <strong>{tenant_name}</strong></p>}
          <div className="mt-4 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white/10 px-3 py-1">{lot.surface} m²</span>
            {lot.nb_chambres && <span className="rounded-full bg-white/10 px-3 py-1">{t("chambres", { n: lot.nb_chambres })}</span>}
            <span className="rounded-full bg-white/10 px-3 py-1">{t("classeEnergie", { classe: lot.classe_energie })}</span>
            {lot.est_meuble && <span className="rounded-full bg-white/10 px-3 py-1">{t("meuble")}</span>}
          </div>
        </div>

        {/* Statut paiements */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">{t("paymentsDueTitle")}</div>
            <div className={`mt-1 text-2xl font-bold ${totalDue > 0 ? "text-rose-700" : "text-emerald-700"}`}>
              {formatEUR(totalDue)}
            </div>
            <div className="mt-1 text-xs text-muted">
              {unpaid.length > 1 ? t("echeancesMany", { n: unpaid.length }) : t("echeancesOne", { n: unpaid.length })}
            </div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">{t("history24Title")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{t("paid", { n: paidCount })}</div>
            <div className="mt-1 text-xs text-muted">{t("onPeriods", { n: payments.length })}</div>
          </div>
        </div>

        {/* Historique paiements */}
        <div className="mt-6 rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-card-border bg-background">
            <h2 className="text-base font-semibold text-navy">{t("historyTitle")}</h2>
          </div>
          {payments.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted">{t("noPaymentsYet")}</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left text-xs text-muted">
                  <th className="px-5 py-2 font-medium">{t("thPeriode")}</th>
                  <th className="px-5 py-2 font-medium text-right">{t("thLoyerHC")}</th>
                  <th className="px-5 py-2 font-medium text-right">{t("thCharges")}</th>
                  <th className="px-5 py-2 font-medium text-right">{t("thTotal")}</th>
                  <th className="px-5 py-2 font-medium">{t("thStatut")}</th>
                  <th className="px-5 py-2 font-medium">{t("thQuittance")}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-card-border/50">
                    <td className="px-5 py-2 font-mono">{p.period}</td>
                    <td className="px-5 py-2 text-right font-mono text-muted">{formatEUR(p.amount_rent)}</td>
                    <td className="px-5 py-2 text-right font-mono text-muted">{formatEUR(p.amount_charges)}</td>
                    <td className="px-5 py-2 text-right font-mono font-semibold text-navy">{formatEUR(p.amount_total)}</td>
                    <td className="px-5 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>
                        {STATUS_LABELS[p.status]}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-xs text-muted">
                      {p.receipt_issued_at ? `✓ ${new Date(p.receipt_issued_at).toLocaleDateString(dateLocale)}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-8 rounded-lg border border-card-border bg-background p-4 text-xs text-muted text-center">
          {t("footer")}
          <br/>{t("footerLegal")}
        </div>
      </div>
    </div>
  );
}
