"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { backtestModel, MODEL_COEFFICIENTS } from "@/lib/estimation";
import { formatEUR } from "@/lib/calculations";

export function TransparenceClient() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("transparencePage");

  const backtest = useMemo(() => backtestModel(), []);

  const confColor = (c: string) =>
    c === "Forte" ? "text-emerald-700 bg-emerald-50" :
    c === "Moyenne" ? "text-amber-700 bg-amber-50" :
    "text-rose-700 bg-rose-50";

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">{t("backLink")}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-2 text-sm text-muted">
          {t("pageDescription")}
        </p>

        {/* KPIs qualité */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiMape")}</div>
            <div className={`mt-1 text-2xl font-bold ${backtest.mape < 15 ? "text-emerald-700" : backtest.mape < 25 ? "text-amber-700" : "text-rose-700"}`}>
              {backtest.mape.toFixed(1)} %
            </div>
            <div className="mt-0.5 text-[10px] text-muted">{t("kpiMapeDesc")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiMediane")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.medianError.toFixed(1)} %</div>
            <div className="mt-0.5 text-[10px] text-muted">{t("kpiMedianeDesc")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiR2")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.r2Approx.toFixed(3)}</div>
            <div className="mt-0.5 text-[10px] text-muted">{t("kpiR2Desc")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("kpiBiens")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{backtest.samples.length}</div>
            <div className="mt-0.5 text-[10px] text-muted">{t("kpiBiensDesc")}</div>
          </div>
        </div>

        {/* Méthodologie */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">{t("sectionMethodologie")}</h2>
          <div className="mt-3 space-y-3 text-sm text-slate-700">
            <p>
              {t("methodoP1")}
            </p>
            <p>
              {t("methodoApproche")}
            </p>
            <div className="rounded-lg bg-slate-50 p-3 font-mono text-xs">
              Prix = PrixRef/m² × (1 + Σ ajustements %) × Surface
            </div>
            <p>
              {t("methodoP2")}
            </p>
          </div>
        </div>

        {/* Sources */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">{t("sectionSources")}</h2>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">{t("thSource")}</th>
                  <th className="px-3 py-2">{t("thDonnees")}</th>
                  <th className="px-3 py-2">{t("thFrequence")}</th>
                  <th className="px-3 py-2">{t("thAcces")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                <tr><td className="px-3 py-1.5 font-medium">{t("srcObservatoire")}</td><td className="px-3 py-1.5">{t("srcObservatoireData")}</td><td className="px-3 py-1.5">{t("srcObservatoireFreq")}</td><td className="px-3 py-1.5 text-blue-700"><a href="https://data.public.lu" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">data.public.lu</a></td></tr>
                <tr><td className="px-3 py-1.5 font-medium">{t("srcStatec")}</td><td className="px-3 py-1.5">{t("srcStatecData")}</td><td className="px-3 py-1.5">{t("srcStatecFreq")}</td><td className="px-3 py-1.5 text-blue-700"><a href="https://statistiques.public.lu" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">statistiques.public.lu</a></td></tr>
                <tr><td className="px-3 py-1.5 font-medium">{t("srcSpuerkeess")}</td><td className="px-3 py-1.5">{t("srcSpuerkeessData")}</td><td className="px-3 py-1.5">{t("srcSpuerkeessFreq")}</td><td className="px-3 py-1.5 text-blue-700">{t("srcPublicationAnnuelle")}</td></tr>
                <tr><td className="px-3 py-1.5 font-medium">{t("srcPubliciteFonciere")}</td><td className="px-3 py-1.5">{t("srcPubliciteFonciereData")}</td><td className="px-3 py-1.5">{t("srcObservatoireFreq")}</td><td className="px-3 py-1.5 text-blue-700"><a href="https://observatoire.liser.lu" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">{t("srcViaObservatoire")}</a></td></tr>
                <tr><td className="px-3 py-1.5 font-medium">{t("srcAnnoncesImmo")}</td><td className="px-3 py-1.5">{t("srcAnnoncesImmoData")}</td><td className="px-3 py-1.5">{t("srcContinu")}</td><td className="px-3 py-1.5 text-blue-700"><a href="https://observatoire.liser.lu" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">{t("srcViaObservatoire")}</a></td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Coefficients */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">{t("sectionCoefficients")} ({MODEL_COEFFICIENTS.length} {t("coeffParametres")})</h2>
          <p className="mt-1 text-xs text-muted">
            {t("coeffDesc")}
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">{t("thCaracteristique")}</th>
                  <th className="px-3 py-2 text-right">{t("thCoefficient")}</th>
                  <th className="px-3 py-2">{t("thSourceCoeff")}</th>
                  <th className="px-3 py-2">{t("thConfiance")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {MODEL_COEFFICIENTS.map((c, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium text-navy">{c.feature}</td>
                    <td className={`px-3 py-1.5 text-right font-mono ${c.coefficient.startsWith("+") ? "text-emerald-700" : c.coefficient.startsWith("-") ? "text-rose-700" : "text-navy"}`}>
                      {c.coefficient}
                    </td>
                    <td className="px-3 py-1.5 text-muted">{c.source}</td>
                    <td className="px-3 py-1.5">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${confColor(c.confidence)}`}>
                        {c.confidence === "Forte" ? t("confForte") : c.confidence === "Moyenne" ? t("confMoyenne") : t("confFaible")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Back-test results */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy">{t("sectionBacktest")} ({backtest.samples.length} {t("backtestBiens")})</h2>
          <p className="mt-1 text-xs text-muted">
            {t("backtestDesc")}
          </p>
          <div className="mt-3 overflow-x-auto rounded-xl border border-card-border bg-card">
            <table className="w-full text-xs">
              <thead className="bg-background text-left text-[10px] uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2">{t("thCommune")}</th>
                  <th className="px-3 py-2 text-right">{t("thSurface")}</th>
                  <th className="px-3 py-2">{t("thEnergie")}</th>
                  <th className="px-3 py-2 text-right">{t("thPrixReel")}</th>
                  <th className="px-3 py-2 text-right">{t("thEstimation")}</th>
                  <th className="px-3 py-2 text-right">{t("thErreur")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border/50">
                {backtest.samples.map((s, i) => (
                  <tr key={i}>
                    <td className="px-3 py-1.5 font-medium text-navy">{s.commune}</td>
                    <td className="px-3 py-1.5 text-right">{s.surface} m²</td>
                    <td className="px-3 py-1.5">{s.classeEnergie}</td>
                    <td className="px-3 py-1.5 text-right">{formatEUR(s.prixReel)}</td>
                    <td className="px-3 py-1.5 text-right">{formatEUR(s.prixEstime)}</td>
                    <td className={`px-3 py-1.5 text-right font-medium ${
                      Math.abs(s.erreurPct) <= 10 ? "text-emerald-700" :
                      Math.abs(s.erreurPct) <= 20 ? "text-amber-700" :
                      "text-rose-700"
                    }`}>
                      {s.erreurPct >= 0 ? "+" : ""}{s.erreurPct.toFixed(1)} %
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-background text-xs font-semibold">
                <tr>
                  <td className="px-3 py-2" colSpan={5}>{t("mapeFooter")}</td>
                  <td className="px-3 py-2 text-right">{backtest.mape.toFixed(1)} %</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Limites */}
        <div className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="text-base font-semibold text-amber-900">{t("sectionLimites")}</h2>
          <ul className="mt-2 space-y-1.5 text-xs text-amber-800">
            <li>{t("limite1")}</li>
            <li>{t("limite2")}</li>
            <li>{t("limite3")}</li>
            <li>{t("limite4")}</li>
            <li>{t("limite5")}</li>
          </ul>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("engagementTitle")}</strong> {t("engagementText")}
        </div>
      </div>
    </div>
  );
}
