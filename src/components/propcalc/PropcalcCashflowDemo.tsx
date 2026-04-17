"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  LineChart,
  Line,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { calculateInvestorCashFlow } from "@/lib/propcalc/cashflow";
import { calculateAcquisitionFees } from "@/lib/propcalc/fees";
import { getCountryData } from "@/lib/propcalc/countries";

interface ProjectionRow {
  year: number;
  rentalIncome: number;
  operatingExpenses: number;
  debtService: number;
  yearCashFlow: number;
  cumulativeCashFlow: number;
  propertyValue: number;
  remainingLoan: number;
  equity: number;
}

type ProjectionResult = {
  projection: ProjectionRow[];
  monthlyCashFlow: number;
  grossYield: number;
  netYield: number;
  cashOnCash: number;
};

const COUNTRY_DEFAULTS: Record<string, { price: number; rent: number; rate: number; label: string; flag: string; appreciation: number }> = {
  lu: { price: 750_000, rent: 2_500, rate: 0.033, label: "Luxembourg", flag: "\u{1F1F1}\u{1F1FA}", appreciation: 0.015 },
  fr: { price: 350_000, rent: 1_400, rate: 0.032, label: "France", flag: "\u{1F1EB}\u{1F1F7}", appreciation: -0.01 },
  de: { price: 450_000, rent: 1_600, rate: 0.038, label: "Deutschland", flag: "\u{1F1E9}\u{1F1EA}", appreciation: -0.02 },
  be: { price: 320_000, rent: 1_250, rate: 0.034, label: "Belgique", flag: "\u{1F1E7}\u{1F1EA}", appreciation: 0.005 },
  es: { price: 280_000, rent: 1_200, rate: 0.035, label: "España", flag: "\u{1F1EA}\u{1F1F8}", appreciation: 0.06 },
};

function fmtEUR(v: number): string {
  return new Intl.NumberFormat("fr-LU", { maximumFractionDigits: 0 }).format(Math.round(v)) + " €";
}

export default function PropcalcCashflowDemo() {
  const t = useTranslations("propcalc");
  const [countryCode, setCountryCode] = useState("lu");
  const [price, setPrice] = useState(COUNTRY_DEFAULTS.lu.price);
  const [downPct, setDownPct] = useState(20);
  const [monthlyRent, setMonthlyRent] = useState(COUNTRY_DEFAULTS.lu.rent);
  const [ratePct, setRatePct] = useState(COUNTRY_DEFAULTS.lu.rate * 100);

  function onCountryChange(c: string) {
    const d = COUNTRY_DEFAULTS[c];
    if (!d) return;
    setCountryCode(c);
    setPrice(d.price);
    setMonthlyRent(d.rent);
    setRatePct(d.rate * 100);
  }

  const result = useMemo<ProjectionResult | null>(() => {
    const countryData = getCountryData(countryCode);
    if (!countryData) return null;
    try {
      const downPayment = price * (downPct / 100);
      const fees = calculateAcquisitionFees({
        propertyPrice: price,
        countryCode,
        regionCode: "",
        isNew: false,
        isPrimaryResidence: false,
        isFirstTimeBuyer: false,
        loanAmount: price - downPayment,
        buyerAge: 0,
        countryData,
      } as Parameters<typeof calculateAcquisitionFees>[0]) as { total: number };

      const apprec = COUNTRY_DEFAULTS[countryCode]?.appreciation ?? 0.015;

      const out = calculateInvestorCashFlow({
        propertyPrice: price,
        acquisitionFees: fees.total,
        downPayment,
        annualRate: ratePct / 100,
        loanDurationYears: 25,
        monthlyRent,
        vacancyRate: 0.05,
        monthlyCharges: 150,
        annualPropertyTax: 800,
        annualInsurance: 400,
        managementRate: 0,
        annualMaintenance: price * 0.005,
        marginalTaxRate: 0.35,
        socialChargesRate: countryCode === "fr" ? 0.172 : 0,
        annualAppreciation: apprec,
        countryCode,
        countryData,
      } as Parameters<typeof calculateInvestorCashFlow>[0]) as ProjectionResult;

      return out;
    } catch {
      return null;
    }
  }, [countryCode, price, downPct, monthlyRent, ratePct]);

  const chartData = result?.projection.map((p) => ({
    year: `A${p.year}`,
    cash: Math.round(p.yearCashFlow),
    cumul: Math.round(p.cumulativeCashFlow),
    equity: Math.round(p.equity),
  })) ?? [];

  return (
    <section className="py-20 bg-gradient-to-br from-navy/5 to-teal/5">
      <div className="mx-auto max-w-5xl px-4">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-navy mb-2">{t("demoTitle")}</h2>
          <p className="text-sm text-muted max-w-2xl mx-auto">{t("demoSubtitle")}</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl bg-card border border-card-border p-5 shadow-sm lg:col-span-1">
            <h3 className="mb-3 text-sm font-semibold text-navy">{t("demoInputsTitle")}</h3>
            <div className="space-y-3">
              <label className="block">
                <span className="text-xs text-muted">{t("demoCountry")}</span>
                <select
                  value={countryCode}
                  onChange={(e) => onCountryChange(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
                >
                  {Object.entries(COUNTRY_DEFAULTS).map(([code, d]) => (
                    <option key={code} value={code}>
                      {d.flag} {d.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-xs text-muted">{t("demoPrice")}</span>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
                  min={50000}
                  step={10000}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">{t("demoDown")} ({downPct} %)</span>
                <input
                  type="range"
                  value={downPct}
                  onChange={(e) => setDownPct(Number(e.target.value))}
                  min={5}
                  max={50}
                  step={5}
                  className="mt-1 w-full"
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">{t("demoRent")}</span>
                <input
                  type="number"
                  value={monthlyRent}
                  onChange={(e) => setMonthlyRent(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
                  min={0}
                  step={50}
                />
              </label>
              <label className="block">
                <span className="text-xs text-muted">{t("demoRate")} ({ratePct.toFixed(2)} %)</span>
                <input
                  type="range"
                  value={ratePct}
                  onChange={(e) => setRatePct(Number(e.target.value))}
                  min={1}
                  max={6}
                  step={0.1}
                  className="mt-1 w-full"
                />
              </label>
            </div>

            {result && (
              <dl className="mt-4 space-y-1.5 border-t border-card-border/50 pt-4 text-xs">
                <div className="flex justify-between">
                  <dt className="text-muted">{t("demoMonthlyCF")}</dt>
                  <dd className={`font-mono font-semibold ${result.monthlyCashFlow >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                    {fmtEUR(result.monthlyCashFlow)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("demoGrossYield")}</dt>
                  <dd className="font-mono text-navy">{(result.grossYield * 100).toFixed(2)} %</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("demoNetYield")}</dt>
                  <dd className="font-mono text-navy">{(result.netYield * 100).toFixed(2)} %</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">{t("demoCoC")}</dt>
                  <dd className="font-mono text-navy">{(result.cashOnCash * 100).toFixed(2)} %</dd>
                </div>
              </dl>
            )}
          </div>

          <div className="rounded-xl bg-card border border-card-border p-5 shadow-sm lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-navy">{t("demoChartTitle")}</h3>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  formatter={(v: unknown) => (typeof v === "number" ? fmtEUR(v) : "—")}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="cash" fill="#0ea5e9" name={t("demoYearCash")} barSize={20} />
                <Line type="monotone" dataKey="cumul" stroke="#1e3a5f" strokeWidth={2.5} dot={{ r: 3 }} name={t("demoCumulCash")} />
              </ComposedChart>
            </ResponsiveContainer>

            <h3 className="mt-6 mb-3 text-sm font-semibold text-navy">{t("demoEquityTitle")}</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                <RechartsTooltip
                  formatter={(v: unknown) => (typeof v === "number" ? fmtEUR(v) : "—")}
                  contentStyle={{ fontSize: 12, borderRadius: 8 }}
                />
                <Line type="monotone" dataKey="equity" stroke="#10b981" strokeWidth={2.5} dot={{ r: 3 }} name={t("demoEquity")} />
              </LineChart>
            </ResponsiveContainer>
            <p className="mt-3 text-[10px] text-muted">{t("demoDisclaimer")}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
