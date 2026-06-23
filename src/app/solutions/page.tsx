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
  { slug: "syndic", kw: ["ag", "appels", "copro"] },
  { slug: "agence", kw: ["mandats", "crm", "openimmo"] },
  { slug: "hotel", kw: ["pms", "usali", "tva"] },
  { slug: "expert-evaluateur", kw: ["evs", "tegova", "rapport"] },
  { slug: "investisseur", kw: ["dcf", "portfolio", "bëllegen"] },
  { slug: "particulier", kw: ["estimation", "aides", "loyer"] },
];

// Icônes line (style Lucide) cohérentes avec le reste du site — remplacent
// les anciens emojis, qui rendaient différemment selon l'OS et juraient avec le ton pro.
function PersonaIcon({ slug, className }: { slug: string; className?: string }) {
  const common = {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    className,
  };
  switch (slug) {
    case "syndic": // institution / copropriété
      return (
        <svg {...common}>
          <line x1="3" x2="21" y1="22" y2="22" />
          <line x1="6" x2="6" y1="18" y2="11" />
          <line x1="10" x2="10" y1="18" y2="11" />
          <line x1="14" x2="14" y1="18" y2="11" />
          <line x1="18" x2="18" y1="18" y2="11" />
          <polygon points="12 2 20 7 4 7" />
        </svg>
      );
    case "agence": // immeubles
      return (
        <svg {...common}>
          <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
          <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
          <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
          <path d="M10 6h4" />
          <path d="M10 10h4" />
          <path d="M10 14h4" />
          <path d="M10 18h4" />
        </svg>
      );
    case "hotel": // lit / hébergement
      return (
        <svg {...common}>
          <path d="M2 4v16" />
          <path d="M2 8h18a2 2 0 0 1 2 2v10" />
          <path d="M2 17h20" />
          <path d="M6 8v9" />
        </svg>
      );
    case "expert-evaluateur": // règle / mesure
      return (
        <svg {...common}>
          <path d="M21.3 15.3a2.4 2.4 0 0 1 0 3.4l-2.6 2.6a2.4 2.4 0 0 1-3.4 0L2.7 8.7a2.41 2.41 0 0 1 0-3.4l2.6-2.6a2.41 2.41 0 0 1 3.4 0Z" />
          <path d="m14.5 12.5 2-2" />
          <path d="m11.5 9.5 2-2" />
          <path d="m8.5 6.5 2-2" />
          <path d="m17.5 15.5 2-2" />
        </svg>
      );
    case "investisseur": // courbe ascendante
      return (
        <svg {...common}>
          <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
          <polyline points="16 7 22 7 22 13" />
        </svg>
      );
    case "particulier": // maison
      return (
        <svg {...common}>
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    default:
      return null;
  }
}

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
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-navy/5 text-navy transition-colors group-hover:bg-navy group-hover:text-white">
                  <PersonaIcon slug={p.slug} className="h-6 w-6" />
                </div>
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
                      <Link href={`${lp}/solutions/${p.slug}`} className="inline-flex items-center gap-2 font-semibold text-navy hover:underline">
                        <PersonaIcon slug={p.slug} className="h-4 w-4 shrink-0 text-gold-dark" />
                        {t(`personas.${p.slug}.title`)}
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
