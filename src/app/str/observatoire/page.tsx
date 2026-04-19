"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { OBSERVATOIRE_STR_LU, averageADR, averageOccupancy, totalActiveListings, LU_AIRBNB_TOTAL_LISTINGS, LU_AIRBNB_GROWTH_YOY } from "@/lib/str-observatoire";

export default function ObservatoireStr() {
  const t = useTranslations("strObservatoire");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const numLocale = locale === "fr" ? "fr-LU" : locale;
  const [filter, setFilter] = useState<"all" | "lu-ville" | "sud" | "nord" | "moselle">("all");

  const filtered = useMemo(() => {
    if (filter === "lu-ville") return OBSERVATOIRE_STR_LU.filter((e) => e.commune === "Luxembourg-Ville");
    if (filter === "sud") return OBSERVATOIRE_STR_LU.filter((e) => ["Esch-sur-Alzette", "Differdange"].includes(e.commune));
    if (filter === "nord") return OBSERVATOIRE_STR_LU.filter((e) => ["Diekirch / Vianden", "Echternach / Mullerthal"].includes(e.commune));
    if (filter === "moselle") return OBSERVATOIRE_STR_LU.filter((e) => e.commune.includes("Mondorf") || e.commune.includes("Remich"));
    return OBSERVATOIRE_STR_LU;
  }, [filter]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">&larr; {t("back")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpi.listings")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{LU_AIRBNB_TOTAL_LISTINGS.toLocaleString(numLocale)}</div>
            <div className="text-xs text-muted">{t("kpi.growth", { pct: (LU_AIRBNB_GROWTH_YOY * 100).toFixed(0) })}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpi.adrMedian")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{averageADR(filtered)} €</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpi.occupancyMedian")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{(averageOccupancy(filtered) * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">{t("kpi.activeListings")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalActiveListings(filtered)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {(["all", "lu-ville", "sud", "nord", "moselle"] as const).map((k) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === k ? "bg-navy text-white" : "border border-card-border bg-card text-slate hover:bg-slate-50"}`}>
              {t(`filter.${k === "lu-ville" ? "luVille" : k}`)}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("table.zone")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.adrP25")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.adrMedian")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.adrP75")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.occupancy")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.revpar")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.listings")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i} className="border-b border-card-border/50 hover:bg-background">
                  <td className="px-4 py-2">
                    <div className="font-medium text-navy">{e.commune}</div>
                    <div className="text-xs text-muted">{e.zone}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">{e.adrP25} €</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-navy">{e.adrMedian} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">{e.adrP75} €</td>
                  <td className="px-4 py-2 text-right font-mono">{(e.occupancyMedian * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-rose-700">{e.revPARMedian} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{e.activeListings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-xs text-blue-900">
          <strong>{t("footer.updateLabel")}</strong> {t("footer.update")}{" "}
          <Link href={`${lp}/str/pricing`} className="underline font-semibold">/str/pricing</Link>{" "}{t("footer.compset")}
          <br/><strong>{t("footer.sourcesLabel")}</strong> {t("footer.sources")}
        </div>
      </div>
    </div>
  );
}
