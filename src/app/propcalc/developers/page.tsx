import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, getLocale } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const [t, locale] = await Promise.all([getTranslations("propcalcDevelopers"), getLocale()]);
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    openGraph: {
      title: t("ogTitle"),
      description: t("ogDescription"),
      url: `https://www.tevaxia.lu${locale === "fr" ? "" : `/${locale}`}/propcalc/developers`,
    },
  };
}

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default async function PropCalcDevelopersPage() {
  const [t, locale] = await Promise.all([getTranslations("propcalcDevelopers"), getLocale()]);

  const widgetAttrs = [
    { attr: "data-country", desc: t("widgetAttrCountryDesc") },
    { attr: "data-lang", desc: t("widgetAttrLangDesc") },
    { attr: "data-module", desc: t("widgetAttrModuleDesc") },
    { attr: "data-theme", desc: t("widgetAttrThemeDesc") },
    { attr: "data-accent-color", desc: t("widgetAttrAccentDesc") },
  ];

  const apiEndpoints = [
    { method: "POST", path: "/fees", desc: t("apiEndpointFeesDesc") },
    { method: "POST", path: "/mortgage", desc: t("apiEndpointMortgageDesc") },
    { method: "POST", path: "/yield", desc: t("apiEndpointYieldDesc") },
    { method: "POST", path: "/cashflow", desc: t("apiEndpointCashflowDesc") },
    { method: "GET", path: "/countries", desc: t("apiEndpointCountriesDesc") },
  ];

  return (
    <div className="bg-background [overflow-wrap:anywhere]">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/20 px-4 py-1.5 text-sm font-medium text-teal mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
            {t("heroBadge")}
          </div>
          <h1 className="text-4xl font-bold text-navy sm:text-5xl tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            {t("heroIntro")}
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="#api" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              {t("heroCtaDocs")} {"→"}
            </Link>
            <Link href="#widget" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              {t("heroCtaWidget")}
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            {t.rich("heroFooter", {
              brand: () => <span className="font-medium text-navy">Tevaxia</span>,
            })}
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-card-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "2", label: t("statChannels") },
            { value: "10", label: t("statCountries") },
            { value: "4", label: t("statCalculations") },
            { value: "JSON", label: t("statCalls") },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-navy">{s.value}</div>
              <div className="text-sm text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Widget Embeddable */}
      <section id="widget" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </div>
            <h2 className="text-2xl font-bold text-navy">{t("widgetTitle")}</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            {t("widgetIntro")}
          </p>
          <p className="mb-8 text-sm text-muted">{t("widgetScope")}</p>

          <div className="rounded-xl border border-card-border bg-navy p-6 mb-8 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`<link rel="stylesheet"
      href="https://www.tevaxia.lu/propcalc/propcalc.min.css">

<script src="https://www.tevaxia.lu/propcalc/propcalc.min.js"></script>

<div data-propcalc data-country="lu" data-lang="${locale === "lb" ? "fr" : locale}"></div>`}</code></pre>
          </div>

          <h3 className="text-sm font-semibold text-navy mb-4">{t("widgetAttrsTitle")}</h3>
          <div className="grid gap-3">
            {widgetAttrs.map((a) => (
              <div key={a.attr} className="flex gap-4 p-4 rounded-xl border border-card-border bg-card">
                <code className="text-xs font-mono text-teal bg-teal/10 px-2 py-1 rounded shrink-0 self-start">{a.attr}</code>
                <span className="text-xs text-muted">{a.desc}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            {t.rich("widgetFooter", {
              brand: () => <>Tevaxia</>,
            })}
          </p>
        </div>
      </section>

      {/* API REST */}
      <section id="api" className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </div>
            <h2 className="text-2xl font-bold text-navy">{t("apiTitle")}</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-4">
            {t("apiBaseLabel")} <code className="text-xs font-mono bg-navy/5 text-navy/70 px-2 py-1 rounded">https://www.tevaxia.lu/api/v1/propcalc</code>
          </p>
          <p className="text-muted text-center max-w-xl mx-auto mb-12 text-sm">
            {t("apiQuota")}
          </p>

          {/* Endpoints table */}
          <div className="rounded-xl border border-card-border overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white/80">
                  <th className="text-left px-4 py-3 font-semibold">{t("apiColMethod")}</th>
                  <th className="text-left px-4 py-3 font-semibold">{t("apiColEndpoint")}</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">{t("apiColDescription")}</th>
                </tr>
              </thead>
              <tbody>
                {apiEndpoints.map((ep) => (
                  <tr key={ep.path} className="border-t border-card-border bg-background">
                    <td className="px-4 py-3">
                      <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded ${ep.method === "GET" ? "bg-teal/10 text-teal" : "bg-navy/10 text-navy"}`}>
                        {ep.method}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-navy">{ep.path}</td>
                    <td className="px-4 py-3 text-xs text-muted hidden sm:table-cell">{ep.desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("frenchFeesInputs")}</p>
          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("auditFeesInputs")}</p>
          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("unsupportedRentalTax")}</p>

          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("frenchRentalInputs")}</p>
          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("italianRentalInputs")}</p>
          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("portugueseRentalInputs")}</p>

          <p className="mb-8 text-sm text-muted [overflow-wrap:anywhere]">{t("ukFeesInputs")}</p>

          {/* Curl example */}
          <h3 className="text-sm font-semibold text-navy mb-4">{t("apiExampleTitle")}</h3>
          <div className="rounded-xl border border-card-border bg-navy p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`curl -X POST https://www.tevaxia.lu/api/v1/propcalc/fees \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "lu",
    "price": 700000,
    "isNew": false
  }'`}</code></pre>
          </div>
        </div>
      </section>

      <section id="javascript" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">{t("jsTitle")}</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-8">{t("jsIntro")}</p>
          <div className="rounded-xl border border-card-border bg-navy p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`const response = await fetch('https://www.tevaxia.lu/api/v1/propcalc/fees', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ country: 'lu', price: 700000, isNew: false }),
});
const result = await response.json();
if (!response.ok || !result.success) {
  throw new Error(result.error || 'Calculation failed');
}
console.log(result.data);
console.log(result.assumptions);
console.log(result.acquisitionCoverage);`}</code></pre>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">{t("ctaTitle")}</h2>
          <p className="text-muted mb-8">{t("ctaIntro")}</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href={`${locale === "fr" ? "" : `/${locale}`}/propcalc`} className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              {t("ctaPrimary")} {"→"}
            </Link>
            <Link href={locale === "fr" ? "/" : `/${locale}`} className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              {t("ctaSecondary")}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
