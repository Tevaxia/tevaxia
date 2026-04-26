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

  const features = [
    {
      title: t("feature1Title"),
      desc: t("feature1Desc"),
      bg: "bg-rose-100",
      fg: "text-rose-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
      ),
    },
    {
      title: t("feature2Title"),
      desc: t("feature2Desc"),
      bg: "bg-violet-100",
      fg: "text-violet-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      ),
    },
    {
      title: t("feature3Title"),
      desc: t("feature3Desc"),
      bg: "bg-blue-100",
      fg: "text-blue-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      ),
    },
    {
      title: t("feature4Title"),
      desc: t("feature4Desc"),
      bg: "bg-amber-100",
      fg: "text-amber-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
      ),
    },
    {
      title: t("feature5Title"),
      desc: t("feature5Desc"),
      bg: "bg-emerald-100",
      fg: "text-emerald-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      ),
    },
    {
      title: t("feature6Title"),
      desc: t("feature6Desc"),
      bg: "bg-sky-100",
      fg: "text-sky-700",
      icon: (
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.306a11.95 11.95 0 015.814-5.518l2.74-1.22m0 0l-5.94-2.281m5.94 2.28l-2.28 5.941" />
      ),
    },
  ];

  const modules = [
    { href: "/pro-agences/crm", titleKey: "moduleCrmTitle", descKey: "moduleCrmDesc" },
    { href: "/pro-agences/mandats", titleKey: "moduleMandatsTitle", descKey: "moduleMandatsDesc" },
    { href: "/pro-agences/fiche-bien", titleKey: "moduleFicheTitle", descKey: "moduleFicheDesc" },
    { href: "/pro-agences/commissions", titleKey: "moduleCommissionsTitle", descKey: "moduleCommissionsDesc" },
    { href: "/pro-agences/performance", titleKey: "modulePerformanceTitle", descKey: "modulePerformanceDesc" },
    { href: "/estimation", titleKey: "moduleEstimationTitle", descKey: "moduleEstimationDesc" },
  ];

  const luDifferentiators = [
    { titleKey: "diff1Title", descKey: "diff1Desc" },
    { titleKey: "diff2Title", descKey: "diff2Desc" },
    { titleKey: "diff3Title", descKey: "diff3Desc" },
    { titleKey: "diff4Title", descKey: "diff4Desc" },
    { titleKey: "diff5Title", descKey: "diff5Desc" },
    { titleKey: "diff6Title", descKey: "diff6Desc" },
  ];

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
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/85">{t("description")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href={`${lp}/pro-agences/crm`}
              className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-rose-900 shadow-sm transition-colors hover:bg-white/90"
            >
              {t("ctaDemo")} →
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-white/30 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              {t("ctaSeeFeatures")}
            </a>
          </div>
          <div className="mt-10 grid grid-cols-2 gap-6 sm:grid-cols-4 max-w-3xl mx-auto border-t border-white/10 pt-8">
            {[
              { value: t("kpi1Value"), label: t("kpi1Label") },
              { value: t("kpi2Value"), label: t("kpi2Label") },
              { value: t("kpi3Value"), label: t("kpi3Label") },
              { value: t("kpi4Value"), label: t("kpi4Label") },
            ].map((kpi, i) => (
              <div key={i}>
                <div className="text-2xl font-bold text-white sm:text-3xl">{kpi.value}</div>
                <div className="mt-1 text-xs text-white/70">{kpi.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6 Features */}
      <section id="features" className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("featuresTitle")}</h2>
            <p className="mt-3 text-muted">{t("featuresSubtitle")}</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f, i) => (
              <div key={i} className="rounded-xl border border-card-border bg-card p-6 transition-shadow hover:shadow-md">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.fg}`}>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                    {f.icon}
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy">{f.title}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* LU Differentiators */}
      <section className="bg-gradient-to-br from-navy via-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-bold text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold" />
              {t("diffBadge")}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-white sm:text-3xl">{t("diffTitle")}</h2>
            <p className="mt-3 text-white/80">{t("diffSubtitle")}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {luDifferentiators.map((d, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gold/20 text-gold font-bold text-sm">
                    {i + 1}
                  </span>
                  <div>
                    <div className="text-sm font-semibold text-white">{t(d.titleKey)}</div>
                    <p className="mt-1 text-xs text-white/70 leading-relaxed">{t(d.descKey)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison vs concurrents */}
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

      {/* Modules tour */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-bold text-navy sm:text-3xl">{t("modulesTitle")}</h2>
            <p className="mt-3 text-muted">{t("modulesSubtitle")}</p>
          </div>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map((m) => (
              <Link
                key={m.href}
                href={`${lp}${m.href}`}
                className="group flex items-start gap-3 rounded-xl border border-card-border bg-card p-5 transition-all hover:shadow-md hover:-translate-y-0.5"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 group-hover:bg-rose-100 transition-colors">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy group-hover:text-rose-700 transition-colors">{t(m.titleKey)}</div>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{t(m.descKey)}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-background p-8 text-center">
            <h2 className="text-2xl font-bold text-navy">{t("pricingTitle")}</h2>
            <p className="mt-3 text-muted">{t("pricingSubtitle")}</p>
            <div className="mt-6 flex items-center justify-center gap-3 flex-wrap">
              <span className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-800">{t("badgeLaunch")}</span>
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800">{t("badgeFreeAccess")}</span>
              <span className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800">{t("badgeNoCommit")}</span>
            </div>
            <Link
              href={`${lp}/pro-agences/crm`}
              className="mt-8 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700"
            >
              {t("ctaReserve")} →
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
