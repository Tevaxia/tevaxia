"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { buildPriceForecast, DEFAULT_SCENARIOS } from "@/lib/price-forecast";
import { rechercherCommune, type SearchResult, getAllCommunes, getMarketDataCommune } from "@/lib/market-data";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, ComposedChart,
} from "recharts";

export default function MarcheForecastPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("marcheForecast");

  const [communeSearch, setCommuneSearch] = useState("Luxembourg");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(() => {
    const r = rechercherCommune("Luxembourg");
    return r[0] ?? null;
  });
  const [horizon, setHorizon] = useState(24);
  const [pessimisteRate, setPessimisteRate] = useState(-3);
  const [centralRate, setCentralRate] = useState(2);
  const [optimisteRate, setOptimisteRate] = useState(5);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const basePrice = useMemo(() => {
    if (!selectedResult?.commune.commune) return 7500;
    const data = getMarketDataCommune(selectedResult.commune.commune);
    return data?.prixM2Existant ?? 7500;
  }, [selectedResult]);

  const forecast = useMemo(() => {
    const scenarios = [
      { ...DEFAULT_SCENARIOS[0], annualGrowthPct: pessimisteRate },
      { ...DEFAULT_SCENARIOS[1], annualGrowthPct: centralRate },
      { ...DEFAULT_SCENARIOS[2], annualGrowthPct: optimisteRate },
    ];
    return buildPriceForecast(basePrice, horizon, scenarios);
  }, [basePrice, horizon, pessimisteRate, centralRate, optimisteRate]);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/marche`} className="text-xs text-muted hover:text-navy">
          {t("back")}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">{t("subtitle")}</p>

        <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-emerald-800">
            {t("badgeData")}
          </span>
          <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-amber-800">
            {t("badgeDisclaimer")}
          </span>
        </div>

        {/* Input zone */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <label className="text-xs font-semibold text-navy mb-2 block">{t("commune")}</label>
            <input
              type="text"
              value={communeSearch}
              onChange={(e) => setCommuneSearch(e.target.value)}
              placeholder={t("communePlaceholder")}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              list="commune-list"
            />
            <datalist id="commune-list">
              {getAllCommunes().slice(0, 50).map((c) => <option key={c} value={c} />)}
            </datalist>
            {searchResults.length > 0 && searchResults[0].commune.commune !== selectedResult?.commune.commune && (
              <div className="mt-2 space-y-1">
                {searchResults.slice(0, 3).map((r) => (
                  <button
                    key={r.commune.commune}
                    onClick={() => {
                      setSelectedResult(r);
                      setCommuneSearch(r.commune.commune);
                    }}
                    className="block w-full text-left px-2 py-1 text-xs rounded hover:bg-navy/5"
                  >
                    {r.commune.commune} · {r.commune.prixM2Existant ? `${r.commune.prixM2Existant.toLocaleString("fr-LU")} €/m²` : "—"}
                  </button>
                ))}
              </div>
            )}

            {selectedResult && (
              <div className="mt-3 rounded-lg bg-navy/5 border border-navy/10 p-3">
                <div className="text-xs text-muted">{t("currentPrice")}</div>
                <div className="text-2xl font-mono font-bold text-navy">
                  {basePrice.toLocaleString("fr-LU")} €/m²
                </div>
                <div className="text-xs text-muted">
                  {selectedResult.commune.commune} · Q4 2025 Observatoire Habitat
                </div>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-semibold text-navy mb-1 block">
                {t("horizon")} <span className="font-mono">{horizon} {t("months")}</span>
              </label>
              <input
                type="range"
                min={6}
                max={48}
                step={6}
                value={horizon}
                onChange={(e) => setHorizon(Number(e.target.value))}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-rose-700 font-semibold">{t("pessimiste")}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={pessimisteRate}
                    onChange={(e) => setPessimisteRate(Number(e.target.value))}
                    className="w-full rounded border border-rose-200 bg-rose-50 px-1.5 py-1 text-xs font-mono"
                  />
                  <span className="text-muted">%/an</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-navy font-semibold">{t("central")}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={centralRate}
                    onChange={(e) => setCentralRate(Number(e.target.value))}
                    className="w-full rounded border border-navy/20 bg-navy/5 px-1.5 py-1 text-xs font-mono"
                  />
                  <span className="text-muted">%/an</span>
                </div>
              </div>
              <div>
                <label className="text-[10px] text-emerald-700 font-semibold">{t("optimiste")}</label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={optimisteRate}
                    onChange={(e) => setOptimisteRate(Number(e.target.value))}
                    className="w-full rounded border border-emerald-200 bg-emerald-50 px-1.5 py-1 text-xs font-mono"
                  />
                  <span className="text-muted">%/an</span>
                </div>
              </div>
            </div>
            <div className="pt-2 border-t border-card-border text-[11px] text-muted">
              {t("cagrReference", { cagr: forecast.cagrHistorical.toFixed(1) })}
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-rose-700 font-semibold">{t("pessimiste")}</div>
            <div className="mt-1 text-2xl font-mono font-bold text-rose-900">
              {forecast.endPessimiste.toLocaleString("fr-LU")} €/m²
            </div>
            <div className="text-[10px] text-rose-700">
              {((forecast.endPessimiste - forecast.basePrice) / forecast.basePrice * 100).toFixed(1)} %
            </div>
          </div>
          <div className="rounded-xl border border-navy/20 bg-navy/5 p-4">
            <div className="text-[10px] uppercase tracking-wider text-navy font-semibold">{t("central")}</div>
            <div className="mt-1 text-2xl font-mono font-bold text-navy">
              {forecast.endCentral.toLocaleString("fr-LU")} €/m²
            </div>
            <div className="text-[10px] text-navy/80">
              {((forecast.endCentral - forecast.basePrice) / forecast.basePrice * 100).toFixed(1)} %
            </div>
          </div>
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-semibold">{t("optimiste")}</div>
            <div className="mt-1 text-2xl font-mono font-bold text-emerald-900">
              {forecast.endOptimiste.toLocaleString("fr-LU")} €/m²
            </div>
            <div className="text-[10px] text-emerald-700">
              {((forecast.endOptimiste - forecast.basePrice) / forecast.basePrice * 100).toFixed(1)} %
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="mt-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-navy mb-3">{t("chartTitle")}</h2>
          <ResponsiveContainer width="100%" height={380}>
            <ComposedChart data={forecast.series}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
              <XAxis dataKey="label" tick={{ fontSize: 9 }} interval={2} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v/1000).toFixed(1)}k`} />
              <Tooltip
                formatter={(v: unknown) => typeof v === "number" ? `${v.toLocaleString("fr-LU")} €/m²` : "—"}
                contentStyle={{ fontSize: 12, borderRadius: 8 }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="historical" stroke="#6b7280" strokeWidth={2.5} dot={false} name={t("historical")} />
              <Line type="monotone" dataKey="pessimiste" stroke="#dc2626" strokeWidth={2} dot={false} strokeDasharray="5 5" name={t("pessimiste")} />
              <Line type="monotone" dataKey="central" stroke="#1e3a5f" strokeWidth={2.5} dot={false} name={t("central")} />
              <Line type="monotone" dataKey="optimiste" stroke="#059669" strokeWidth={2} dot={false} strokeDasharray="5 5" name={t("optimiste")} />
            </ComposedChart>
          </ResponsiveContainer>
          <p className="mt-3 text-[10px] text-muted">{t("chartNote")}</p>
        </div>

        {/* Methodology */}
        <div className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
          <h3 className="text-sm font-semibold text-sky-900 mb-2">{t("methodTitle")}</h3>
          <ul className="ml-4 list-disc space-y-1 text-xs text-sky-800">
            <li>{t("methodHistorical")}</li>
            <li>{t("methodRatio")}</li>
            <li>{t("methodProjection")}</li>
            <li>{t("methodDisclaimer")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
