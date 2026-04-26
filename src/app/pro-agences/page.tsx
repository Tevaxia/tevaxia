import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import SEOContent from "@/components/SEOContent";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("proAgences.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ProAgences() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("proAgences")]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-rose-900 via-rose-800 to-pink-700 py-20 sm:py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            {t("badge")}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">{t("description")}</p>
          <Link href={`${lp}/pro-agences/crm`} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-white/90">
            {t("ctaDemo")}
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">{t("featuresTitle")}</h2>
          <p className="mt-3 text-center text-muted">{t("featuresSubtitle")}</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("feature1Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("feature1Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("feature2Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("feature2Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("feature3Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("feature3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">{t("comparisonTitle")}</h2>
          <p className="mt-2 text-center text-sm text-muted max-w-2xl mx-auto">{t("comparisonSubtitle")}</p>
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { labelKey: "row1", descKey: "row1Desc" },
              { labelKey: "row2", descKey: "row2Desc" },
              { labelKey: "row3", descKey: "row3Desc" },
              { labelKey: "row4", descKey: "row4Desc" },
              { labelKey: "row5", descKey: "row5Desc" },
            ].map((row) => (
              <div key={row.labelKey} className="rounded-xl border border-card-border bg-background p-4">
                <div className="flex items-start gap-2">
                  <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  <div>
                    <div className="text-sm font-semibold text-navy">{t(row.labelKey)}</div>
                    <div className="mt-0.5 text-xs text-muted">{t(row.descKey)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center">
            <h2 className="text-2xl font-bold text-navy">{t("pricingTitle")}</h2>
            <p className="mt-3 text-muted">{t("pricingSubtitle")}</p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">{t("badgeLaunch")}</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">{t("badgeFreeAccess")}</span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">{t("badgeNoCommit")}</span>
            </div>
            <Link href={`${lp}/pro-agences/crm`} className="mt-8 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700">
              {t("ctaReserve")}
            </Link>
            <div className="mt-4 text-xs text-muted">
              {t("altPrefix")}{" "}
              <Link href={`${lp}/estimation`} className="text-navy underline hover:no-underline">{t("altLink")}</Link>{" "}
              {t("altSuffix")}
            </div>
          </div>
        </div>
      </section>

      <SEOContent
        ns="proAgences"
        sections={[
          { titleKey: "usageTitle", contentKey: "usageContent" },
          { titleKey: "brandingTitle", contentKey: "brandingContent" },
          { titleKey: "conformiteTitle", contentKey: "conformiteContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/estimation", labelKey: "estimation" },
          { href: "/api-banques", labelKey: "apiBanques" },
        ]}
      />
    </div>
  );
}
