"use client";

import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import LocaleLink from "@/components/LocaleLink";
import { getCommuneBySlug, getAllMarketData } from "@/lib/market-data";
import { getDemographics } from "@/lib/demographics";
import { formatEUR } from "@/lib/calculations";
import { PriceEvolutionChart } from "@/components/PriceChart";
import { computeMarketScore, getScoreColor, getScoreBarColor } from "@/lib/market-score";
import MarketAlertButton from "@/components/MarketAlertButton";
import RelatedCommunes from "@/components/RelatedCommunes";
import RelatedTools from "@/components/RelatedTools";

export default function CommunePageClient() {
  const params = useParams();
  const slug = typeof params.slug === "string" ? params.slug : "";
  const t = useTranslations("commune");

  const commune = useMemo(() => getCommuneBySlug(slug), [slug]);
  const demo = useMemo(() => (commune ? getDemographics(commune.commune) : undefined), [commune]);

  if (!commune) {
    return (
      <div className="bg-background py-16">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-2xl font-bold text-navy">{t("notFoundTitle")}</h1>
          <p className="mt-2 text-muted">{t("notFoundBody", { slug })}</p>
          <LocaleLink href="/carte" className="mt-4 inline-block rounded-lg bg-navy px-6 py-2 text-sm font-medium text-white hover:bg-navy-light transition-colors">
            {t("notFoundCta")}
          </LocaleLink>
        </div>
      </div>
    );
  }

  const loyerAnnuel = commune.loyerM2Annonces ? commune.loyerM2Annonces * 12 : null;
  const rendementBrut = commune.prixM2Existant && loyerAnnuel ? (loyerAnnuel / commune.prixM2Existant * 100) : null;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <div className="text-xs text-muted mb-4">
          <LocaleLink href="/" className="hover:text-navy">{t("breadcrumbHome")}</LocaleLink> &gt;{" "}
          <LocaleLink href="/carte" className="hover:text-navy">{t("breadcrumbMap")}</LocaleLink> &gt;{" "}
          <span className="text-slate">{commune.commune}</span>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              {t("title", { commune: commune.commune })}
            </h1>
            <p className="mt-2 text-muted">{t("cantonData", { canton: commune.canton, periode: commune.periode })}</p>
          </div>
          <MarketAlertButton commune={commune.commune} showLabel />
        </div>

        {/* Prix overview */}
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-navy/5 p-4 text-center">
            <div className="text-xs text-muted">{t("priceM2Existant")}</div>
            <div className="text-2xl font-bold text-navy">{commune.prixM2Existant ? formatEUR(commune.prixM2Existant) : "—"}</div>
            <div className="text-[10px] text-muted">{t("priceNotaryActs")}</div>
          </div>
          <div className="rounded-xl bg-navy/5 p-4 text-center">
            <div className="text-xs text-muted">{t("priceM2Vefa")}</div>
            <div className="text-2xl font-bold text-navy">{commune.prixM2VEFA ? formatEUR(commune.prixM2VEFA) : "—"}</div>
            <div className="text-[10px] text-muted">{t("priceNew")}</div>
          </div>
          <div className="rounded-xl bg-gold/10 p-4 text-center">
            <div className="text-xs text-muted">{t("rentM2Month")}</div>
            <div className="text-2xl font-bold text-gold-dark">{commune.loyerM2Annonces ? `${commune.loyerM2Annonces.toFixed(1)} €` : "—"}</div>
          </div>
          <div className="rounded-xl bg-teal/10 p-4 text-center">
            <div className="text-xs text-muted">{t("grossYield")}</div>
            <div className="text-2xl font-bold text-teal">{rendementBrut ? `${rendementBrut.toFixed(1)}%` : "—"}</div>
          </div>
        </div>

        {/* Market score */}
        {(() => {
          const score = computeMarketScore(commune);
          const color = getScoreColor(score.level);
          const barColor = getScoreBarColor(score.level);
          return (
            <div className="mt-6 rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <h2 className="text-base font-semibold text-navy">{t("marketScore")}</h2>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
                  {t(`scoreLevels.${score.level}`)} &mdash; {score.score}/100
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200">
                <div className={`h-2.5 rounded-full ${barColor} transition-all`} style={{ width: `${score.score}%` }} />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {score.components.map((comp) => (
                  <div key={comp.key} className="text-center">
                    <div className="text-xs text-muted">{t(`scoreComponents.${comp.key}`)}</div>
                    <div className="text-sm font-semibold text-navy">{comp.score}/25</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          {/* Left */}
          <div className="space-y-6">
            {/* Auto-generated area guide */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-3">{t("marketSectionTitle", { commune: commune.commune })}</h2>
              <div className="text-sm text-muted leading-relaxed space-y-2">
                <p>
                  {t.rich("marketP1", {
                    commune: commune.commune,
                    price: formatEUR(commune.prixM2Existant || 0),
                    periode: commune.periode,
                    strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
                  })}
                  {commune.prixM2VEFA && " " + t("marketP1Vefa", { priceVefa: formatEUR(commune.prixM2VEFA) })}
                </p>
                {commune.nbTransactions && (
                  <p>{commune.nbTransactions > 50
                    ? t("marketTransactionsGood", { nb: commune.nbTransactions })
                    : t("marketTransactionsLimited", { nb: commune.nbTransactions })}</p>
                )}
                {commune.loyerM2Annonces && (
                  <p>
                    {t("marketRent", { rent: commune.loyerM2Annonces.toFixed(1) })}
                    {rendementBrut && " " + t("marketYield", { yield: rendementBrut.toFixed(1) })}
                  </p>
                )}
                {commune.prixM2Existant && commune.prixM2Annonces && (
                  <p>
                    {t.rich("marketGap", {
                      pct: ((commune.prixM2Annonces - commune.prixM2Existant) / commune.prixM2Existant * 100).toFixed(0),
                      strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
                    })}
                  </p>
                )}
              </div>
            </div>

            {/* Demographics */}
            {demo && (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-3">{t("demographics")}</h2>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted">{t("demoPopulation")}</span><br/><span className="font-semibold">{demo.population.toLocaleString("fr-LU")}</span></div>
                  <div><span className="text-muted">{t("demoGrowth10y")}</span><br/><span className="font-semibold text-success">+{demo.croissancePct}%</span></div>
                  <div><span className="text-muted">{t("demoDensity")}</span><br/><span className="font-semibold">{demo.densiteHabKm2} {t("habKm2")}</span></div>
                  <div><span className="text-muted">{t("demoForeigners")}</span><br/><span className="font-semibold">{demo.pctEtrangers}%</span></div>
                  {demo.revenuMedian && <div><span className="text-muted">{t("demoMedianIncome")}</span><br/><span className="font-semibold">{formatEUR(demo.revenuMedian)}{t("demoYearly")}</span></div>}
                  {demo.tauxEmploi && <div><span className="text-muted">{t("demoEmploymentRate")}</span><br/><span className="font-semibold">{demo.tauxEmploi}%</span></div>}
                </div>
                <p className="mt-3 text-[10px] text-muted">{t("demoSource")}</p>
              </div>
            )}

            {/* Quartiers */}
            {commune.quartiers && commune.quartiers.length > 0 && (
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h2 className="text-base font-semibold text-navy mb-3">{t("neighborhoodsTitle")}</h2>
                <div className="space-y-2">
                  {commune.quartiers.sort((a, b) => b.prixM2 - a.prixM2).map((q) => (
                    <div key={q.nom} className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate font-medium">{q.nom}</span>
                        <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-medium ${q.tendance === "hausse" ? "bg-green-100 text-green-700" : q.tendance === "baisse" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {t(`trend.${q.tendance}`)}
                        </span>
                      </div>
                      <span className="font-mono font-semibold text-navy">{formatEUR(q.prixM2)}/m²</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right */}
          <div className="space-y-6">
            <PriceEvolutionChart />

            {/* Actions */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="text-base font-semibold text-navy mb-4">{t("toolsTitle", { commune: commune.commune })}</h2>
              <div className="space-y-2">
                <LocaleLink href="/estimation" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">{t("toolEstimate")}</div><div className="text-xs text-muted">{t("toolEstimateDesc")}</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </LocaleLink>
                <LocaleLink href="/frais-acquisition" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">{t("toolFees")}</div><div className="text-xs text-muted">{t("toolFeesDesc")}</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </LocaleLink>
                <LocaleLink href="/simulateur-aides" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">{t("toolAids")}</div><div className="text-xs text-muted">{t("toolAidsDesc")}</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </LocaleLink>
                <LocaleLink href="/achat-vs-location" className="flex items-center justify-between rounded-lg border border-card-border p-3 hover:bg-background transition-colors">
                  <div><div className="text-sm font-medium text-navy">{t("toolBuyRent")}</div><div className="text-xs text-muted">{t("toolBuyRentDesc")}</div></div>
                  <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
                </LocaleLink>
              </div>
            </div>

            <p className="text-xs text-muted text-center">{t("sourceFooter")}</p>
          </div>
        </div>

        <RelatedCommunes current={commune} pool={getAllMarketData()} />
        <RelatedTools keys={["estimation", "loyer", "frais", "aides", "valorisation", "carte"]} />
      </div>
    </div>
  );
}
