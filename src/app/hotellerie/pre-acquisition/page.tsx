"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { computePreAcquisition, defaultDeal, type PreAcqDeal } from "@/lib/hotellerie/pre-acquisition";
import type { HotelCategory } from "@/lib/hotellerie/types";

const STORAGE_KEY = "tevaxia-hotel-preacq-deal";

function fmtEUR(n: number, digits = 0): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: digits }).format(n);
}
function fmtPct(n: number, digits = 1): string {
  if (!isFinite(n)) return "—";
  return `${(n * 100).toFixed(digits)} %`;
}
function fmtNum(n: number, digits = 2): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { maximumFractionDigits: digits }).format(n);
}

export default function PreAcquisitionPage() {
  const t = useTranslations("hotelPreAcq");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [deal, setDeal] = useState<PreAcqDeal>(defaultDeal());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setDeal(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(deal)); } catch {}
  }, [deal, hydrated]);

  const result = useMemo(() => computePreAcquisition(deal), [deal]);

  const update = <K extends keyof PreAcqDeal>(k: K, v: PreAcqDeal[K]) => setDeal({ ...deal, [k]: v });

  const scoreColor =
    result.score >= 70 ? "bg-emerald-600" :
    result.score >= 50 ? "bg-amber-500" :
    "bg-rose-600";

  const scoreLabel =
    result.score >= 70 ? t("scoreGo") :
    result.score >= 50 ? t("scoreWarn") :
    t("scoreNoGo");

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <button onClick={() => { if (confirm(t("resetConfirm"))) setDeal(defaultDeal()); }}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
          {t("reset")}
        </button>
      </div>

      {/* Score global */}
      <section className={`${scoreColor} rounded-xl p-5 text-white mb-6 shadow-lg`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">{t("scoreLabelHeader")}</div>
            <div className="text-4xl font-bold mt-1">{result.score.toFixed(0)}/100</div>
            <div className="text-sm font-semibold mt-1 opacity-95">{scoreLabel}</div>
          </div>
          <div className="text-right">
            <div className="text-xs uppercase tracking-wider font-semibold opacity-80">{t("askingPrice")}</div>
            <div className="text-2xl font-bold mt-1">{fmtEUR(deal.asking_price)}</div>
            <div className="text-xs opacity-90 mt-1">
              {t("fairValue")} : {fmtEUR(result.fair_value)} ·{" "}
              <span className={result.ask_vs_fair_pct > 0.05 ? "text-rose-100" : "text-emerald-100"}>
                {result.ask_vs_fair_pct > 0 ? "+" : ""}{fmtPct(result.ask_vs_fair_pct)}
              </span>
            </div>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-5">
          {result.signals.map((s, i) => (
            <div key={i} className="bg-white/10 rounded-lg p-2 backdrop-blur">
              <div className="flex items-center gap-1.5 text-[11px] font-semibold">
                <span>{s.status === "ok" ? "✓" : s.status === "warn" ? "⚠" : "✗"}</span>
                <span>{s.label}</span>
              </div>
              <div className="text-[11px] opacity-90 mt-0.5">{s.detail}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[380px_1fr]">
        {/* Inputs */}
        <aside className="space-y-4">
          <Section title={t("sections.target")}>
            <Field label={t("fields.name")} value={deal.name} onChange={(v) => update("name", v)} />
            <Field label={t("fields.commune")} value={deal.commune} onChange={(v) => update("commune", v)} />
            <SelectField label={t("fields.category")} value={deal.category}
              options={[
                { v: "budget", l: t("categories.budget") },
                { v: "midscale", l: t("categories.midscale") },
                { v: "upscale", l: t("categories.upscale") },
                { v: "luxury", l: t("categories.luxury") },
              ]}
              onChange={(v) => update("category", v as HotelCategory)} />
            <NumField label={t("fields.nbRooms")} value={deal.nb_rooms} onChange={(v) => update("nb_rooms", v)} />
            <NumField label={t("fields.askingPriceEur")} value={deal.asking_price} step={50000} onChange={(v) => update("asking_price", v)} />
          </Section>

          <Section title={t("sections.operation")}>
            <NumField label={t("fields.adr")} value={deal.adr} step={1} onChange={(v) => update("adr", v)} />
            <NumField label={t("fields.occupancy")} value={deal.occupancy} step={0.01} onChange={(v) => update("occupancy", v)} />
            <NumField label={t("fields.fbRevenue")} value={deal.fb_revenue} step={10000} onChange={(v) => update("fb_revenue", v)} />
            <NumField label={t("fields.otherRevenue")} value={deal.other_revenue} step={5000} onChange={(v) => update("other_revenue", v)} />
            <NumField label={t("fields.staffCost")} value={deal.staff_cost} step={10000} onChange={(v) => update("staff_cost", v)} />
            <NumField label={t("fields.energyCost")} value={deal.energy_cost} step={5000} onChange={(v) => update("energy_cost", v)} />
            <NumField label={t("fields.otherOpex")} value={deal.other_opex} step={10000} onChange={(v) => update("other_opex", v)} />
            <NumField label={t("fields.taxeFonciere")} value={deal.taxe_fonciere} step={1000} onChange={(v) => update("taxe_fonciere", v)} />
          </Section>

          <Section title={t("sections.growth")}>
            <NumField label={t("fields.adrGrowth")} value={deal.adr_growth_pct} step={0.005} onChange={(v) => update("adr_growth_pct", v)} />
            <NumField label={t("fields.occGrowth")} value={deal.occupancy_growth_pct} step={0.005} onChange={(v) => update("occupancy_growth_pct", v)} />
            <NumField label={t("fields.opexInflation")} value={deal.opex_inflation_pct} step={0.005} onChange={(v) => update("opex_inflation_pct", v)} />
          </Section>

          <Section title={t("sections.financing")}>
            <NumField label={t("fields.equity")} value={deal.equity} step={100000} onChange={(v) => update("equity", v)} />
            <NumField label={t("fields.debt")} value={deal.debt} step={100000} onChange={(v) => update("debt", v)} />
            <NumField label={t("fields.debtRate")} value={deal.debt_rate_pct} step={0.005} onChange={(v) => update("debt_rate_pct", v)} />
            <NumField label={t("fields.debtTerm")} value={deal.debt_term_years} step={1} onChange={(v) => update("debt_term_years", v)} />
          </Section>

          <Section title={t("sections.capex")}>
            <NumField label={t("fields.capexEntry")} value={deal.capex_entry} step={50000} onChange={(v) => update("capex_entry", v)} />
            <NumField label={t("fields.capexReserve")} value={deal.capex_reserve_pct} step={0.005} onChange={(v) => update("capex_reserve_pct", v)} />
            <SelectField label={t("fields.exitHorizon")}
              value={String(deal.exit_year)}
              options={[{ v: "5", l: t("years.5") }, { v: "7", l: t("years.7") }, { v: "10", l: t("years.10") }]}
              onChange={(v) => update("exit_year", Number(v) as 5 | 7 | 10)} />
            <NumField label={t("fields.exitCapRate")} value={deal.exit_cap_rate} step={0.005} onChange={(v) => update("exit_cap_rate", v)} />
          </Section>
        </aside>

        {/* Results */}
        <main className="space-y-5 min-w-0">
          {/* Snapshot */}
          <Card title={t("cards.snapshot")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Stat label={t("stats.revpar")} value={`${fmtNum(result.current_revpar, 1)} €`} />
              <Stat label={t("stats.totalRevenue")} value={fmtEUR(result.current_total_revenue)} />
              <Stat label={t("stats.gop")} value={fmtEUR(result.current_gop)} sub={fmtPct(result.current_gop_margin)} />
              <Stat label={t("stats.ebitda")} value={fmtEUR(result.current_ebitda)} sub={fmtPct(result.current_ebitda_margin)} />
              <Stat label={t("stats.revPerRoom")} value={fmtEUR(result.current_total_revenue / Math.max(1, deal.nb_rooms))} />
              <Stat label={t("stats.ebitdaPerRoom")} value={fmtEUR(result.current_ebitda / Math.max(1, deal.nb_rooms))} />
            </div>
          </Card>

          {/* Triangulation valorisation */}
          <Card title={t("cards.valuation")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <MethodCard label={t("stats.ebitdaMultiple")} value={result.val_ebitda_multiple}
                note={`EBITDA × ${(result.val_ebitda_multiple / Math.max(1, result.current_ebitda)).toFixed(1)}`} />
              <MethodCard label={t("stats.pricePerKey")} value={result.val_price_per_key}
                note={`${fmtEUR(result.val_price_per_key / Math.max(1, deal.nb_rooms))} ${t("stats.perRoom")}`} />
              <MethodCard label={t("stats.dcfMethod")} value={result.val_dcf} note={t("stats.dcfDiscountNote")} />
            </div>
            <div className="mt-4 rounded-xl bg-navy/5 border border-navy/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wider font-semibold text-muted">{t("stats.fairValueWeighted")}</div>
                  <div className="text-xl font-bold text-navy mt-1">{fmtEUR(result.fair_value)}</div>
                  <div className="text-[11px] text-muted mt-0.5">{t("stats.weightingNote")}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider font-semibold text-muted">{t("stats.gapVsAsking")}</div>
                  <div className={`text-xl font-bold mt-1 ${result.ask_vs_fair_pct > 0.05 ? "text-rose-600" : result.ask_vs_fair_pct < -0.05 ? "text-emerald-600" : "text-amber-600"}`}>
                    {result.ask_vs_fair_pct > 0 ? "+" : ""}{fmtPct(result.ask_vs_fair_pct)}
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Financement */}
          <Card title={t("cards.financing")}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label={t("stats.ltv")} value={fmtPct(result.ltv)} sub={`${fmtEUR(deal.debt)} / ${fmtEUR(deal.asking_price)}`} />
              <Stat label={t("stats.equityDebt")} value={`${fmtEUR(deal.equity)} / ${fmtEUR(deal.debt)}`} />
              <Stat label={t("stats.loanPayment")} value={fmtEUR(result.loan_payment_annual)}
                sub={t("stats.loanPaymentSub", { rate: fmtPct(deal.debt_rate_pct), years: deal.debt_term_years })} />
              <Stat label={t("stats.dscrYear1")}
                value={`${fmtNum(result.dscr_year1, 2)}x`}
                sub={result.dscr_year1 >= 1.35 ? t("stats.dscrBankable") : result.dscr_year1 >= 1.15 ? t("stats.dscrLimit") : t("stats.dscrRefuse")}
                tone={result.dscr_year1 >= 1.35 ? "emerald" : result.dscr_year1 >= 1.15 ? "amber" : "rose"} />
            </div>
          </Card>

          {/* Business plan */}
          <Card title={t("cards.businessPlan")}>
            <div className="overflow-x-auto -mx-2 px-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="text-left py-2 text-muted font-semibold">{t("table.year")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.revenue")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.gop")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.ebitda")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.margin")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.dscr")}</th>
                    <th className="text-right py-2 text-muted font-semibold">{t("table.cfEquity")}</th>
                  </tr>
                </thead>
                <tbody>
                  {result.projection.map((p) => {
                    const isExit = p.year === deal.exit_year;
                    return (
                      <tr key={p.year} className={`border-b border-card-border/50 ${isExit ? "bg-emerald-50/40 font-semibold" : ""}`}>
                        <td className="py-1.5">
                          Y{p.year}
                          {isExit && <span className="ml-2 text-[10px] bg-emerald-600 text-white rounded px-1.5 py-0.5">{t("table.exit")}</span>}
                        </td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.total_revenue)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.gop)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtEUR(p.ebitda)}</td>
                        <td className="py-1.5 text-right font-mono">{fmtPct(p.ebitda_margin)}</td>
                        <td className={`py-1.5 text-right font-mono ${p.dscr >= 1.35 ? "text-emerald-700" : p.dscr >= 1.15 ? "text-amber-700" : "text-rose-700"}`}>
                          {fmtNum(p.dscr, 2)}x
                        </td>
                        <td className={`py-1.5 text-right font-mono ${p.cash_flow_to_equity >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {fmtEUR(p.cash_flow_to_equity)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Exit + IRR */}
          <Card title={t("cards.exit", { year: deal.exit_year })}>
            <div className="grid gap-3 sm:grid-cols-4">
              <Stat label={t("exit.exitEbitda")} value={fmtEUR(result.exit_ebitda)} />
              <Stat label={t("exit.exitValue")} value={fmtEUR(result.exit_value)}
                sub={t("exit.capRateNote", { rate: fmtPct(deal.exit_cap_rate) })} />
              <Stat label={t("exit.debtBalance")} value={fmtEUR(result.debt_balance_at_exit)} />
              <Stat label={t("exit.equityReturn")} value={fmtEUR(result.equity_return)} tone="emerald" />
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-xs uppercase tracking-wider font-semibold text-emerald-900">{t("exit.irrEquity")}</div>
                <div className="text-3xl font-bold text-emerald-700 mt-1">{fmtPct(result.irr_equity)}</div>
                <div className="text-[11px] text-emerald-900/80 mt-1">
                  {result.irr_equity >= 0.15 ? t("exit.irrExcellent") :
                   result.irr_equity >= 0.10 ? t("exit.irrMarket") :
                   result.irr_equity >= 0.05 ? t("exit.irrBelow") :
                   t("exit.irrInsufficient")}
                </div>
              </div>
              <div className="rounded-xl border border-navy/20 bg-navy/5 p-4">
                <div className="text-xs uppercase tracking-wider font-semibold text-navy">{t("exit.equityMultiple")}</div>
                <div className="text-3xl font-bold text-navy mt-1">{fmtNum(result.equity_multiple, 2)}x</div>
                <div className="text-[11px] text-navy/70 mt-1">
                  {t("exit.equityMultipleSub", { m: fmtNum(result.equity_multiple, 2), y: deal.exit_year })}
                </div>
              </div>
            </div>
          </Card>

          {/* Outils liés */}
          <Card title={t("cards.tools")}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <LinkCard href={`${lp}/hotellerie/due-diligence`} title={t("tools.ddTitle")} desc={t("tools.ddDesc")} />
              <LinkCard href={`${lp}/hotellerie/valorisation`} title={t("tools.valTitle")} desc={t("tools.valDesc")} />
              <LinkCard href={`${lp}/hotellerie/dscr`} title={t("tools.dscrTitle")} desc={t("tools.dscrDesc")} />
              <LinkCard href={`${lp}/hotellerie/compset`} title={t("tools.compsetTitle")} desc={t("tools.compsetDesc")} />
              <LinkCard href={`${lp}/hotellerie/capex`} title={t("tools.capexTitle")} desc={t("tools.capexDesc")} />
              <LinkCard href={`${lp}/hotellerie/score-e2`} title={t("tools.e2Title")} desc={t("tools.e2Desc")} />
            </div>
          </Card>
        </main>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider font-bold text-navy mb-2.5">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: {
  label: string; value: number; step?: number; onChange: (v: number) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input type="number" value={value} step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm text-right font-mono" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: Array<{ v: string; l: string }>; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">{title}</h2>
      {children}
    </section>
  );
}

function Stat({ label, value, sub, tone }: {
  label: string; value: string; sub?: string; tone?: "emerald" | "amber" | "rose";
}) {
  const border =
    tone === "emerald" ? "border-emerald-200 bg-emerald-50/40" :
    tone === "amber" ? "border-amber-200 bg-amber-50/40" :
    tone === "rose" ? "border-rose-200 bg-rose-50/40" :
    "border-card-border bg-background/30";
  const txt =
    tone === "emerald" ? "text-emerald-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "rose" ? "text-rose-900" :
    "text-navy";
  return (
    <div className={`rounded-lg border ${border} p-3`}>
      <div className="text-[11px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`text-lg font-bold mt-0.5 ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted mt-0.5">{sub}</div>}
    </div>
  );
}

function MethodCard({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <div className="rounded-xl border border-card-border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className="text-xl font-bold text-navy mt-1">{fmtEUR(value)}</div>
      <div className="text-[10px] text-muted mt-0.5">{note}</div>
    </div>
  );
}

function LinkCard({ href, title, desc }: { href: string; title: string; desc: string }) {
  return (
    <Link href={href}
      className="rounded-lg border border-card-border bg-background/30 p-3 hover:border-navy hover:bg-navy/5 transition-colors block">
      <div className="text-xs font-bold text-navy">{title}</div>
      <div className="text-[11px] text-muted mt-0.5">{desc}</div>
    </Link>
  );
}
