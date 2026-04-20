"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { getAllCommunes, getMarketDataCommune, slugifyCommune, type MarketDataCommune } from "@/lib/market-data";
import { computeMarketScore, getScoreColor } from "@/lib/market-score";
import { formatEUR } from "@/lib/calculations";
import { PriceEvolutionChart, PriceIndexChart } from "@/components/PriceChart";
import SEOContent from "@/components/SEOContent";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import {
  TEVAXIA_INDEX,
  TEVAXIA_INDEX_LAST_UPDATE,
  getCurrentIndex,
  getIndexChange,
  interpretIndex,
} from "@/lib/tevaxia-index";

type SortKey = "prix" | "commune" | "tendance" | "transactions";

function getTendanceBadge(commune: MarketDataCommune): { labelKey: string; color: string } {
  if (commune.quartiers && commune.quartiers.length > 0) {
    const counts = { hausse: 0, stable: 0, baisse: 0 };
    for (const q of commune.quartiers) {
      counts[q.tendance]++;
    }
    const dominant = (Object.entries(counts) as [keyof typeof counts, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    if (dominant === "hausse") return { labelKey: "trend_up", color: "bg-green-100 text-green-700" };
    if (dominant === "baisse") return { labelKey: "trend_down", color: "bg-red-100 text-red-700" };
    return { labelKey: "trend_stable", color: "bg-gray-100 text-gray-600" };
  }
  // Without quartier data, infer from existant vs annonces spread
  if (commune.prixM2Existant && commune.prixM2Annonces) {
    const ecart = (commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant;
    if (ecart > 0.05) return { labelKey: "trend_up", color: "bg-green-100 text-green-700" };
    if (ecart < -0.02) return { labelKey: "trend_down", color: "bg-red-100 text-red-700" };
  }
  return { labelKey: "trend_stable", color: "bg-gray-100 text-gray-600" };
}

function getTendanceSort(commune: MarketDataCommune): number {
  const b = getTendanceBadge(commune);
  if (b.labelKey === "trend_up") return 2;
  if (b.labelKey === "trend_down") return 0;
  return 1;
}

export default function IndicesPage() {
  const t = useTranslations("indices");
  const [sortKey, setSortKey] = useState<SortKey>("prix");
  const [sortAsc, setSortAsc] = useState(false);

  const allCommunes = useMemo(() => {
    const names = getAllCommunes();
    return names.map((n) => getMarketDataCommune(n)).filter(Boolean) as MarketDataCommune[];
  }, []);

  // National summary
  const summary = useMemo(() => {
    const withPrix = allCommunes.filter((c) => c.prixM2Existant);
    const avg = withPrix.reduce((s, c) => s + (c.prixM2Existant || 0), 0) / withPrix.length;
    const totalTx = allCommunes.reduce((s, c) => s + (c.nbTransactions || 0), 0);
    return { avgPrix: Math.round(avg), totalTransactions: totalTx, nbCommunes: allCommunes.length };
  }, [allCommunes]);

  // Sort communes
  const sortedCommunes = useMemo(() => {
    const sorted = [...allCommunes].sort((a, b) => {
      let diff = 0;
      switch (sortKey) {
        case "prix":
          diff = (a.prixM2Existant || 0) - (b.prixM2Existant || 0);
          break;
        case "commune":
          diff = a.commune.localeCompare(b.commune);
          break;
        case "tendance":
          diff = getTendanceSort(a) - getTendanceSort(b);
          break;
        case "transactions":
          diff = (a.nbTransactions || 0) - (b.nbTransactions || 0);
          break;
      }
      return sortAsc ? diff : -diff;
    });
    return sorted;
  }, [allCommunes, sortKey, sortAsc]);

  // Top 5 hausses / baisses
  const { topHausses, topBaisses } = useMemo(() => {
    const withQuartiers = allCommunes.filter((c) => c.quartiers && c.quartiers.length > 0);
    // For communes with quartier data, compute % of quartiers in hausse
    const scored = withQuartiers.map((c) => {
      const haussePct = c.quartiers!.filter((q) => q.tendance === "hausse").length / c.quartiers!.length;
      const baissePct = c.quartiers!.filter((q) => q.tendance === "baisse").length / c.quartiers!.length;
      return { commune: c, haussePct, baissePct };
    });
    // For communes without quartiers, use existant vs annonces spread
    const withoutQuartiers = allCommunes
      .filter((c) => !c.quartiers || c.quartiers.length === 0)
      .filter((c) => c.prixM2Existant && c.prixM2Annonces)
      .map((c) => {
        const ecart = ((c.prixM2Annonces || 0) - (c.prixM2Existant || 0)) / (c.prixM2Existant || 1);
        return { commune: c, haussePct: Math.max(0, ecart), baissePct: Math.max(0, -ecart) };
      });
    const all = [...scored, ...withoutQuartiers];
    const topH = [...all].sort((a, b) => b.haussePct - a.haussePct).slice(0, 5).map((s) => s.commune);
    const topB = [...all].sort((a, b) => b.baissePct - a.baissePct).slice(0, 5).map((s) => s.commune);
    return { topHausses: topH, topBaisses: topB };
  }, [allCommunes]);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(false);
    }
  }

  const sortIcon = (key: SortKey) => {
    if (sortKey !== key) return null;
    return sortAsc ? " \u25B2" : " \u25BC";
  };

  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted mb-4">
          <Link href="/" className="hover:text-navy">{t("breadcrumb_home")}</Link> &gt;{" "}
          <span className="text-slate">{t("breadcrumb_index")}</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted">
          {t("subtitle")}
        </p>

        {/* Indice composite tevaxia */}
        {(() => {
          const current = getCurrentIndex();
          const changeYoY = getIndexChange(4);
          const interp = interpretIndex(current.index);
          return (
            <div className="mt-6 rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-xs uppercase tracking-wider text-white/60">Indice tevaxia — santé marché immobilier LU</div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="text-5xl font-bold">{current.index.toFixed(1)}</span>
                    <span className={`text-lg font-semibold ${interp.color === "text-emerald-700" ? "text-emerald-300" : interp.color === "text-rose-700" ? "text-rose-300" : interp.color === "text-amber-700" ? "text-amber-300" : "text-white/90"}`}>
                      {interp.label}
                    </span>
                  </div>
                  <div className="mt-1 text-xs text-white/60">
                    {current.quarter} · base 100 = Q1 2020
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-white/60">Évolution 1 an</div>
                  <div className={`mt-2 text-2xl font-semibold font-mono ${changeYoY.pct >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {changeYoY.pct >= 0 ? "+" : ""}{changeYoY.pct.toFixed(1)} %
                  </div>
                  <div className="mt-1 text-[10px] text-white/50">
                    Mise à jour : {new Date(TEVAXIA_INDEX_LAST_UPDATE).toLocaleDateString("fr-LU")}
                  </div>
                </div>
              </div>

              {/* Chart historique */}
              <div className="mt-6 -mx-2">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={TEVAXIA_INDEX} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                    <XAxis dataKey="quarter" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} />
                    <YAxis tick={{ fontSize: 9, fill: "rgba(255,255,255,0.7)" }} domain={["dataMin - 5", "dataMax + 5"]} />
                    <RechartsTooltip
                      formatter={(v: unknown) => typeof v === "number" ? v.toFixed(1) : "—"}
                      contentStyle={{ fontSize: 11, borderRadius: 8, backgroundColor: "rgba(0,0,0,0.8)", border: "none", color: "#fff" }}
                    />
                    <ReferenceLine y={100} stroke="rgba(255,255,255,0.4)" strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="index" stroke="#ffd700" strokeWidth={2.5} dot={{ r: 3, fill: "#ffd700" }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-xs">
                <div>
                  <div className="text-white/60">Prix immo</div>
                  <div className="mt-0.5 font-mono font-semibold">{current.prixImmoIndex.toFixed(0)} <span className="text-white/50 text-[10px]">pond. 50 %</span></div>
                </div>
                <div>
                  <div className="text-white/60">Taux hypo</div>
                  <div className="mt-0.5 font-mono font-semibold">{current.tauxHypo.toFixed(2)} % <span className="text-white/50 text-[10px]">pond. 25 %</span></div>
                </div>
                <div>
                  <div className="text-white/60">ICV construction</div>
                  <div className="mt-0.5 font-mono font-semibold">{current.icvConstruction.toFixed(0)} <span className="text-white/50 text-[10px]">pond. 15 %</span></div>
                </div>
                <div>
                  <div className="text-white/60">Yield brut LU</div>
                  <div className="mt-0.5 font-mono font-semibold">{current.yieldBrutMoyen.toFixed(1)} % <span className="text-white/50 text-[10px]">pond. 10 %</span></div>
                </div>
              </div>
              <p className="mt-4 text-[10px] text-white/60 italic">
                Indice composite propriétaire tevaxia.lu. Sources : STATEC (prix immo, ICV),
                BCL (taux hypothécaire moyen 20 ans), Observatoire de l&apos;Habitat (yield brut).
                &gt;110 = marché fort, 100-110 = équilibré, 90-100 = tendu, &lt;90 = préoccupant.
              </p>
            </div>
          );
        })()}

        {/* National summary card */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-xs text-muted">{t("avg_price_lux")}</div>
              <div className="text-2xl font-bold text-navy">{formatEUR(summary.avgPrix)}/m&sup2;</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted">{t("annual_trend")}</div>
              <div className="text-2xl font-bold text-success">+2,1%/{t("year_abbr")}</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted">{t("transactions_last_quarter")}</div>
              <div className="text-2xl font-bold text-navy">{summary.totalTransactions.toLocaleString("fr-LU")}</div>
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-2">{t("monthly_analysis")}</h2>
          <div className="text-sm text-muted leading-relaxed space-y-2">
            <p>
              {t.rich("analysis_paragraph_1", {
                price: () => <strong className="text-slate">{formatEUR(summary.avgPrix)}/m&sup2;</strong>,
              })}
            </p>
            <p>
              {t("analysis_paragraph_2", { transactions: summary.totalTransactions.toLocaleString("fr-LU") })}
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <PriceEvolutionChart />
          <PriceIndexChart />
        </div>

        {/* Top 5 Hausses / Baisses */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Top 5 Hausses */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs">&#x2197;</span>
              {t("top5_up")}
            </h2>
            <div className="space-y-2">
              {topHausses.map((c, i) => {
                return (
                  <Link
                    key={c.commune}
                    href={`/commune/${slugifyCommune(c.commune)}`}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-4">{i + 1}.</span>
                      <span className="font-medium text-slate">{c.commune}</span>
                      <span className="text-xs text-muted">({c.canton})</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-navy">
                      {c.prixM2Existant ? formatEUR(c.prixM2Existant) : "---"}/m&sup2;
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Top 5 Baisses */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs">&#x2198;</span>
              {t("top5_down")}
            </h2>
            <div className="space-y-2">
              {topBaisses.map((c, i) => {
                return (
                  <Link
                    key={c.commune}
                    href={`/commune/${slugifyCommune(c.commune)}`}
                    className="flex items-center justify-between text-sm py-1.5 px-2 rounded-lg hover:bg-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted w-4">{i + 1}.</span>
                      <span className="font-medium text-slate">{c.commune}</span>
                      <span className="text-xs text-muted">({c.canton})</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-navy">
                      {c.prixM2Existant ? formatEUR(c.prixM2Existant) : "---"}/m&sup2;
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full communes table */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-navy mb-4">
            {t("all_communes", { count: summary.nbCommunes })}
          </h2>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background text-left">
                  <th
                    className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("commune")}
                  >
                    {t("th_commune")}{sortIcon("commune")}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">{t("th_canton")}</th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-right cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("prix")}
                  >
                    {t("th_price_m2")}{sortIcon("prix")}
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-center cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("tendance")}
                  >
                    {t("th_trend")}{sortIcon("tendance")}
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-right cursor-pointer hover:text-navy transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("transactions")}
                  >
                    {t("th_transactions")}{sortIcon("transactions")}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted text-right hidden md:table-cell">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedCommunes.map((c) => {
                  const badge = getTendanceBadge(c);
                  const score = computeMarketScore(c);
                  const scoreColor = getScoreColor(score.level);
                  return (
                    <tr key={c.commune} className="border-b border-card-border last:border-0 hover:bg-background/50 transition-colors">
                      <td className="px-4 py-3">
                        <Link
                          href={`/commune/${slugifyCommune(c.commune)}`}
                          className="font-medium text-navy hover:underline"
                        >
                          {c.commune}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted hidden sm:table-cell">{c.canton}</td>
                      <td className="px-4 py-3 text-right font-mono font-semibold text-navy">
                        {c.prixM2Existant ? formatEUR(c.prixM2Existant) : "---"}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-medium ${badge.color}`}>
                          {t(badge.labelKey)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-muted hidden sm:table-cell">
                        {c.nbTransactions ?? "---"}
                      </td>
                      <td className="px-4 py-3 text-right hidden md:table-cell">
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-medium ${scoreColor}`}>
                          {score.score}/100
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Links */}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/carte"
            className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
          >
            {t("view_map")}
          </Link>
          <Link
            href="/estimation"
            className="rounded-lg border border-navy px-5 py-2.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors"
          >
            {t("estimate_property")}
          </Link>
        </div>

        {/* Source */}
        <p className="mt-6 text-xs text-muted text-center">
          {t("source")}
        </p>
      </div>
    </div>

    <SEOContent
      ns="indices"
      sections={[
        { titleKey: "indiceTitle", contentKey: "indiceContent" },
        { titleKey: "methodologieTitle", contentKey: "methodologieContent" },
        { titleKey: "tendancesTitle", contentKey: "tendancesContent" },
        { titleKey: "topCommunesTitle", contentKey: "topCommunesContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/estimation", labelKey: "estimation" },
        { href: "/marche", labelKey: "marche" },
        { href: "/carte", labelKey: "carte" },
      ]}
    />
    </>
  );
}
