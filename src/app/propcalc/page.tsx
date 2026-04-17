"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import SEOContent from "@/components/SEOContent";

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const MODULE_KEYS = [
  { nameKey: "modPrequalName", descKey: "modPrequalDesc", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { nameKey: "modBorrowingName", descKey: "modBorrowingDesc", icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" },
  { nameKey: "modFeesName", descKey: "modFeesDesc", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15" },
  { nameKey: "modTransferTaxName", descKey: "modTransferTaxDesc", icon: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" },
  { nameKey: "modYieldName", descKey: "modYieldDesc", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
  { nameKey: "modBuyRentName", descKey: "modBuyRentDesc", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
  { nameKey: "modCashflowName", descKey: "modCashflowDesc", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { nameKey: "modWhatifName", descKey: "modWhatifDesc", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
  { nameKey: "modComparatorName", descKey: "modComparatorDesc", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" },
  { nameKey: "modAmortName", descKey: "modAmortDesc", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
];

const COUNTRY_KEYS = [
  // hicp : inflation HICP moy 3 ans ; immo : appréciation immo moy 5 ans ; sources : data/countries/*.json
  { flag: "\u{1F1EB}\u{1F1F7}", nameKey: "countryFR", detailKey: "countryFRDetail", hicp: 2.9, immo: -1.0 },
  { flag: "\u{1F1E9}\u{1F1EA}", nameKey: "countryDE", detailKey: "countryDEDetail", hicp: 3.8, immo: -2.0 },
  { flag: "\u{1F1EC}\u{1F1E7}", nameKey: "countryGB", detailKey: "countryGBDetail", hicp: 4.2, immo: 1.5 },
  { flag: "\u{1F1F1}\u{1F1FA}", nameKey: "countryLU", detailKey: "countryLUDetail", hicp: 2.8, immo: 1.5 },
  { flag: "\u{1F1E7}\u{1F1EA}", nameKey: "countryBE", detailKey: "countryBEDetail", hicp: 3.2, immo: 0.5 },
  { flag: "\u{1F1EA}\u{1F1F8}", nameKey: "countryES", detailKey: "countryESDetail", hicp: 3.1, immo: 6.0 },
  { flag: "\u{1F1F5}\u{1F1F9}", nameKey: "countryPT", detailKey: "countryPTDetail", hicp: 3.5, immo: 7.5 },
  { flag: "\u{1F1EE}\u{1F1F9}", nameKey: "countryIT", detailKey: "countryITDetail", hicp: 3.3, immo: 1.0 },
  { flag: "\u{1F1F3}\u{1F1F1}", nameKey: "countryNL", detailKey: "countryNLDetail", hicp: 3.5, immo: 4.5 },
  { flag: "\u{1F1FA}\u{1F1F8}", nameKey: "countryUS", detailKey: "countryUSDetail", hicp: 3.4, immo: 4.0 },
];

const INTEGRATION_KEYS = [
  { nameKey: "intGutenberg", descKey: "intGutenbergDesc" },
  { nameKey: "intElementor", descKey: "intElementorDesc" },
  { nameKey: "intDivi", descKey: "intDiviDesc" },
  { nameKey: "intBricks", descKey: "intBricksDesc" },
  { nameKey: "intWoo", descKey: "intWooDesc" },
  { nameKey: "intWidget", descKey: "intWidgetDesc" },
];

export default function PropCalcPage() {
  const t = useTranslations("propcalc");

  return (
    <>
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/20 px-4 py-1.5 text-sm font-medium text-teal mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            {t("badge")}
          </div>
          <h1 className="text-4xl font-bold text-navy sm:text-5xl tracking-tight">
            {t.rich("heroTitle", { br: () => <br /> })}
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            {t("heroDescription")}
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="https://wordpress.org/plugins/propcalc-real-estate-investment-calculator/" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              {t("downloadCta")}
            </Link>
            <Link href="#modules" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              {t("viewModules")}
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            {t("heroFootnote")}
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-card-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "10", labelKey: "statCountries" },
            { value: "10", labelKey: "statModules" },
            { value: "7", labelKey: "statLanguages" },
            { value: "4", labelKey: "statPageBuilders" },
          ].map((s) => (
            <div key={s.labelKey}>
              <div className="text-3xl font-bold text-navy">{s.value}</div>
              <div className="text-sm text-muted mt-1">{t(s.labelKey)}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">{t("modulesTitle")}</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">{t("modulesSubtitle")}</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MODULE_KEYS.map((m) => (
              <div key={m.nameKey} className="flex gap-4 p-5 rounded-xl border border-card-border bg-card hover:border-teal/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 text-teal">
                  <Icon d={m.icon} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy">{t(m.nameKey)}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{t(m.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">{t("countriesTitle")}</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">{t("countriesSubtitle")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRY_KEYS.map((c) => (
              <div key={c.nameKey} className="flex items-start gap-3 p-4 rounded-xl border border-card-border bg-background">
                <span className="text-2xl">{c.flag}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-navy">{t(c.nameKey)}</div>
                  <div className="text-xs text-muted mt-0.5">{t(c.detailKey)}</div>
                  <div className="mt-1.5 flex items-center gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-amber-900 font-mono">
                      <span title="Inflation HICP moyenne 3 ans">HICP</span>
                      <span>{c.hicp.toFixed(1)}%</span>
                    </span>
                    <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-mono border ${
                      c.immo >= 0 ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-rose-50 border-rose-200 text-rose-900"
                    }`}>
                      <span title="Appréciation immo moyenne 5 ans">🏠</span>
                      <span>{c.immo >= 0 ? "+" : ""}{c.immo.toFixed(1)}%</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">{t("integrationsTitle")}</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">{t("integrationsSubtitle")}</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATION_KEYS.map((i) => (
              <div key={i.nameKey} className="p-5 rounded-xl border border-card-border bg-card text-center">
                <div className="text-sm font-semibold text-navy">{t(i.nameKey)}</div>
                <div className="text-xs text-muted mt-1">{t(i.descKey)}</div>
              </div>
            ))}
          </div>
          <div className="mt-8 text-center">
            <code className="inline-block bg-navy text-white/80 px-6 py-3 rounded-lg text-sm font-mono">
              [propcalc country=&quot;fr&quot; module=&quot;fees,borrowing&quot; countries=&quot;fr,de,lu&quot;]
            </code>
          </div>
        </div>
      </section>

      {/* Use cases */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-12">{t("useCasesTitle")}</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { titleKey: "ucAgencyTitle", code: "[propcalc module=\"fees,borrowing\" price=\"350000\" country=\"fr\"]", descKey: "ucAgencyDesc" },
              { titleKey: "ucBlogTitle", code: "[propcalc]", descKey: "ucBlogDesc" },
              { titleKey: "ucBrokerTitle", code: "[propcalc module=\"prequalify,borrowing,amortization\"]", descKey: "ucBrokerDesc" },
              { titleKey: "ucWidgetTitle", code: "[propcalc module=\"prequalify\" size=\"compact\"]", descKey: "ucWidgetDesc" },
              { titleKey: "ucExpatTitle", code: "[propcalc module=\"comparator,fees\" countries=\"fr,de,lu,be\"]", descKey: "ucExpatDesc" },
              { titleKey: "ucWooTitle", descKey: "ucWooDesc", code: "" },
            ].map((ex) => (
              <div key={ex.titleKey} className="p-5 rounded-xl border border-card-border bg-background">
                <div className="text-sm font-semibold text-navy mb-2">{t(ex.titleKey)}</div>
                <code className="block text-xs bg-navy/5 text-navy/70 px-3 py-2 rounded-lg font-mono break-all">{ex.code || t("ucWooCode")}</code>
                <p className="text-xs text-muted mt-2">{t(ex.descKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">{t("ctaTitle")}</h2>
          <p className="text-muted mb-8">{t("ctaSubtitle")}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://wordpress.org/plugins/propcalc-real-estate-investment-calculator/" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              {t("ctaDownload")}
            </Link>
            <Link href="https://github.com/tevaxia/propcalc" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              {t("ctaGithub")}
            </Link>
          </div>
        </div>
      </section>
    </div>

    <SEOContent
      ns="propcalc"
      sections={[
        { titleKey: "pluginTitle", contentKey: "pluginContent" },
        { titleKey: "modulesTitle", contentKey: "modulesContent" },
        { titleKey: "paysTitle", contentKey: "paysContent" },
        { titleKey: "integrationsTitle", contentKey: "integrationsContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/frais-acquisition", labelKey: "frais" },
        { href: "/estimation", labelKey: "estimation" },
      ]}
    />
    </>
  );
}
