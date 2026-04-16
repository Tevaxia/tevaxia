import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import SEOContent from "@/components/SEOContent";

export const metadata: Metadata = {
  title: "Outils pré-acquisition hôtelière | tevaxia.lu",
  description:
    "6 outils pour acheteurs et investisseurs hôteliers : valorisation RevPAR/EBITDA, DSCR, bilan d'exploitation, rénovation énergétique, score E-2.",
};

interface HotelTool {
  href: string;
  titleKey: string;
  descKey: string;
  status: "ready" | "soon";
  icon: React.ReactNode;
  color: string;
}

const TOOLS: HotelTool[] = [
  {
    href: "/hotellerie/valorisation",
    titleKey: "valorisationTitle",
    descKey: "valorisationDesc",
    status: "ready",
    color: "from-purple-700 to-purple-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5M3.75 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m4.5-6h1.5m-1.5 3h1.5m-1.5 3h1.5M9 21v-3.375c0-.621.504-1.125 1.125-1.125h1.5c.621 0 1.125.504 1.125 1.125V21" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/dscr",
    titleKey: "dscrTitle",
    descKey: "dscrDesc",
    status: "ready",
    color: "from-blue-700 to-blue-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75M21 6v9.75c0 .621-.504 1.125-1.125 1.125H21M3 21h18M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/exploitation",
    titleKey: "exploitationTitle",
    descKey: "exploitationDesc",
    status: "ready",
    color: "from-emerald-700 to-emerald-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/renovation",
    titleKey: "renovationTitle",
    descKey: "renovationDesc",
    status: "ready",
    color: "from-green-700 to-green-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/revpar-comparison",
    titleKey: "revparComparisonTitle",
    descKey: "revparComparisonDesc",
    status: "ready",
    color: "from-orange-700 to-orange-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/score-e2",
    titleKey: "scoreE2Title",
    descKey: "scoreE2Desc",
    status: "ready",
    color: "from-rose-700 to-rose-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/forecast",
    titleKey: "forecastTitle",
    descKey: "forecastDesc",
    status: "ready",
    color: "from-indigo-700 to-indigo-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
  {
    href: "/hotellerie/compset",
    titleKey: "compsetTitle",
    descKey: "compsetDesc",
    status: "ready",
    color: "from-cyan-700 to-cyan-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
  },
];

export default async function HotellerieHub() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("hotellerieHub")]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-900 via-purple-800 to-purple-700 py-20 sm:py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            {t("badge")}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("title")}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">{t("description")}</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">{t("tag1")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("tag2")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("tag3")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("tag4")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("tag5")}</span>
          </div>
          <div className="mt-6">
            <Link href={`${lp}/hotellerie/groupe`} className="inline-flex items-center gap-2 rounded-lg bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-white/25">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-6.75M3 21h18M3 21l9-9 9 9M3 14.25V6.375a1.125 1.125 0 011.125-1.125h15.75c.621 0 1.125.504 1.125 1.125v7.875" />
              </svg>
              Dashboard Groupe hôtelier →
            </Link>
          </div>
        </div>
      </section>

      {/* Tools grid */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={`${lp}${tool.href}`}
                className="group relative flex flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                {tool.status === "soon" && (
                  <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {t("soonBadge")}
                  </span>
                )}
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}>
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {t(tool.titleKey)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(tool.descKey)}</p>
                <div className="mt-4 flex items-center justify-end">
                  <svg className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why */}
      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">{t("audienceTitle")}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🏨</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("audience1Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("audience1Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🇺🇸</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("audience2Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("audience2Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🔄</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("audience3Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("audience3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
              <div>
                <h2 className="text-2xl font-bold text-white sm:text-3xl">{t("ctaTitle")}</h2>
                <p className="mt-4 text-white/70 leading-relaxed">{t("ctaDesc")}</p>
                <a
                  href="mailto:contact@tevaxia.lu?subject=Outils%20h%C3%B4tellerie%20-%20beta"
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-semibold text-navy-dark shadow-sm transition-colors hover:bg-gold-light"
                >
                  contact@tevaxia.lu
                </a>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t("diffTitle")}</div>
                  <p className="mt-1 text-sm text-white/60">{t("diffDesc")}</p>
                </div>
                <div className="rounded-lg bg-white/10 px-4 py-3">
                  <div className="text-sm font-medium text-white">{t("standardsTitle")}</div>
                  <p className="mt-1 text-sm text-white/60">{t("standardsDesc")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SEOContent
        ns="hotellerieHub"
        sections={[
          { titleKey: "contextTitle", contentKey: "contextContent" },
          { titleKey: "methodTitle", contentKey: "methodContent" },
          { titleKey: "usaliTitle", contentKey: "usaliContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/dcf-multi", labelKey: "dcfMulti" },
        ]}
      />
    </div>
  );
}
