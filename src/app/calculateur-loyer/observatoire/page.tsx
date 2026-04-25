"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { LOYERS_LU_Q4_2025, type LoyerObservation } from "@/lib/loyer-observatoire";
import { formatEUR } from "@/lib/calculations";

const TYPE_KEY: Record<LoyerObservation["propertyType"], string> = {
  studio: "typeStudio",
  "1bed": "type1Bed",
  "2bed": "type2Bed",
  "3bed": "type3Bed",
  maison: "typeMaison",
};

const TREND_KEY: Record<LoyerObservation["trend12m"], string> = {
  up: "trendUp",
  stable: "trendStable",
  down: "trendDown",
};

const TREND_COLOR: Record<LoyerObservation["trend12m"], string> = {
  up: "text-rose-700",
  stable: "text-slate-700",
  down: "text-emerald-700",
};

export default function ObservatoireLoyers() {
  const t = useTranslations("observatoireLoyers");
  const [propertyType, setPropertyType] = useState<"all" | LoyerObservation["propertyType"]>("all");
  const [commune, setCommune] = useState<string>("all");

  const communes = useMemo(() => {
    const set = new Set(LOYERS_LU_Q4_2025.map((l) => l.commune));
    return Array.from(set);
  }, []);

  const filtered = useMemo(() => {
    return LOYERS_LU_Q4_2025.filter((l) => {
      if (propertyType !== "all" && l.propertyType !== propertyType) return false;
      if (commune !== "all" && l.commune !== commune) return false;
      return true;
    });
  }, [propertyType, commune]);

  const avgRent = filtered.length > 0 ? Math.round(filtered.reduce((s, l) => s + l.rentMedian, 0) / filtered.length) : 0;
  const avgRentM2 = filtered.length > 0 ? Math.round(filtered.reduce((s, l) => s + l.rentPerM2Median, 0) / filtered.length) : 0;
  const totalSamples = filtered.reduce((s, l) => s + l.sampleSize, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/calculateur-loyer" className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("desc")}</p>
        </div>

        <div className="mb-6 flex flex-wrap gap-3">
          <select value={commune} onChange={(e) => setCommune(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">{t("filterAllCommunes")}</option>
            {communes.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={propertyType} onChange={(e) => setPropertyType(e.target.value as "all" | LoyerObservation["propertyType"])}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">{t("filterAllTypes")}</option>
            {(Object.keys(TYPE_KEY) as LoyerObservation["propertyType"][]).map((k) => (
              <option key={k} value={k}>{t(TYPE_KEY[k])}</option>
            ))}
          </select>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("statMedianRent")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{t("statMedianRentSuffix", { amount: formatEUR(avgRent) })}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("statMedianM2")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{t("statMedianM2Suffix", { value: avgRentM2 })}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("statSample")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalSamples}</div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("colCommuneZone")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("colType")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colP25")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colMedian")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colP75")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colPerM2")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colSurface")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("colSample")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("colTrend")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted">{t("emptyData")}</td></tr>
              ) : filtered.map((l, i) => (
                <tr key={i} className="border-b border-card-border/50">
                  <td className="px-4 py-2">
                    <div className="font-medium text-navy">{l.commune}</div>
                    <div className="text-xs text-muted">{l.zone}</div>
                  </td>
                  <td className="px-4 py-2 text-xs">{t(TYPE_KEY[l.propertyType])}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(l.rentP25)}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-navy">{formatEUR(l.rentMedian)}</td>
                  <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(l.rentP75)}</td>
                  <td className="px-4 py-2 text-right font-mono">{l.rentPerM2Median} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{l.avgSurface} m²</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{l.sampleSize}</td>
                  <td className={`px-4 py-2 text-xs font-semibold ${TREND_COLOR[l.trend12m]}`}>
                    {t(TREND_KEY[l.trend12m])}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("importantTitle")}</strong>{t("importantText1")}<strong>{t("importantText2")}</strong>{t("importantText3")}
          <Link href="/calculateur-loyer" className="underline font-semibold">{t("importantLink")}</Link>
          {t("importantText4")}
        </div>
      </div>
    </div>
  );
}
