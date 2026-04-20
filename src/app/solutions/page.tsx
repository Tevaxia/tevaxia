import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations, getLocale } from "next-intl/server";
import { localizedAlternates } from "@/lib/seo";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([
    getTranslations("solutionsHub.meta"),
    getLocale(),
  ]);
  return {
    title: t("title"),
    description: t("description"),
    alternates: localizedAlternates("/solutions", locale),
  };
}

const PERSONAS = [
  { slug: "syndic", icon: "🏛️", kw: ["ag", "appels", "copro"] },
  { slug: "agence", icon: "🏘️", kw: ["mandats", "crm", "openimmo"] },
  { slug: "hotel", icon: "🏨", kw: ["pms", "usali", "tva"] },
  { slug: "expert-evaluateur", icon: "📐", kw: ["evs", "tegova", "rapport"] },
  { slug: "investisseur", icon: "📈", kw: ["dcf", "portfolio", "bëllegen"] },
  { slug: "particulier", icon: "🏠", kw: ["estimation", "aides", "loyer"] },
];

export default async function SolutionsHub() {
  const [t, locale] = await Promise.all([
    getTranslations("solutionsHub"),
    getLocale(),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-xs font-semibold text-gold">
            <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("hero.title")}
          </h1>
          <p className="mt-5 text-lg text-white/80 max-w-2xl mx-auto">{t("hero.subtitle")}</p>
        </div>
      </section>

      {/* Persona cards */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {PERSONAS.map((p) => (
              <Link
                key={p.slug}
                href={`${lp}/solutions/${p.slug}`}
                className="group rounded-xl border border-card-border bg-card p-6 hover:border-navy hover:shadow-lg transition-all"
              >
                <div className="text-3xl mb-3">{p.icon}</div>
                <h2 className="text-base font-bold text-navy group-hover:text-navy-light">
                  {t(`personas.${p.slug}.title`)}
                </h2>
                <p className="mt-2 text-sm text-slate leading-relaxed">
                  {t(`personas.${p.slug}.desc`)}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.kw.map((k) => (
                    <span key={k} className="rounded-full bg-background border border-card-border px-2 py-0.5 text-[10px] font-medium text-muted">
                      {k}
                    </span>
                  ))}
                </div>
                <div className="mt-4 text-xs font-semibold text-gold-dark">
                  {t("personas.cta")} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Comparateur */}
      <section className="bg-card border-y border-card-border py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <h2 className="text-3xl font-bold text-navy sm:text-4xl">{t("compare.title")}</h2>
            <p className="mt-3 text-slate">{t("compare.intro")}</p>
          </div>
          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[800px] text-sm">
              <thead>
                <tr className="border-b-2 border-navy text-left">
                  <th className="py-3 pr-3 text-xs font-semibold uppercase text-muted">{t("compare.profileCol")}</th>
                  <th className="py-3 px-3 text-xs font-semibold uppercase text-muted">{t("compare.dailyCol")}</th>
                  <th className="py-3 px-3 text-xs font-semibold uppercase text-muted">{t("compare.complianceCol")}</th>
                  <th className="py-3 px-3 text-xs font-semibold uppercase text-muted">{t("compare.standardsCol")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-card-border">
                {PERSONAS.map((p) => (
                  <tr key={p.slug}>
                    <td className="py-4 pr-3 align-top">
                      <Link href={`${lp}/solutions/${p.slug}`} className="font-semibold text-navy hover:underline">
                        {p.icon} {t(`personas.${p.slug}.title`)}
                      </Link>
                    </td>
                    <td className="py-4 px-3 align-top text-slate">
                      {t(`compare.rows.${p.slug}.daily`)}
                    </td>
                    <td className="py-4 px-3 align-top text-slate">
                      {t(`compare.rows.${p.slug}.compliance`)}
                    </td>
                    <td className="py-4 px-3 align-top text-xs text-muted font-mono">
                      {t(`compare.rows.${p.slug}.standards`)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ commune */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-navy sm:text-4xl">{t("faq.title")}</h2>
          <p className="mt-3 text-slate">{t("faq.intro")}</p>
          <div className="mt-8 space-y-4">
            {(t.raw("faq.items") as Array<{ q: string; a: string }>).map((it, i) => (
              <details key={i} className="rounded-xl border border-card-border bg-card p-5">
                <summary className="cursor-pointer text-sm font-semibold text-navy">{it.q}</summary>
                <p className="mt-3 text-sm text-slate leading-relaxed">{it.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Orientation block */}
      <section className="bg-gradient-to-br from-navy to-navy-dark py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">{t("orientation.title")}</h2>
          <p className="mt-4 text-lg text-white/80">{t("orientation.desc")}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:contact@tevaxia.lu?subject=Quelle solution Tevaxia pour mon activité ?"
              className="inline-flex items-center gap-2 rounded-lg bg-gold px-6 py-3 text-sm font-bold text-navy-dark hover:bg-gold-light transition-colors shadow-lg"
            >
              {t("orientation.ctaContact")} →
            </a>
            <Link
              href={`${lp}/`}
              className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              {t("orientation.ctaHome")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
