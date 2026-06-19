"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AUDIT_QUESTIONS, calculerAudit, type AuditResult } from "@/lib/energy-audit";

const ENERGY_COLORS: Record<string, string> = {
  A: "bg-emerald-500 text-white",
  B: "bg-lime-500 text-white",
  C: "bg-yellow-500 text-white",
  D: "bg-amber-500 text-white",
  E: "bg-orange-500 text-white",
  F: "bg-red-500 text-white",
  G: "bg-red-700 text-white",
};

export default function EnergyAuditGuide() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("energyAudit");

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  const current = AUDIT_QUESTIONS[currentIdx];
  const isLast = currentIdx === AUDIT_QUESTIONS.length - 1;
  const isComplete = Object.keys(answers).length === AUDIT_QUESTIONS.length;

  const result: AuditResult | null = useMemo(() => {
    if (!isComplete) return null;
    return calculerAudit(answers);
  }, [answers, isComplete]);

  const handleAnswer = (valueKey: string) => {
    setAnswers({ ...answers, [current.id]: valueKey });
    if (!isLast) {
      setTimeout(() => setCurrentIdx(currentIdx + 1), 150);
    }
  };

  const resetAudit = () => {
    setAnswers({});
    setCurrentIdx(0);
  };

  const progress = (Object.keys(answers).length / AUDIT_QUESTIONS.length) * 100;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/energy`} className="text-xs text-muted hover:text-navy">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800">{t("freeAudit")}</span>
          <span className="rounded-full bg-sky-50 border border-sky-200 px-3 py-1 text-sky-800">{t("twentyQuestions")}</span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-800">{t("klimabonusAware")}</span>
        </div>

        {!isComplete ? (
          <div className="mt-8 rounded-xl border border-card-border bg-card p-8 shadow-sm">
            {/* Progress bar */}
            <div className="mb-6">
              <div className="flex items-center justify-between text-xs text-muted mb-1">
                <span>{t("question", { n: currentIdx + 1, total: AUDIT_QUESTIONS.length })}</span>
                <span>{progress.toFixed(0)} %</span>
              </div>
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* Current question */}
            <div className="mb-2 text-[10px] uppercase tracking-wider text-muted font-semibold">
              {t(`cat_${current.category}`)}
            </div>
            <h2 className="text-xl font-semibold text-navy mb-5">{t(current.labelKey)}</h2>

            <div className="grid gap-2 sm:grid-cols-2">
              {current.options.map((opt) => {
                const selected = answers[current.id] === opt.valueKey;
                return (
                  <button
                    key={opt.valueKey}
                    onClick={() => handleAnswer(opt.valueKey)}
                    className={`rounded-lg border p-3 text-left text-sm transition-all ${
                      selected
                        ? "border-navy bg-navy text-white shadow-md"
                        : "border-card-border bg-background hover:border-navy/40 hover:bg-slate-50"
                    }`}
                  >
                    {t(opt.valueKey)}
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
                disabled={currentIdx === 0}
                className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-slate-50 disabled:opacity-40"
              >
                ← {t("prev")}
              </button>
              {answers[current.id] && !isLast && (
                <button
                  onClick={() => setCurrentIdx(currentIdx + 1)}
                  className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
                >
                  {t("next")} →
                </button>
              )}
            </div>
          </div>
        ) : result && (
          <div className="mt-8 space-y-6">
            {/* Score global + classe */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white shadow-lg">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/70">{t("scoreGlobal")}</div>
                  <div className="mt-1 text-5xl font-bold">{result.scoreGlobal.toFixed(0)} / 100</div>
                  <div className="mt-1 text-sm text-white/70">
                    {t("gainTotal", { pct: result.gainEnergetiqueTotal })}
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-xs text-white/70">{t("classeEstimee")}</div>
                  <div className={`mt-1 inline-flex h-20 w-20 items-center justify-center rounded-xl text-4xl font-bold ${ENERGY_COLORS[result.classeEstimee]}`}>
                    {result.classeEstimee}
                  </div>
                </div>
              </div>

              {/* Scores par catégorie */}
              <div className="mt-5 grid gap-2 sm:grid-cols-5">
                {(Object.entries(result.scoreCategory) as [keyof typeof result.scoreCategory, number][]).map(([cat, sc]) => (
                  <div key={cat} className="rounded-lg bg-white/10 p-2">
                    <div className="text-[10px] uppercase tracking-wider text-white/70">{t(`cat_${cat}`)}</div>
                    <div className="text-lg font-bold">{sc.toFixed(0)}</div>
                    <div className="h-1 mt-0.5 bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white" style={{ width: `${sc}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Plan hiérarchisé */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-1">{t("planTitle")}</h2>
              <p className="text-[11px] text-muted mb-4">{t("planSubtitle")}</p>
              {result.recommendations.length === 0 ? (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
                  {t("noReco")}
                </div>
              ) : (
                <div className="space-y-3">
                  {result.recommendations.map((r, i) => (
                    <div key={i} className="rounded-lg border border-card-border bg-background p-4">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex items-start gap-3 min-w-0">
                          <span className={`shrink-0 inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                            r.priority === 1 ? "bg-rose-100 text-rose-800" :
                            r.priority === 2 ? "bg-amber-100 text-amber-800" :
                            "bg-emerald-100 text-emerald-800"
                          }`}>{r.priority}</span>
                          <div className="min-w-0">
                            <h3 className="text-sm font-semibold text-navy">{t(r.titleKey)}</h3>
                            <p className="mt-0.5 text-xs text-muted">{t(r.descKey)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-mono text-navy font-semibold">
                            {r.coutMin.toLocaleString("fr-FR")} — {r.coutMax.toLocaleString("fr-FR")} €
                          </div>
                          <div className="text-[10px] text-emerald-700">
                            {t("klimabonus")} {r.klimabonusPct} %
                          </div>
                          <div className="text-[10px] text-muted">
                            {t("gain", { pct: r.gainEnergetiquePct })}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Totaux */}
            {result.recommendations.length > 0 && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
                <h3 className="text-sm font-semibold text-emerald-900 mb-3">{t("totalsTitle")}</h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700">{t("totalCost")}</div>
                    <div className="font-mono font-bold text-emerald-900">
                      {result.coutTotal.min.toLocaleString("fr-FR")} — {result.coutTotal.max.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700">{t("totalKlimabonus")}</div>
                    <div className="font-mono font-bold text-emerald-900">
                      {result.klimabonusTotal.min.toLocaleString("fr-FR")} — {result.klimabonusTotal.max.toLocaleString("fr-FR")} €
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-emerald-700">{t("totalReste")}</div>
                    <div className="font-mono font-bold text-emerald-900">
                      {(result.coutTotal.min - result.klimabonusTotal.max).toLocaleString("fr-FR")} — {(result.coutTotal.max - result.klimabonusTotal.min).toLocaleString("fr-FR")} €
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={resetAudit}
                className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50"
              >
                {t("restart")}
              </button>
              <Link
                href={`${lp}/energy/renovation`}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
              >
                {t("detailRenov")} →
              </Link>
              <Link
                href={`${lp}/simulateur-aides`}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                {t("simulateAides")} →
              </Link>
            </div>

            <p className="text-[10px] text-muted italic">{t("disclaimer")}</p>
          </div>
        )}
      </div>
    </div>
  );
}
