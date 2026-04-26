import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PropCalc Developers — Widget, REST API, npm, Chrome, Google Sheets",
  description:
    "Integrate multi-country real estate calculations into your projects. Embeddable widget, REST API, npm package, Chrome extension, Google Sheets add-on. 10 countries, 16 functions.",
  openGraph: {
    title: "PropCalc — Developer Ecosystem",
    description: "Embeddable widget, REST API, npm, Chrome Extension, Google Sheets. 5 integration channels for multi-country property calculations.",
    url: "https://www.tevaxia.lu/en/propcalc/developers",
  },
};

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const WIDGET_ATTRS = [
  { attr: "data-country", desc: "ISO 3166-1 alpha-2 country code (lu, fr, de, gb, be, es, pt, it, nl, us)" },
  { attr: "data-lang", desc: "Interface language (fr, en, de, es, pt, it, nl, lb)" },
  { attr: "data-module", desc: "Modules to display: fees, borrowing, yield, cashflow, comparator, prequalify, amortization, buyvsrent, scenarios, transfertax" },
  { attr: "data-theme", desc: "Visual theme: light (default) or dark" },
  { attr: "data-accent-color", desc: "Any valid CSS accent color (#1a365d, rgb(...), hsl(...))" },
];

const API_ENDPOINTS = [
  { method: "POST", path: "/fees", desc: "Acquisition fees (notary, duties, taxes)" },
  { method: "POST", path: "/mortgage", desc: "Borrowing capacity and monthly payments" },
  { method: "POST", path: "/yield", desc: "Gross, net, and net-net rental yield" },
  { method: "POST", path: "/cashflow", desc: "Monthly investor cash-flow" },
  { method: "GET", path: "/countries", desc: "List of supported countries with metadata" },
];

const CHROME_PORTALS = [
  "atHome.lu", "ImmoScout24", "Idealista", "Rightmove",
  "SeLoger", "LeBonCoin", "Funda", "Zillow",
];

const SHEETS_FUNCTIONS = [
  { fn: "=PROPCALC_FEES(price, country, region)", desc: "Full acquisition fees breakdown" },
  { fn: "=PROPCALC_MORTGAGE(income, expenses, country)", desc: "Maximum borrowing capacity" },
  { fn: "=PROPCALC_YIELD(price, rent, expenses, country)", desc: "Net rental yield" },
  { fn: "=PROPCALC_CAPACITY(price, deposit, rate, term)", desc: "Monthly payment and total cost" },
  { fn: "=PROPCALC_TAX_RATE(price, country, region)", desc: "Effective transfer tax rate" },
];

export default function PropCalcDevelopersPageEN() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/20 px-4 py-1.5 text-sm font-medium text-teal mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" /></svg>
            5 Integration Channels
          </div>
          <h1 className="text-4xl font-bold text-navy sm:text-5xl tracking-tight">
            PropCalc &mdash; Developer Ecosystem
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            Integrate multi-country real estate calculations into your projects.
            Embeddable widget, REST API, npm package, Chrome extension, Google Sheets add-on.
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="https://www.tevaxia.lu/api/v1/propcalc" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              API Documentation &rarr;
            </Link>
            <Link href="https://www.npmjs.com/package/@tevaxia/propcalc" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              npm install @tevaxia/propcalc
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            10 countries &middot; 16 functions &middot; MIT &middot; By <span className="font-medium text-navy">Tevaxia</span>
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-card-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 sm:grid-cols-5 gap-8 text-center">
          {[
            { value: "5", label: "Channels" },
            { value: "10", label: "Countries" },
            { value: "16", label: "Functions" },
            { value: "1K", label: "Free calls/month" },
            { value: "0", label: "Dependencies" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-navy">{s.value}</div>
              <div className="text-sm text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Embeddable Widget */}
      <section id="widget" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
            </div>
            <h2 className="text-2xl font-bold text-navy">Embeddable Widget</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            Three lines of code to add PropCalc to any website. No dependencies, no framework required.
          </p>

          <div className="rounded-xl border border-card-border bg-navy p-6 mb-8 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`<link rel="stylesheet"
      href="https://www.tevaxia.lu/propcalc/propcalc.min.css">

<script src="https://www.tevaxia.lu/propcalc/propcalc.min.js"></script>

<div data-propcalc data-country="lu" data-lang="en"></div>`}</code></pre>
          </div>

          <h3 className="text-sm font-semibold text-navy mb-4">Configuration attributes</h3>
          <div className="grid gap-3">
            {WIDGET_ATTRS.map((a) => (
              <div key={a.attr} className="flex gap-4 p-4 rounded-xl border border-card-border bg-card">
                <code className="text-xs font-mono text-teal bg-teal/10 px-2 py-1 rounded shrink-0 self-start">{a.attr}</code>
                <span className="text-xs text-muted">{a.desc}</span>
              </div>
            ))}
          </div>

          <p className="mt-6 text-center text-xs text-muted">
            Free &middot; Tevaxia credit shown &middot; Zero dependencies
          </p>
        </div>
      </section>

      {/* REST API */}
      <section id="api" className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M5.25 14.25h13.5m-13.5 0a3 3 0 01-3-3m3 3a3 3 0 100 6h13.5a3 3 0 100-6m-16.5-3a3 3 0 013-3h13.5a3 3 0 013 3m-19.5 0a4.5 4.5 0 01.9-2.7L5.737 5.1a3.375 3.375 0 012.7-1.35h7.126c1.062 0 2.062.5 2.7 1.35l2.587 3.45a4.5 4.5 0 01.9 2.7m0 0a3 3 0 01-3 3m0 3h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008zm-3 6h.008v.008h-.008v-.008zm0-6h.008v.008h-.008v-.008z" />
            </div>
            <h2 className="text-2xl font-bold text-navy">REST API</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-4">
            Base URL: <code className="text-xs font-mono bg-navy/5 text-navy/70 px-2 py-1 rounded">https://www.tevaxia.lu/api/v1/propcalc</code>
          </p>
          <p className="text-muted text-center max-w-xl mx-auto mb-12 text-sm">
            1,000 free calls/month &middot; CORS enabled &middot; JSON
          </p>

          {/* Endpoints table */}
          <div className="rounded-xl border border-card-border overflow-hidden mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy text-white/80">
                  <th className="text-left px-4 py-3 font-semibold">Method</th>
                  <th className="text-left px-4 py-3 font-semibold">Endpoint</th>
                  <th className="text-left px-4 py-3 font-semibold hidden sm:table-cell">Description</th>
                </tr>
              </thead>
              <tbody>
                {API_ENDPOINTS.map((ep) => (
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

          {/* Curl example */}
          <h3 className="text-sm font-semibold text-navy mb-4">Example: acquisition fees calculation</h3>
          <div className="rounded-xl border border-card-border bg-navy p-6 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`curl -X POST https://www.tevaxia.lu/api/v1/propcalc/fees \\
  -H "Content-Type: application/json" \\
  -d '{
    "country": "lu",
    "price": 700000,
    "type": "existing"
  }'`}</code></pre>
          </div>
        </div>
      </section>

      {/* npm Package */}
      <section id="npm" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
            </div>
            <h2 className="text-2xl font-bold text-navy">npm Package</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            All calculation logic in a single package. Zero dependencies, tree-shakable, native TypeScript.
          </p>

          {/* Install */}
          <div className="rounded-xl border border-card-border bg-navy p-4 mb-8 text-center">
            <code className="text-sm font-mono text-white/80">npm install @tevaxia/propcalc</code>
          </div>

          {/* Code example */}
          <div className="rounded-xl border border-card-border bg-navy p-6 mb-8 overflow-x-auto">
            <pre className="text-sm font-mono text-white/80 leading-relaxed"><code>{`import { calculateAcquisitionFees, getCountryData } from '@tevaxia/propcalc';

const lu = getCountryData('lu');
const fees = calculateAcquisitionFees({ countryData: lu, price: 700000 });

console.log(fees.total);        // 49 000
console.log(fees.notaryFees);   // 7 000
console.log(fees.transferTax);  // 42 000`}</code></pre>
          </div>

          <div className="grid gap-3 sm:grid-cols-4">
            {[
              { value: "16", label: "Functions" },
              { value: "10", label: "Countries" },
              { value: "MIT", label: "License" },
              { value: "0", label: "Dependencies" },
            ].map((s) => (
              <div key={s.label} className="p-4 rounded-xl border border-card-border bg-card text-center">
                <div className="text-xl font-bold text-navy">{s.value}</div>
                <div className="text-xs text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Chrome Extension */}
      <section id="chrome" className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
            </div>
            <h2 className="text-2xl font-bold text-navy">Chrome Extension</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            Instant calculations on property listing websites. Automatic price detection, 3 tabs: Fees, Yield, Mortgage.
          </p>

          <h3 className="text-sm font-semibold text-navy mb-4 text-center">Supported portals</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {CHROME_PORTALS.map((portal) => (
              <div key={portal} className="p-4 rounded-xl border border-card-border bg-background text-center">
                <div className="text-sm font-semibold text-navy">{portal}</div>
              </div>
            ))}
          </div>

          <div className="text-center">
            <Link href="#chrome-web-store" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors inline-block">
              Install from Chrome Web Store &rarr;
            </Link>
            <p className="mt-4 text-xs text-muted">
              Automatic price detection &middot; 3 tabs: Fees, Yield, Mortgage
            </p>
          </div>
        </div>
      </section>

      {/* Google Sheets */}
      <section id="sheets" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex items-center gap-3 justify-center mb-4">
            <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center text-teal">
              <Icon d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 01-1.125-1.125M3.375 19.5h7.5c.621 0 1.125-.504 1.125-1.125m-9.75 0V5.625m0 12.75v-1.5c0-.621.504-1.125 1.125-1.125m18.375 2.625V5.625m0 12.75c0 .621-.504 1.125-1.125 1.125m1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125m0 3.75h-7.5A1.125 1.125 0 0112 18.375m9.75-12.75c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125m19.5 0v1.5c0 .621-.504 1.125-1.125 1.125M2.25 5.625v1.5c0 .621.504 1.125 1.125 1.125m0 0h17.25m-17.25 0h7.5c.621 0 1.125.504 1.125 1.125M3.375 8.25c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125m17.25-3.75h-7.5c-.621 0-1.125.504-1.125 1.125m8.625-1.125c.621 0 1.125.504 1.125 1.125v1.5c0 .621-.504 1.125-1.125 1.125m-17.25 0h7.5m-7.5 0c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125M12 10.875v-1.5m0 1.5c0 .621-.504 1.125-1.125 1.125M12 10.875c0 .621.504 1.125 1.125 1.125m-2.25 0c.621 0 1.125.504 1.125 1.125M10.875 12c-.621 0-1.125.504-1.125 1.125M12 10.875c-.621 0-1.125.504-1.125 1.125m0 0v1.5c0 .621.504 1.125 1.125 1.125m-1.125-2.625c0 .621.504 1.125 1.125 1.125m0 0c.621 0 1.125.504 1.125 1.125m-1.125-1.125c-.621 0-1.125.504-1.125 1.125" />
            </div>
            <h2 className="text-2xl font-bold text-navy">Google Sheets Add-on</h2>
          </div>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">
            Right inside your spreadsheets. 10 countries, regional granularity.
          </p>

          <div className="grid gap-3">
            {SHEETS_FUNCTIONS.map((f) => (
              <div key={f.fn} className="flex flex-col sm:flex-row gap-2 sm:gap-4 p-4 rounded-xl border border-card-border bg-card">
                <code className="text-xs font-mono text-teal bg-teal/10 px-3 py-1.5 rounded shrink-0 self-start">{f.fn}</code>
                <span className="text-xs text-muted self-center">{f.desc}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted">
            Right in your spreadsheets &middot; 10 countries &middot; Regional granularity
          </p>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Ready to integrate PropCalc?</h2>
          <p className="text-muted mb-8">Pick the channel that fits your stack. Widget, API, npm, Chrome, or Sheets &mdash; all free to get started.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://www.tevaxia.lu/en/propcalc" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              PropCalc &mdash; Main page &rarr;
            </Link>
            <Link href="https://www.tevaxia.lu" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              tevaxia.lu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
