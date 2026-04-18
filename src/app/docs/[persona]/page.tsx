import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { getPersonaBySlug, PERSONA_GUIDES } from "@/lib/persona-docs";
import { PROFILE_TYPES } from "@/lib/profile-types";

export async function generateStaticParams() {
  return PERSONA_GUIDES.map((p) => ({ persona: p.slug }));
}

export async function generateMetadata(props: { params: Promise<{ persona: string }> }): Promise<Metadata> {
  const { persona } = await props.params;
  const guide = getPersonaBySlug(persona);
  if (!guide) return { title: "Guide introuvable — tevaxia.lu" };

  const t = await getTranslations(`personaDocs.${guide.value}`);
  return {
    title: `${t("title")} — Guide tevaxia.lu`,
    description: t("intro"),
  };
}

export default async function PersonaDocPage(props: { params: Promise<{ persona: string }> }) {
  const { persona } = await props.params;
  const guide = getPersonaBySlug(persona);
  if (!guide) notFound();

  const [locale, t, tTools, tp] = await Promise.all([
    getLocale(),
    getTranslations(`personaDocs.${guide.value}`),
    getTranslations(`personaDocs.toolLabels`),
    getTranslations("profileTypes"),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;
  const meta = PROFILE_TYPES.find((pt) => pt.value === guide.value);

  // Récupère les N FAQ définies dans i18n
  const faqs = Array.from({ length: guide.faqCount }, (_, i) => ({
    q: t(`faq${i + 1}q`),
    a: t(`faq${i + 1}a`),
  }));

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light py-14 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-white">
          <Link href={`${lp}/docs`} className="text-[11px] text-white/60 hover:text-white inline-flex items-center gap-1">
            ← {t("backToHub")}
          </Link>
          <div className="mt-3 flex items-center gap-3">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${meta?.color ?? "from-slate-400 to-slate-600"} shadow-md ring-1 ring-white/20`}>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={meta?.iconPath ?? ""} />
              </svg>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.15em] text-white/50 font-medium">
                {tp(`${guide.value}.label`)}
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight">{t("title")}</h1>
            </div>
          </div>
          <p className="mt-4 text-sm sm:text-base text-white/75 max-w-3xl">{t("intro")}</p>
        </div>
      </section>

      {/* Corps */}
      <section className="mx-auto max-w-4xl px-4 py-10 space-y-12">
        {/* Parcours type */}
        <div>
          <h2 className="text-lg font-semibold text-navy">{t("parcoursTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("parcoursIntro")}</p>
          <ol className="mt-4 relative ml-4 border-l-2 border-card-border space-y-5">
            {[1, 2, 3].map((n) => (
              <li key={n} className="relative pl-5">
                <div className="absolute -left-[9px] top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-navy text-white text-[9px] font-bold ring-2 ring-background">
                  {n}
                </div>
                <h3 className="text-sm font-semibold text-navy">{t(`parcoursStep${n}Title`)}</h3>
                <p className="mt-0.5 text-xs text-slate leading-relaxed">{t(`parcoursStep${n}Desc`)}</p>
              </li>
            ))}
          </ol>
        </div>

        {/* Outils recommandés */}
        <div>
          <h2 className="text-lg font-semibold text-navy">{t("toolsTitle")}</h2>
          <p className="mt-1 text-sm text-muted">{t("toolsIntro")}</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {guide.tools.map((tool) => (
              <Link
                key={tool.href}
                href={`${lp}${tool.href}`}
                className="group rounded-xl border border-card-border bg-card p-4 hover:border-navy/40 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold text-navy group-hover:text-navy-light transition-colors">
                      {tTools(`${tool.key}.title`)}
                    </div>
                    <p className="mt-0.5 text-xs text-muted leading-snug">{tTools(`${tool.key}.desc`)}</p>
                    <div className="mt-2 text-[10px] text-muted font-mono">{tool.href}</div>
                  </div>
                  <svg
                    className="h-4 w-4 text-muted/60 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-navy group-hover:translate-x-0.5 transition-all mt-1"
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <div>
          <h2 className="text-lg font-semibold text-navy">{t("faqTitle")}</h2>
          <div className="mt-4 divide-y divide-card-border rounded-xl border border-card-border bg-card">
            {faqs.map((f, i) => (
              <details key={i} className="group open:bg-card/60">
                <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-navy">{f.q}</span>
                  <svg className="h-4 w-4 text-muted shrink-0 transition-transform group-open:rotate-90" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-xs text-slate leading-relaxed">{f.a}</div>
              </details>
            ))}
          </div>
        </div>

        {/* Liens connexes */}
        {guide.related.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-navy">{t("relatedTitle")}</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {guide.related.map((rel) => (
                <Link
                  key={rel.href}
                  href={`${lp}${rel.href}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-card-border bg-card px-3 py-1.5 text-xs font-medium text-slate hover:border-navy hover:text-navy transition-colors"
                >
                  {tTools(`${rel.key}.title`)}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="rounded-xl border border-navy bg-gradient-to-br from-navy to-navy-light text-white p-6 text-center">
          <h3 className="text-lg font-semibold">{t("ctaTitle")}</h3>
          <p className="mt-2 text-sm text-white/80">{t("ctaDesc")}</p>
          <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
            <Link
              href={`${lp}/connexion`}
              className="rounded-lg bg-gold px-5 py-2.5 text-sm font-bold text-navy-dark hover:brightness-105"
            >
              {t("ctaPrimary")}
            </Link>
            <Link
              href={`${lp}/docs`}
              className="rounded-lg border border-white/30 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10"
            >
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
