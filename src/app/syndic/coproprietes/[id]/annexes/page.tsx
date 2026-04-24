"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import { listYears, type AccountingYear } from "@/lib/coownership-accounting";
import { buildCoownershipAnnexes, type CoownershipAnnexesBundle } from "@/lib/coownership-annexes";
import CoownershipAnnexesPdf from "@/components/CoownershipAnnexesPdf";
import { getProfile } from "@/lib/profile";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

export default function AnnexesPage() {
  const t = useTranslations("syndicAnnexes");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [years, setYears] = useState<AccountingYear[]>([]);
  const [activeYearId, setActiveYearId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<CoownershipAnnexesBundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadBase = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, ys] = await Promise.all([getCoownership(id), listYears(id)]);
      setCoown(c); setYears(ys);
      if (!activeYearId && ys.length > 0) setActiveYearId(ys[0].id);
    } catch (e) {
      setError(errMsg(e, t("errorLoad")));
    }
    setLoading(false);
  }, [id, activeYearId, t]);

  useEffect(() => { if (user) void loadBase(); }, [user, loadBase]);

  const activeYear = years.find((y) => y.id === activeYearId);

  const buildBundle = useCallback(async () => {
    if (!coown || !activeYear) return;
    setBuilding(true);
    try {
      const b = await buildCoownershipAnnexes({
        coownership: coown, yearId: activeYear.id, year: activeYear.year,
      });
      setBundle(b);
    } catch (e) {
      setError(errMsg(e, t("errorBuild")));
    }
    setBuilding(false);
  }, [coown, activeYear, t]);

  useEffect(() => { if (activeYearId && coown) void buildBundle(); }, [activeYearId, coown, buildBundle]);

  const downloadPdf = async () => {
    if (!bundle) return;
    const profile = getProfile();
    const blob = await pdf(
      <CoownershipAnnexesPdf
        bundle={bundle}
        syndic={{
          name: profile.nomComplet || profile.societe || t("defaultSyndicName"),
          address: profile.adresse,
          email: profile.email,
          phone: profile.telephone,
        }}
      />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `annexes-${coown?.name.replace(/\s+/g, "-").toLowerCase()}-${bundle.year}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading || !coown) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }

  return (
    <div className="bg-background min-h-screen py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">
          {t("backCoown", { name: coown.name })}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">
          {t("pageSubtitle")}
        </p>

        {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

        {/* Selector exercice */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {years.map((y) => (
              <button key={y.id} onClick={() => setActiveYearId(y.id)}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold ${
                  y.id === activeYearId ? "border-navy bg-navy text-white" : "border-card-border bg-card text-navy hover:bg-slate-50"
                }`}>
                {t("yearLabel", { y: y.year })}
                <span className={`ml-1 rounded-full px-1.5 py-0.5 text-[9px] font-normal ${
                  y.status === "closed" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"
                }`}>
                  {y.status === "closed" ? t("yearStatusClosed") : t("yearStatusOpen")}
                </span>
              </button>
            ))}
          </div>
          {bundle && (
            <button onClick={downloadPdf}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 0 0-2.25 2.25v9a2.25 2.25 0 0 0 2.25 2.25h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25H15M9 12l3 3m0 0 3-3m-3 3V2.25" />
              </svg>
              {t("btnDownloadPdf")}
            </button>
          )}
        </div>

        {years.length === 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {t("noYears")}{" "}
            <Link href={`${lp}/syndic/coproprietes/${id}/comptabilite`} className="underline font-semibold">
              {t("goToAccounting")}
            </Link>{" "}
            {t("noYearsSuffix")}
          </div>
        )}

        {building && <div className="mt-6 text-center text-sm text-muted">{t("building")}</div>}

        {bundle && !building && (
          <div className="mt-8 space-y-6">
            {/* Annexe 1 */}
            <AnnexeCard number={1} title={t("annexe1Title")} year={bundle.year} t={t}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label={t("kpiDispo")} value={bundle.annexe1.items.total_disponibilites} positive />
                <Kpi label={t("kpiCapitaux")} value={bundle.annexe1.items.total_capitaux} />
                <Kpi label={t("kpiResult")} value={bundle.annexe1.items.resultat_exercice}
                  tone={bundle.annexe1.items.resultat_exercice >= 0 ? "emerald" : "rose"} />
              </div>
              <table className="mt-3 w-full text-xs">
                <tbody>
                  <RowKV k={t("rowBank")} v={bundle.annexe1.items.banque_operationnelle} />
                  <RowKV k={t("rowBankTravaux")} v={bundle.annexe1.items.banque_fonds_travaux} />
                  <RowKV k={t("rowCaisse")} v={bundle.annexe1.items.caisse} />
                  <RowKV k={t("rowFondsCopro")} v={bundle.annexe1.items.fonds_copropriete} />
                  <RowKV k={t("rowProvisions")} v={bundle.annexe1.items.provisions_travaux} />
                  <RowKV k={t("rowCreances")} v={bundle.annexe1.items.creances_coproprietaires} />
                  <RowKV k={t("rowDettes")} v={bundle.annexe1.items.dettes_fournisseurs} />
                </tbody>
              </table>
            </AnnexeCard>

            {/* Annexe 2 */}
            <AnnexeCard number={2} title={t("annexe2Title")} year={bundle.year} t={t}>
              {bundle.annexe2.rows.length === 0 ? (
                <p className="text-xs text-muted italic">{t("emptyCharges")}</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left">{t("colAccount")}</th>
                      <th className="px-2 py-1.5 text-left">{t("colLabel")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colBudget")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colActual")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colVariance")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.annexe2.rows.map((r, i) => (
                      <tr key={r.code} className={i % 2 === 0 ? "" : "bg-background/50"}>
                        <td className="px-2 py-1 font-mono text-navy">{r.code}</td>
                        <td className="px-2 py-1">{r.label}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatEUR(r.budgeted)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatEUR(r.actual)}</td>
                        <td className={`px-2 py-1 text-right font-mono ${r.variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {r.variance >= 0 ? "+" : ""}{formatEUR(r.variance)}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-card-border font-bold">
                      <td colSpan={2} className="px-2 py-2">{t("totalCharges")}</td>
                      <td className="px-2 py-2 text-right font-mono">{formatEUR(bundle.annexe2.totals.budgeted)}</td>
                      <td className="px-2 py-2 text-right font-mono">{formatEUR(bundle.annexe2.totals.actual)}</td>
                      <td className={`px-2 py-2 text-right font-mono ${bundle.annexe2.totals.variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                        {bundle.annexe2.totals.variance >= 0 ? "+" : ""}{formatEUR(bundle.annexe2.totals.variance)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              )}
            </AnnexeCard>

            {/* Annexe 3 */}
            <AnnexeCard number={3} title={t("annexe3Title")} year={bundle.year} t={t}>
              <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
                {t("fondsTravauxBanner", { v: formatEUR(bundle.annexe3.fonds_travaux_balance) })}
              </div>
              {bundle.annexe3.rows.length === 0 ? (
                <p className="text-xs text-muted italic">{t("emptyTravaux")}</p>
              ) : (
                <table className="w-full text-xs">
                  <thead className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                    <tr>
                      <th className="px-2 py-1.5 text-left">{t("colAccount")}</th>
                      <th className="px-2 py-1.5 text-left">{t("colLabel")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colBudget")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colActual")}</th>
                      <th className="px-2 py-1.5 text-right">{t("colVariance")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bundle.annexe3.rows.map((r, i) => (
                      <tr key={r.code} className={i % 2 === 0 ? "" : "bg-background/50"}>
                        <td className="px-2 py-1 font-mono text-navy">{r.code}</td>
                        <td className="px-2 py-1">{r.label}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatEUR(r.budgeted)}</td>
                        <td className="px-2 py-1 text-right font-mono">{formatEUR(r.actual)}</td>
                        <td className={`px-2 py-1 text-right font-mono ${r.variance >= 0 ? "text-emerald-700" : "text-rose-700"}`}>
                          {r.variance >= 0 ? "+" : ""}{formatEUR(r.variance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </AnnexeCard>

            {/* Annexe 4 */}
            <AnnexeCard number={4} title={t("annexe4Title")} year={bundle.year} t={t}>
              <div className="grid gap-3 sm:grid-cols-3">
                <Kpi label={t("kpiCreances")} value={bundle.annexe4.creances_coproprietaires}
                  tone={bundle.annexe4.creances_coproprietaires > 0 ? "amber" : "neutral"} />
                <Kpi label={t("kpiDettes")} value={bundle.annexe4.dettes_fournisseurs} />
                <Kpi label={t("kpiAvances")} value={bundle.annexe4.dettes_coproprietaires} />
              </div>
              {bundle.annexe4.owners.length > 0 ? (
                <div className="mt-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
                    {t("detailTitle", { n: bundle.annexe4.owners.length })}
                  </div>
                  <table className="w-full text-xs">
                    <thead className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-2 py-1.5 text-left">{t("colLot")}</th>
                        <th className="px-2 py-1.5 text-left">{t("colOwner")}</th>
                        <th className="px-2 py-1.5 text-right">{t("colCalled")}</th>
                        <th className="px-2 py-1.5 text-right">{t("colOutstanding")}</th>
                        <th className="px-2 py-1.5 text-left text-[9px]">{t("colOldest")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.annexe4.owners.slice(0, 10).map((o) => (
                        <tr key={o.unit_id} className={o.balance_outstanding > 0 ? "bg-rose-50/50" : ""}>
                          <td className="px-2 py-1 font-mono font-semibold">{o.lot_number}</td>
                          <td className="px-2 py-1">{o.owner_name ?? t("dash")}</td>
                          <td className="px-2 py-1 text-right font-mono">{formatEUR(o.total_due)}</td>
                          <td className="px-2 py-1 text-right font-mono font-semibold text-rose-700">
                            {formatEUR(o.balance_outstanding)}
                          </td>
                          <td className="px-2 py-1 text-[10px] text-muted">
                            {o.oldest_unpaid ? new Date(o.oldest_unpaid).toLocaleDateString(dateLocale) : t("dash")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 italic mt-2">{t("allUpToDate")}</p>
              )}
            </AnnexeCard>

            {/* Annexe 5 */}
            <AnnexeCard number={5} title={t("annexe5Title")} year={bundle.year} t={t}>
              <div className="text-xs text-muted mb-2">
                {t("annexe5Header", { n: bundle.annexe5.rows.length, total: formatEUR(bundle.annexe5.grandTotal) })}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {Object.entries(bundle.annexe5.totalByAccount).sort(([a], [b]) => a.localeCompare(b)).map(([code, v]) => (
                  <div key={code} className="flex items-center justify-between rounded border border-card-border/40 bg-background px-3 py-1.5 text-xs">
                    <span><span className="font-mono font-semibold text-navy">{code}</span> {v.label}</span>
                    <span className="font-mono">{formatEUR(v.total)}</span>
                  </div>
                ))}
              </div>
              {bundle.annexe5.rows.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-[11px] uppercase tracking-wider text-muted font-semibold">
                    {t("journalSummary", { n: bundle.annexe5.rows.length, plural: bundle.annexe5.rows.length > 1 ? t("journalPlural") : t("journalSingular") })}
                  </summary>
                  <table className="mt-2 w-full text-[11px]">
                    <thead className="border-b border-card-border text-[9px] uppercase tracking-wider text-muted">
                      <tr>
                        <th className="px-2 py-1 text-left">{t("colDate")}</th>
                        <th className="px-2 py-1 text-left">{t("colRef")}</th>
                        <th className="px-2 py-1 text-left">{t("colLabelJournal")}</th>
                        <th className="px-2 py-1 text-left">{t("colAccountCode")}</th>
                        <th className="px-2 py-1 text-right">{t("colDebit")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bundle.annexe5.rows.slice(0, 25).map((e, i) => (
                        <tr key={i} className={i % 2 === 0 ? "" : "bg-background/40"}>
                          <td className="px-2 py-0.5 text-muted">{new Date(e.entry_date).toLocaleDateString(dateLocale)}</td>
                          <td className="px-2 py-0.5 font-mono text-[10px]">{e.reference ?? t("dash")}</td>
                          <td className="px-2 py-0.5">{e.label}</td>
                          <td className="px-2 py-0.5 font-mono text-xs">{e.account_code}</td>
                          <td className="px-2 py-0.5 text-right font-mono">{formatEUR(e.debit)}</td>
                        </tr>
                      ))}
                      {bundle.annexe5.rows.length > 25 && (
                        <tr><td colSpan={5} className="px-2 py-2 text-center text-[10px] text-muted">
                          {t("moreLinesInPdf", { n: bundle.annexe5.rows.length - 25 })}
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </details>
              )}
            </AnnexeCard>

            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
              <strong>{t("usageTitle")}</strong> {t("usageBody")}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AnnexeCard({ number, title, year, children, t }: {
  number: number; title: string; year: number; children: React.ReactNode;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
}) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <div className="mb-3 flex items-center justify-between border-b border-card-border pb-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("annexeLabel", { n: number })}</div>
          <h2 className="mt-0.5 text-lg font-bold text-navy">{title}</h2>
        </div>
        <div className="text-[10px] text-muted">{t("annexeYearLabel", { y: year })}</div>
      </div>
      {children}
    </section>
  );
}

function Kpi({ label, value, tone = "navy", positive = false }: {
  label: string; value: number; tone?: "navy" | "emerald" | "rose" | "amber" | "neutral"; positive?: boolean;
}) {
  const colors: Record<typeof tone, { bg: string; text: string }> = {
    navy: { bg: "bg-card border-card-border", text: "text-navy" },
    emerald: { bg: "bg-emerald-50 border-emerald-200", text: "text-emerald-900" },
    rose: { bg: "bg-rose-50 border-rose-200", text: "text-rose-900" },
    amber: { bg: "bg-amber-50 border-amber-200", text: "text-amber-900" },
    neutral: { bg: "bg-card border-card-border", text: "text-navy" },
  };
  const c = colors[tone];
  return (
    <div className={`rounded-xl border ${c.bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${c.text}`}>
        {positive && value >= 0 ? "+" : ""}{formatEUR(value)}
      </div>
    </div>
  );
}

function RowKV({ k, v }: { k: string; v: number }) {
  return (
    <tr className="border-b border-card-border/30">
      <td className="px-2 py-1 text-muted">{k}</td>
      <td className="px-2 py-1 text-right font-mono">{formatEUR(v)}</td>
    </tr>
  );
}
