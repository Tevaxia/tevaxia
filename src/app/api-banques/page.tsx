import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import SEOContent from "@/components/SEOContent";

export const metadata: Metadata = {
  title: "API d'estimation immobilière LU pour banques",
  description:
    "API d'estimation TEGOVA-conforme couvrant 100 communes luxembourgeoises. Intégration CRM bancaire, scoring crédit, MLV/CRR. Documentation REST, authentification clé API.",
};

export default async function ApiBanques() {
  const [locale, t] = await Promise.all([getLocale(), getTranslations("apiBanques")]);
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-navy py-20 sm:py-24">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
            {t("badge")}
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">{t("title")}</h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">{t("description")}</p>
          <a href="mailto:contact@tevaxia.lu?subject=API%20banques%20-%20demande%20d%27acc%C3%A8s" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-sm transition-colors hover:bg-white/90">
            {t("ctaAccess")}
          </a>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">{t("useCasesTitle")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75M21 6h-.75A.75.75 0 0119.5 5.25V4.5m1.5 1.5h-1.5M3 6V4.5M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("uc1Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("uc1Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("uc2Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("uc2Desc")}</p>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9v9h-9v-9zM12 3v2.25M12 18.75V21M3 12h2.25M18.75 12H21M5.636 5.636l1.591 1.591m9.546 9.546l1.591 1.591M5.636 18.364l1.591-1.591m9.546-9.546l1.591-1.591" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy">{t("uc3Title")}</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">{t("uc3Desc")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Endpoint preview */}
      <section className="border-t border-card-border bg-slate-900 py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">{t("endpointTitle")}</h2>
          <p className="mt-3 text-center text-white/60">{t("endpointSubtitle")}</p>
          <div className="mt-8 overflow-x-auto rounded-xl bg-slate-950 p-6">
            <pre className="text-sm text-emerald-300 leading-relaxed">
              <code>{`POST https://api.tevaxia.lu/v1/estimation
Authorization: Bearer YOUR_API_KEY
Content-Type: application/json

{
  "commune": "Luxembourg",
  "type": "appartement",
  "surface": 85,
  "chambres": 2,
  "annee_construction": 2010,
  "classe_cpe": "B"
}

→ 200 OK
{
  "valeur_centrale": 720000,
  "fourchette_basse": 680000,
  "fourchette_haute": 760000,
  "intervalle_confiance": 0.85,
  "prix_m2": 8470,
  "comparables_count": 23,
  "method": "hedonic_regression+TEGOVA_EVS_2025",
  "ltv_recommande": 0.80,
  "mlv_estimee": 612000
}`}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* Compliance */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-2xl font-bold text-navy sm:text-3xl">{t("complianceTitle")}</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h3 className="text-base font-semibold text-navy">{t("methodTitle")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>✓ {t("method1")}</li>
                <li>✓ {t("method2")}</li>
                <li>✓ {t("method3")}</li>
                <li>✓ {t("method4")}</li>
              </ul>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h3 className="text-base font-semibold text-navy">{t("secTitle")}</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                <li>✓ {t("sec1")}</li>
                <li>✓ {t("sec2")}</li>
                <li>✓ {t("sec3")}</li>
                <li>✓ {t("sec4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section className="py-16 bg-card border-t border-card-border">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-navy">{t("contactTitle")}</h2>
          <p className="mt-3 text-muted">
            {t("contactPrefix")}{" "}
            <Link href={`${lp}/estimation`} className="text-navy underline hover:no-underline">{t("contactLink")}</Link>{" "}
            {t("contactSuffix")}
          </p>
          <a href="mailto:contact@tevaxia.lu?subject=API%20banques%20-%20demande%20technique" className="mt-8 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-light">
            contact@tevaxia.lu
          </a>
        </div>
      </section>

      <SEOContent
        ns="apiBanques"
        sections={[
          { titleKey: "usageTitle", contentKey: "usageContent" },
          { titleKey: "tegovaTitle", contentKey: "tegovaContent" },
          { titleKey: "mlvTitle", contentKey: "mlvContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/estimation", labelKey: "estimation" },
          { href: "/valorisation", labelKey: "valorisation" },
        ]}
      />
    </div>
  );
}
