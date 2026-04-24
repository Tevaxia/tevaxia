"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  analyzeStranding, simulateRetrofit, DEFAULT_RETROFIT_SCENARIOS,
  ASSET_TYPE_LABELS, LU_ENERGY_SOURCE_LABELS, EPBD_DEADLINES,
  type CrremAssetType, type LuEnergySource, type AssetInput, type StrandingResult,
} from "@/lib/crrem";
import { formatEUR } from "@/lib/calculations";
import {
  ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip,
  CartesianGrid, Legend, ReferenceLine,
} from "recharts";

const ENERGY_SOURCES: LuEnergySource[] = [
  "electricity_grid", "natural_gas", "heating_oil", "pellets",
  "district_heating", "heat_pump_air_cop3", "heat_pump_geo_cop4", "solar_thermal",
];

function initialMix(): Partial<Record<LuEnergySource, number>> {
  return { natural_gas: 20000, electricity_grid: 3500 };
}

export default function CrremPathwaysPage() {
  const t = useTranslations("esgCrrem");
  const locale = useLocale();
  const numLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const [name, setName] = useState(t("nameDefault"));
  const [assetType, setAssetType] = useState<CrremAssetType>("residential_mfh");
  const [floorAreaM2, setFloorAreaM2] = useState(150);
  const [energyMix, setEnergyMix] = useState<Partial<Record<LuEnergySource, number>>>(initialMix());
  const [retrofitIdx, setRetrofitIdx] = useState<number | null>(null);

  const assetInput: AssetInput = useMemo(() => ({
    name,
    assetType,
    floorAreaM2,
    energyMix,
  }), [name, assetType, floorAreaM2, energyMix]);

  const baseline = useMemo(() => analyzeStranding(assetInput), [assetInput]);

  const retrofit: StrandingResult | null = useMemo(() => {
    if (retrofitIdx === null) return null;
    return simulateRetrofit(assetInput, DEFAULT_RETROFIT_SCENARIOS[retrofitIdx]);
  }, [assetInput, retrofitIdx]);

  const active = retrofit ?? baseline;

  // Chart data
  const chartData = baseline.timeline.map((p, i) => ({
    year: p.year,
    pathway: Math.round(p.energyKwhM2),
    asset: Math.round(p.asset_energyKwhM2),
    retrofit: retrofit ? Math.round(retrofit.timeline[i]?.asset_energyKwhM2 ?? 0) : null,
  }));

  const carbonData = baseline.timeline.map((p, i) => ({
    year: p.year,
    pathwayC: Math.round(p.carbonKgM2 * 10) / 10,
    assetC: Math.round(p.asset_carbonKgM2 * 10) / 10,
    retrofitC: retrofit ? Math.round((retrofit.timeline[i]?.asset_carbonKgM2 ?? 0) * 10) / 10 : null,
  }));

  const totalKwh = Object.values(energyMix).reduce((s, v) => s + (v ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <Link href="/esg" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
      <div className="mt-1 flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted max-w-3xl">
            {t("pageSubtitle")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-emerald-50 text-emerald-800 px-3 py-1 text-[11px] font-semibold ring-1 ring-emerald-100">
            CRREM v3.0 · 2024
          </span>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* Inputs panel */}
        <aside className="space-y-4">
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("assetSection")}</h2>
            <div className="space-y-3 text-xs">
              <label className="block">
                <span className="text-muted">{t("nameLabel")}</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-muted">{t("assetTypeLabel")}</span>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as CrremAssetType)}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
                >
                  {(Object.keys(ASSET_TYPE_LABELS) as CrremAssetType[]).map((k) => (
                    <option key={k} value={k}>{ASSET_TYPE_LABELS[k]}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-muted">{t("floorAreaLabel")}</span>
                <input
                  type="number"
                  min={10}
                  value={floorAreaM2}
                  onChange={(e) => setFloorAreaM2(Math.max(10, Number(e.target.value)))}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm font-mono"
                />
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-1">{t("consumptionTitle")}</h2>
            <p className="text-[11px] text-muted mb-3">{t("consumptionNote", { total: totalKwh.toLocaleString(numLocale) })}</p>
            <div className="space-y-2 text-xs">
              {ENERGY_SOURCES.map((src) => (
                <div key={src} className="flex items-center gap-2">
                  <label className="flex-1 text-[11px] text-slate">{LU_ENERGY_SOURCE_LABELS[src]}</label>
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={energyMix[src] ?? 0}
                    onChange={(e) => setEnergyMix({ ...energyMix, [src]: Math.max(0, Number(e.target.value)) })}
                    className="w-24 rounded-md border border-card-border bg-background px-2 py-1 text-xs font-mono text-right"
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("scenarioTitle")}</h2>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setRetrofitIdx(null)}
                className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                  retrofitIdx === null
                    ? "border-navy bg-navy/5 text-navy font-semibold"
                    : "border-card-border text-slate hover:border-navy/40"
                }`}
              >
                {t("noScenario")}
              </button>
              {DEFAULT_RETROFIT_SCENARIOS.map((s, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setRetrofitIdx(i)}
                  className={`w-full text-left rounded-md border px-3 py-2 text-xs transition-colors ${
                    retrofitIdx === i
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold"
                      : "border-card-border text-slate hover:border-emerald-300"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Results panel */}
        <div className="space-y-4 min-w-0">
          {/* KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Kpi
              label={t("kpiEnergy")}
              value={`${Math.round(active.currentEnergyKwhM2)}`}
              unit={t("energyUnit")}
              tone={active.currentEnergyKwhM2 > baseline.timeline[0].energyKwhM2 ? "rose" : "emerald"}
            />
            <Kpi
              label={t("kpiCarbon")}
              value={`${active.currentCarbonKgM2.toFixed(1)}`}
              unit={t("carbonUnit")}
              tone={active.currentCarbonKgM2 > baseline.timeline[0].carbonKgM2 ? "rose" : "emerald"}
            />
            <Kpi
              label={t("kpiStrandingYear")}
              value={active.strandingYear ? String(active.strandingYear) : t("aligned")}
              unit={active.yearsUntilStranding != null && active.yearsUntilStranding >= 0 ? t("inYears", { n: active.yearsUntilStranding }) : active.strandingYear ? t("alreadyStranded") : t("trajectoryOk")}
              tone={
                active.strandingYear == null
                  ? "emerald"
                  : active.yearsUntilStranding != null && active.yearsUntilStranding <= 0
                  ? "rose"
                  : active.yearsUntilStranding != null && active.yearsUntilStranding < 10
                  ? "amber"
                  : "navy"
              }
            />
            <Kpi
              label={t("kpiNetZero")}
              value={active.netZeroYear ? String(active.netZeroYear) : "—"}
              unit={t("netZeroUnit")}
              tone="navy"
            />
          </div>

          {/* Gap KPIs */}
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("gapTitle")}</h2>
            <div className="grid gap-3 sm:grid-cols-3 text-xs">
              <GapRow year={2030} energy={active.gapEnergy2030} carbon={active.gapCarbon2030} t={t} />
              <GapRow year={2040} energy={active.gapEnergy2040} carbon={active.gapCarbon2040} t={t} />
              <GapRow year={2050} energy={active.gapEnergy2050} carbon={active.gapCarbon2050} t={t} />
            </div>
            {retrofit && baseline.strandingYear && (
              <div className="mt-4 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-900">
                <strong>{t("retrofitStrong")}</strong> : {t("retrofitBody", { from: baseline.strandingYear, to: retrofit.strandingYear ?? t("retrofitAligned2050") })}
                {retrofit.strandingYear == null && t("retrofitSuffixAligned")}
              </div>
            )}
          </section>

          {/* Chart énergie */}
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("energyChartTitle")}</h2>
            <div style={{ width: "100%", height: 320 }}>
              <ResponsiveContainer>
                <ComposedChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: t("energyUnit"), angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="pathway" stroke="#10b981" fill="#10b981" fillOpacity={0.12} name={t("legendPathway")} />
                  <Line type="monotone" dataKey="asset" stroke="#ef4444" strokeWidth={2} name={t("legendBaseline")} dot={false} />
                  {retrofit && <Line type="monotone" dataKey="retrofit" stroke="#1e3a5f" strokeWidth={2} strokeDasharray="5 5" name={t("legendRetrofit")} dot={false} />}
                  {EPBD_DEADLINES.map((d) => (
                    <ReferenceLine key={d.year} x={d.year} stroke="#d4a84a" strokeDasharray="2 2" label={{ value: `EPBD ${d.minClass}`, fill: "#d4a84a", fontSize: 9, position: "top" }} />
                  ))}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Chart carbone */}
          <section className="rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">{t("carbonChartTitle")}</h2>
            <div style={{ width: "100%", height: 280 }}>
              <ResponsiveContainer>
                <ComposedChart data={carbonData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} label={{ value: t("carbonUnit"), angle: -90, position: "insideLeft", style: { fontSize: 10 } }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="pathwayC" stroke="#10b981" fill="#10b981" fillOpacity={0.12} name={t("legendPathway")} />
                  <Line type="monotone" dataKey="assetC" stroke="#ef4444" strokeWidth={2} name={t("legendCarbonBaseline")} dot={false} />
                  {retrofit && <Line type="monotone" dataKey="retrofitC" stroke="#1e3a5f" strokeWidth={2} strokeDasharray="5 5" name={t("legendCarbonRetrofit")} dot={false} />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>

          {/* Compliance context */}
          <section className="rounded-xl border border-card-border bg-card p-5 text-xs text-slate space-y-2">
            <h2 className="text-sm font-semibold text-navy mb-2">{t("complianceTitle")}</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-md bg-background border border-card-border p-3">
                <div className="font-semibold text-navy mb-1">{t("epbdTitle")}</div>
                <ul className="space-y-0.5 text-[11px]">
                  {EPBD_DEADLINES.map((d) => (
                    <li key={d.year} className="flex justify-between">
                      <span className="text-muted">{d.year} : {d.description}</span>
                      <span className="font-mono font-semibold">{d.minClass}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-md bg-background border border-card-border p-3">
                <div className="font-semibold text-navy mb-1">{t("paiTitle")}</div>
                <ul className="space-y-0.5 text-[11px] text-muted">
                  <li>{t("pai2")}</li>
                  <li>{t("pai5")}</li>
                  <li>{t("pai17")}</li>
                  <li>{t("paiArt89")}</li>
                </ul>
              </div>
            </div>
            <p className="text-[10px] text-muted mt-2">
              {t("disclaimer")}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, unit, tone }: { label: string; value: string; unit?: string; tone: "emerald" | "amber" | "rose" | "navy" }) {
  const cls = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900",
    amber: "bg-amber-50 border-amber-200 text-amber-900",
    rose: "bg-rose-50 border-rose-200 text-rose-900",
    navy: "bg-navy text-white border-transparent",
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className={`text-[10px] uppercase tracking-wider ${tone === "navy" ? "text-white/70" : "opacity-80"}`}>{label}</div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {unit && <div className={`text-[10px] ${tone === "navy" ? "text-white/50" : "opacity-70"}`}>{unit}</div>}
    </div>
  );
}

type TFn = (key: string, values?: Record<string, string | number | Date>) => string;

function GapRow({ year, energy, carbon, t }: { year: number; energy: number; carbon: number; t: TFn }) {
  const aligned = energy === 0 && carbon === 0;
  const energyValue = energy > 0 ? `−${Math.round(energy)} kWh/m²` : t("gapOk");
  const carbonValue = carbon > 0 ? `−${carbon.toFixed(1)} kgCO₂/m²` : t("gapOk");
  return (
    <div className={`rounded-lg border p-3 ${aligned ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50"}`}>
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate">{year}</span>
        {aligned && <span className="text-[10px] font-bold text-emerald-700">{t("gapAligned")}</span>}
      </div>
      <div className={`mt-1 text-[11px] ${aligned ? "text-emerald-800" : "text-rose-900"}`}>
        {t("gapEnergy", { value: energyValue })}
      </div>
      <div className={`text-[11px] ${aligned ? "text-emerald-800" : "text-rose-900"}`}>
        {t("gapCarbon", { value: carbonValue })}
      </div>
    </div>
  );
}
