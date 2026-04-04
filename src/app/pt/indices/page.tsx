"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { getAllCommunes, getMarketDataCommune, type MarketDataCommune } from "@/lib/market-data";
import { computeMarketScore, getScoreColor, getScoreBarColor } from "@/lib/market-score";
import { formatEUR } from "@/lib/calculations";
import { PriceEvolutionChart, PriceIndexChart } from "@/components/PriceChart";

type SortKey = "prix" | "commune" | "tendance" | "transactions";

function getTendanceBadge(commune: MarketDataCommune): { label: string; color: string } {
  if (commune.quartiers && commune.quartiers.length > 0) {
    const counts = { hausse: 0, stable: 0, baisse: 0 };
    for (const q of commune.quartiers) {
      counts[q.tendance]++;
    }
    const dominant = (Object.entries(counts) as [keyof typeof counts, number][])
      .sort((a, b) => b[1] - a[1])[0][0];
    if (dominant === "hausse") return { label: "Rising", color: "bg-green-100 text-green-700" };
    if (dominant === "baisse") return { label: "Declining", color: "bg-red-100 text-red-700" };
    return { label: "Stable", color: "bg-gray-100 text-gray-600" };
  }
  // Without quartier data, infer from existant vs annonces spread
  if (commune.prixM2Existant && commune.prixM2Annonces) {
    const ecart = (commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant;
    if (ecart > 0.05) return { label: "Rising", color: "bg-green-100 text-green-700" };
    if (ecart < -0.02) return { label: "Declining", color: "bg-red-100 text-red-700" };
  }
  return { label: "Stable", color: "bg-gray-100 text-gray-600" };
}

function getTendanceSort(commune: MarketDataCommune): number {
  const b = getTendanceBadge(commune);
  if (b.label === "Rising") return 2;
  if (b.label === "Declining") return 0;
  return 1;
}

export default function IndicesPage() {
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

  // Top 5 gainers / decliners
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
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted mb-4">
          <Link href="/pt" className="hover:text-navy">Home</Link> &gt;{" "}
          <span className="text-slate">tevaxia Index</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">
          tevaxia Index &mdash; March 2026
        </h1>
        <p className="mt-2 text-muted">
          Monthly property price index by municipality in Luxembourg
        </p>

        {/* National summary card */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="text-center">
              <div className="text-xs text-muted">Luxembourg average price</div>
              <div className="text-2xl font-bold text-navy">{formatEUR(summary.avgPrix)}/m&sup2;</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted">Annual trend</div>
              <div className="text-2xl font-bold text-success">+2.1%/yr</div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted">Transactions (last quarter)</div>
              <div className="text-2xl font-bold text-navy">{summary.totalTransactions.toLocaleString("en")}</div>
            </div>
          </div>
        </div>

        {/* Narrative */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-2">Monthly analysis</h2>
          <div className="text-sm text-muted leading-relaxed space-y-2">
            <p>
              In March 2026, the Luxembourg market is showing signs of recovery after
              the 2022&ndash;2023 correction. The national average price stands at{" "}
              <strong className="text-slate">{formatEUR(summary.avgPrix)}/m&sup2;</strong>,
              up 2.1% year-on-year. Municipalities in the canton of Luxembourg remain the most
              expensive, but the strongest gains are seen in developing secondary hubs.
            </p>
            <p>
              Transaction volume ({summary.totalTransactions.toLocaleString("en")} in the
              last quarter) confirms a return of liquidity after the trough
              observed in 2023. Interest rates, after reaching their peak,
              are stabilising, which supports demand.
            </p>
          </div>
        </div>

        {/* Charts */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <PriceEvolutionChart />
          <PriceIndexChart />
        </div>

        {/* Top 5 Gainers / Decliners */}
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {/* Top 5 Gainers */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-green-700 text-xs">&#x2197;</span>
              Top 5 gainers
            </h2>
            <div className="space-y-2">
              {topHausses.map((c, i) => {
                const badge = getTendanceBadge(c);
                return (
                  <Link
                    key={c.commune}
                    href={`/en/commune/${c.commune.toLowerCase().replace(/\s+/g, "-")}`}
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

          {/* Top 5 Decliners */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="text-base font-semibold text-navy mb-3 flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-red-700 text-xs">&#x2198;</span>
              Top 5 decliners
            </h2>
            <div className="space-y-2">
              {topBaisses.map((c, i) => {
                const badge = getTendanceBadge(c);
                return (
                  <Link
                    key={c.commune}
                    href={`/en/commune/${c.commune.toLowerCase().replace(/\s+/g, "-")}`}
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
            All municipalities ({summary.nbCommunes})
          </h2>
          <div className="overflow-x-auto rounded-xl border border-card-border bg-card shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border bg-background text-left">
                  <th
                    className="px-4 py-3 font-medium text-muted cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("commune")}
                  >
                    Municipality{sortIcon("commune")}
                  </th>
                  <th className="px-4 py-3 font-medium text-muted hidden sm:table-cell">Canton</th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-right cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("prix")}
                  >
                    Price/m&sup2;{sortIcon("prix")}
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-center cursor-pointer hover:text-navy transition-colors"
                    onClick={() => handleSort("tendance")}
                  >
                    Trend{sortIcon("tendance")}
                  </th>
                  <th
                    className="px-4 py-3 font-medium text-muted text-right cursor-pointer hover:text-navy transition-colors hidden sm:table-cell"
                    onClick={() => handleSort("transactions")}
                  >
                    Transactions{sortIcon("transactions")}
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
                          href={`/en/commune/${c.commune.toLowerCase().replace(/\s+/g, "-")}`}
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
                          {badge.label}
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
            href="/pt/carte"
            className="rounded-lg bg-navy px-5 py-2.5 text-sm font-medium text-white hover:bg-navy-light transition-colors"
          >
            View interactive map
          </Link>
          <Link
            href="/pt/estimation"
            className="rounded-lg border border-navy px-5 py-2.5 text-sm font-medium text-navy hover:bg-navy/5 transition-colors"
          >
            Estimate a property
          </Link>
        </div>

        {/* Source */}
        <p className="mt-6 text-xs text-muted text-center">
          Source: Observatoire de l'Habitat (data.public.lu), STATEC. Indicative data, updated quarterly.
          Last update: March 2026.
        </p>
      </div>
    </div>
  );
}
