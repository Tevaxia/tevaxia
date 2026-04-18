import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { PERSONA_GUIDES } from "@/lib/persona-docs";
import { PROFILE_TYPES } from "@/lib/profile-types";

export const metadata: Metadata = {
  title: "Guides pratiques par profil — tevaxia.lu",
  description:
    "9 guides dédiés selon votre profil : particulier, évaluateur, syndic, hôtelier, investisseur, agence, promoteur, intégrateur API, opérateur STR. Outils recommandés, parcours type, FAQ ciblée.",
};

export default async function DocsHub() {
  const [locale, t, tp] = await Promise.all([
    getLocale(),
    getTranslations("personaDocs.hub"),
    getTranslations("profileTypes"),
  ]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-dark via-navy to-navy-light py-16 sm:py-20">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="relative mx-auto max-w-4xl px-4 text-center text-white">
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{t("title")}</h1>
          <p className="mt-4 text-sm sm:text-base text-white/70 max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* Grid personas */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONA_GUIDES.map((p) => {
            const meta = PROFILE_TYPES.find((pt) => pt.value === p.value);
            return (
              <Link
                key={p.slug}
                href={`${lp}/docs/${p.slug}`}
                className="group rounded-xl border border-card-border bg-card p-5 transition-all hover:border-navy/40 hover:shadow-sm"
              >
                <div className="flex items-start gap-3">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${meta?.color ?? "from-slate-400 to-slate-600"} text-white shadow-sm`}>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={meta?.iconPath ?? ""} />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-sm font-semibold text-navy group-hover:text-navy-light transition-colors">
                      {tp(`${p.value}.label`)}
                    </h2>
                    <p className="mt-1 text-xs text-muted leading-snug">
                      {tp(`${p.value}.description`)}
                    </p>
                    <div className="mt-2 text-[11px] text-muted">
                      {p.tools.length} outil{p.tools.length > 1 ? "s" : ""} · {p.faqCount} FAQ
                    </div>
                  </div>
                  <svg
                    className="h-4 w-4 text-muted/60 shrink-0 opacity-0 group-hover:opacity-100 group-hover:text-navy group-hover:translate-x-0.5 transition-all mt-1"
                    fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-10 rounded-xl border border-card-border bg-card/50 p-5 text-sm text-muted">
          <p>{t("notSure")}</p>
        </div>
      </section>
    </div>
  );
}
