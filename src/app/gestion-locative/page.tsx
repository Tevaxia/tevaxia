"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import SEOContent from "@/components/SEOContent";

export default function GestionLocativeLanding() {
  const locale = useLocale();
  const t = useTranslations("gestionLocativeHub");
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      <section className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-700 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white sm:text-5xl">
            {t("heroTitle")}
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-white/80">
            {t("heroSubtitle")}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`${lp}/gestion-locative/portefeuille`}
              className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-teal-900 hover:bg-white/90"
            >
              {t("ctaPortefeuille")}
            </Link>
            <Link
              href={`${lp}/gestion-locative/fiscal`}
              className="rounded-lg bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-600"
            >
              {t("ctaFiscal")}
            </Link>
            <Link
              href={`${lp}/gestion-locative/etat-des-lieux`}
              className="rounded-lg bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
            >
              {t("ctaEtatLieux")}
            </Link>
            <Link
              href={`${lp}/gestion-locative/reconciliation`}
              className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-600"
            >
              {t("ctaReconciliation")}
            </Link>
            <Link
              href={`${lp}/gestion-locative/relances`}
              className="rounded-lg bg-rose-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-rose-600"
            >
              {t("ctaRelances")}
            </Link>
            <Link
              href={`${lp}/gestion-locative/assurance-impayes`}
              className="rounded-lg bg-purple-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-600"
            >
              {t("ctaGli")}
            </Link>
            <Link
              href={`${lp}/calculateur-loyer`}
              className="rounded-lg border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/20 backdrop-blur-sm"
            >
              {t("ctaTestRule")}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-navy">{t("whyTitle")}</h2>
        <p className="mt-2 text-sm text-muted">
          {t("whySubtitle")}
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-teal-700 text-2xl">⚖️</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">{t("card1Title")}</h3>
            <p className="mt-1 text-xs text-muted">
              {t("card1Desc")}
            </p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-emerald-700 text-2xl">🔥</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">{t("card2Title")}</h3>
            <p className="mt-1 text-xs text-muted">
              {t("card2Desc")}
            </p>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-amber-700 text-2xl">📊</div>
            <h3 className="mt-2 text-sm font-semibold text-navy">{t("card3Title")}</h3>
            <p className="mt-1 text-xs text-muted">
              {t("card3Desc")}
            </p>
          </div>
        </div>
      </section>

      <section className="bg-slate-50 py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy">{t("forWhoTitle")}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy">{t("forWho1Title")}</h3>
              <p className="mt-2 text-xs text-muted">
                {t("forWho1Desc")}
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5">
              <h3 className="text-sm font-semibold text-navy">{t("forWho2Title")}</h3>
              <p className="mt-2 text-xs text-muted">
                {t("forWho2Desc")}
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <strong>{t("mvpStrong")}</strong> {t("mvpBody")}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white">
          <h2 className="text-2xl font-bold">{t("startTitle")}</h2>
          <p className="mt-2 text-white/80">{t("startSubtitle")}</p>
          <Link
            href={`${lp}/gestion-locative/portefeuille`}
            className="mt-5 inline-flex rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy hover:bg-white/90"
          >
            {t("startCta")}
          </Link>
        </div>
      </section>

      <SEOContent
        ns="gestionLocative"
        sections={[
          { titleKey: "regle5Title", contentKey: "regle5Content" },
          { titleKey: "klimabonusTitle", contentKey: "klimabonusContent" },
          { titleKey: "rendementTitle", contentKey: "rendementContent" },
          { titleKey: "syndicTitle", contentKey: "syndicContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/calculateur-loyer", labelKey: "loyer" },
          { href: "/energy/renovation", labelKey: "energyRenovation" },
          { href: "/syndic", labelKey: "syndic" },
        ]}
      />
    </div>
  );
}
