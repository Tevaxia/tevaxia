import Link from "next/link";

function Icon({ d, className = "" }: { d: string; className?: string }) {
  return (
    <svg className={`h-5 w-5 ${className}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

const MODULES = [
  { name: "Vorab-Qualifizierung", desc: "\"Wie viel kann ich leihen?\" in 3 Feldern — perfekter Lead-Magnet", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
  { name: "Kreditkapazität", desc: "Länderspezifische Verschuldungsregeln mit visueller Anzeige (HCSF 35% Frankreich, 4,5x UK)", icon: "M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21" },
  { name: "Erwerbsnebenkosten", desc: "Notargebühren, Grunderwerbsteuer, Registrierungssteuer — regionale Granularität", icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15" },
  { name: "Grunderwerbsteuer-Rechner", desc: "Eigenständiger Grunderwerbsteuer-Rechner — starkes SEO-Keyword", icon: "M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21" },
  { name: "Mietrendite", desc: "Brutto-, Netto- und Nachsteuer-Rendite mit länderspezifischen Steuerregimen", icon: "M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" },
  { name: "Kaufen vs. Mieten", desc: "Nettovermögensvergleich über 1-40 Jahre mit Break-Even-Analyse", icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" },
  { name: "Investor-Cashflow", desc: "Monatlicher Cashflow, Cash-on-Cash-Rendite, Hebeleffekt, Abschreibungen", icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" },
  { name: "Was-Wäre-Wenn-Szenarien", desc: "3 Hypothesen nebeneinander vergleichen (Preis, Zinssatz, Laufzeit)", icon: "M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" },
  { name: "Länderübergreifender Vergleich", desc: "\"Mit meinem Budget — welches Land bietet die beste Rendite?\" — einzigartiges Feature", icon: "M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" },
  { name: "Tilgungsplan", desc: "Annuitätendarlehen, lineares Darlehen oder endfälliges Darlehen — mit Kreisdiagramm und gestapeltem Balkendiagramm", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
];

const COUNTRIES = [
  { flag: "\u{1F1EB}\u{1F1F7}", name: "France", detail: "15 D\u00e9partements, HCSF 35%, 4 Mietsteuerregime" },
  { flag: "\u{1F1E9}\u{1F1EA}", name: "Germany", detail: "16 Bundesl\u00e4nder, AfA-Abschreibung, Grunderwerbsteuer" },
  { flag: "\u{1F1EC}\u{1F1E7}", name: "United Kingdom", detail: "SDLT / LBTT / LTT, Section 24 Steuergutschrift" },
  { flag: "\u{1F1F1}\u{1F1FA}", name: "Luxembourg", detail: "B\u00ebllegen Akt Gutschrift, 7% Registrierung" },
  { flag: "\u{1F1E7}\u{1F1EA}", name: "Belgium", detail: "3 Regionen (Flandern 2%, Wallonien 3%, Br\u00fcssel)" },
  { flag: "\u{1F1EA}\u{1F1F8}", name: "Spain", detail: "17 Comunidades, ITP 4-10%, IRPF/IRNR" },
  { flag: "\u{1F1F5}\u{1F1F9}", name: "Portugal", detail: "Progressive IMT, Befreiung f\u00fcr Jungk\u00e4ufer" },
  { flag: "\u{1F1EE}\u{1F1F9}", name: "Italy", detail: "Prima casa 2%, cedolare secca 21%/26%" },
  { flag: "\u{1F1F3}\u{1F1F1}", name: "Netherlands", detail: "0%/2%/8% Overdrachtsbelasting, Box 3" },
  { flag: "\u{1F1FA}\u{1F1F8}", name: "USA", detail: "51 Staaten Grunderwerbsteuer, 27,5 Jahre Abschreibung" },
];

const INTEGRATIONS = [
  { name: "Gutenberg", desc: "Nativer Block mit InspectorControls" },
  { name: "Elementor", desc: "Widget mit vollst\u00e4ndigem Einstellungspanel" },
  { name: "Divi Builder", desc: "Benutzerdefiniertes Modul in der PropCalc-Kategorie" },
  { name: "Bricks Builder", desc: "Element mit Steuerelementen" },
  { name: "WooCommerce", desc: "Preis automatisch von Produktseiten \u00fcbernehmen" },
  { name: "Classic Widget", desc: "Per Drag & Drop in jede Seitenleiste" },
];

export default function PropCalcPage() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-teal/10 border border-teal/20 px-4 py-1.5 text-sm font-medium text-teal mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" /></svg>
            Kostenloses WordPress-Plugin
          </div>
          <h1 className="text-4xl font-bold text-navy sm:text-5xl tracking-tight">
            Der Multi-L&auml;nder Immobilien-Rechner<br />f&uuml;r WordPress
          </h1>
          <p className="mt-6 text-lg text-muted max-w-2xl mx-auto leading-relaxed">
            10 L&auml;nder mit regionaler Granularit&auml;t. 10 Rechner-Module. 7 Sprachen.
            Hypothek, Erwerbsnebenkosten, Mietrendite, Cashflow und l&auml;nder&uuml;bergreifender Vergleich — alles clientseitig, DSGVO-konform.
          </p>
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link href="https://wordpress.org/plugins/propcalc-real-estate-investment-calculator/" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              Auf WordPress.org herunterladen &rarr;
            </Link>
            <Link href="#modules" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              Alle Module ansehen
            </Link>
          </div>
          <p className="mt-6 text-xs text-muted">
            Kostenlos &middot; Kein Konto erforderlich &middot; 258 Unit-Tests &middot; Von <span className="font-medium text-navy">Tevaxia</span>
          </p>
        </div>
      </section>

      {/* Stats bar */}
      <section className="border-y border-card-border bg-card">
        <div className="mx-auto max-w-5xl px-4 py-8 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: "10", label: "L\u00e4nder" },
            { value: "10", label: "Rechner-Module" },
            { value: "7", label: "Sprachen" },
            { value: "4", label: "Page Builders" },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-3xl font-bold text-navy">{s.value}</div>
              <div className="text-sm text-muted mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="modules" className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">10 Rechner-Module</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">Jedes Modul funktioniert eigenst&auml;ndig oder kombiniert. Echtzeit-Berechnung — kein &quot;Berechnen&quot;-Button n&ouml;tig.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {MODULES.map((m) => (
              <div key={m.name} className="flex gap-4 p-5 rounded-xl border border-card-border bg-card hover:border-teal/30 transition-colors">
                <div className="w-10 h-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0 text-teal">
                  <Icon d={m.icon} />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-navy">{m.name}</h3>
                  <p className="text-xs text-muted mt-1 leading-relaxed">{m.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">10 L&auml;nder mit regionaler Granularit&auml;t</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">L&auml;nderspezifische Steuerregeln, Notargeb&uuml;hrenstaffeln und regionale Besonderheiten integriert.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {COUNTRIES.map((c) => (
              <div key={c.name} className="flex items-start gap-3 p-4 rounded-xl border border-card-border bg-background">
                <span className="text-2xl">{c.flag}</span>
                <div>
                  <div className="text-sm font-semibold text-navy">{c.name}</div>
                  <div className="text-xs text-muted mt-0.5">{c.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-4">Funktioniert &uuml;berall</h2>
          <p className="text-muted text-center max-w-xl mx-auto mb-12">Shortcode, Block oder Widget — PropCalc integriert sich in jeden gro&szlig;en WordPress Page Builder.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {INTEGRATIONS.map((i) => (
              <div key={i.name} className="p-5 rounded-xl border border-card-border bg-card text-center">
                <div className="text-sm font-semibold text-navy">{i.name}</div>
                <div className="text-xs text-muted mt-1">{i.desc}</div>
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

      {/* Shortcode examples */}
      <section className="py-20 bg-card border-y border-card-border">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="text-2xl font-bold text-navy text-center mb-12">F&uuml;r jeden Anwendungsfall</h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Immobilienagentur", code: "[propcalc module=\"fees,borrowing\" price=\"350000\" country=\"fr\"]", desc: "Vorausgef\u00fcllt mit dem Angebotspreis" },
              { title: "Investment-Blog", code: "[propcalc]", desc: "Komplettpaket, alle Module" },
              { title: "Hypothekenmakler", code: "[propcalc module=\"prequalify,borrowing,amortization\"]", desc: "Lead-Magnet in 3 Feldern" },
              { title: "Seitenleisten-Widget", code: "[propcalc module=\"prequalify\" size=\"compact\"]", desc: "Kompakte Vorab-Qualifizierung" },
              { title: "Expat-Portal", code: "[propcalc module=\"comparator,fees\" countries=\"fr,de,lu,be\"]", desc: "L\u00e4nder\u00fcbergreifender Vergleich" },
              { title: "WooCommerce", code: "Automatische Erkennung vom Produktpreis", desc: "Einstellungen \u2192 WooCommerce-Tab" },
            ].map((ex) => (
              <div key={ex.title} className="p-5 rounded-xl border border-card-border bg-background">
                <div className="text-sm font-semibold text-navy mb-2">{ex.title}</div>
                <code className="block text-xs bg-navy/5 text-navy/70 px-3 py-2 rounded-lg font-mono break-all">{ex.code}</code>
                <p className="text-xs text-muted mt-2">{ex.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold text-navy mb-4">Bereit, einen Rechner zu Ihrer Website hinzuzuf&uuml;gen?</h2>
          <p className="text-muted mb-8">Kostenlos, Open Source, DSGVO-konform. Installation in unter einer Minute.</p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Link href="https://wordpress.org/plugins/propcalc-real-estate-investment-calculator/" className="rounded-xl bg-navy px-8 py-3.5 text-sm font-semibold text-white hover:bg-navy-light transition-colors">
              PropCalc herunterladen &rarr;
            </Link>
            <Link href="https://github.com/tevaxia/propcalc" className="rounded-xl border border-card-border px-8 py-3.5 text-sm font-semibold text-navy hover:bg-card transition-colors">
              Auf GitHub ansehen
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
