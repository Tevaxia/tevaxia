import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("strHub.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

const TOOLS = [
  {
    href: "/str/rentabilite",
    key: "rentabilite",
    color: "from-rose-600 to-orange-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/str/compliance",
    key: "compliance",
    color: "from-amber-600 to-yellow-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    href: "/str/arbitrage",
    key: "arbitrage",
    color: "from-indigo-600 to-violet-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    href: "/str/pricing",
    key: "pricing",
    color: "from-pink-600 to-fuchsia-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/str/observatoire",
    key: "observatoire",
    color: "from-teal-600 to-emerald-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    href: "/str/compliance-eu",
    key: "complianceEu",
    color: "from-blue-600 to-sky-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75M12 2.25c-5.385 0-9.75 4.365-9.75 9.75M12 2.25v19.5M2.25 12h19.5" />
      </svg>
    ),
  },
  {
    href: "/str/forecast",
    key: "forecast",
    color: "from-purple-600 to-indigo-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
];

export default async function StrHub() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("strHub")]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-900 via-rose-800 to-pink-800 py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            {t("hero.title")}
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">
            {t("hero.subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">{t("hero.tag1")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("hero.tag2")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("hero.tag3")}</span>
            <span className="rounded-full border border-white/20 px-3 py-1">{t("hero.tag4")}</span>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool, idx) => {
              const isLast = idx === TOOLS.length - 1;
              const alignLg = isLast && TOOLS.length % 3 === 1 ? "lg:col-start-2" : "";
              return (
              <Link
                key={tool.href}
                href={`${lp}${tool.href}`}
                className={`group relative flex flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5 ${alignLg}`}
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}>
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {t(`tools.${tool.key}.title`)}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{t(`tools.${tool.key}.desc`)}</p>
                <div className="mt-4 flex items-center justify-end">
                  <svg className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl text-center">{t("why.title")}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">📐</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("why.rules.title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("why.rules.body")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🇪🇺</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("why.eu.title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("why.eu.body")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">💶</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("why.tax.title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("why.tax.body")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">📊</div>
              <h3 className="mt-3 text-base font-semibold text-navy">{t("why.arbitrage.title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("why.arbitrage.body")}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
