import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "next-intl/server";

export const metadata: Metadata = {
  title: "Location courte durée Luxembourg — Airbnb, Booking, Vrbo | tevaxia.lu",
  description:
    "3 calculateurs STR pour hôtes Airbnb/Booking au Luxembourg : rentabilité nette après impôt, conformité (seuil 3 mois, licence, EU Reg 2026), arbitrage long vs court terme.",
};

const TOOLS = [
  {
    href: "/str/rentabilite",
    title: "Rentabilité STR",
    description: "Calculez le revenu net annuel d'un bien en Airbnb/Booking au Luxembourg, charges et impôt inclus.",
    color: "from-rose-600 to-orange-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/str/compliance",
    title: "Conformité STR Luxembourg",
    description: "Checklist légale : seuil 3 mois, licence hébergement, règlements communaux, EU Regulation 2024/1028.",
    color: "from-amber-600 to-yellow-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
  },
  {
    href: "/str/arbitrage",
    title: "Arbitrage LT vs CT vs Mix",
    description: "Comparez location longue durée (règle 5%), Airbnb pur et scénario mixte — trouvez l'option la plus rentable selon votre profil fiscal.",
    color: "from-indigo-600 to-violet-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21 3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
      </svg>
    ),
  },
  {
    href: "/str/pricing",
    title: "Dynamic pricing LU",
    description: "Tarification mois par mois selon la saisonnalité LU (Schueberfouer, Marathon, marchés de Noël). Alternative locale à PriceLabs/Wheelhouse.",
    color: "from-pink-600 to-fuchsia-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.307a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
      </svg>
    ),
  },
  {
    href: "/str/observatoire",
    title: "Observatoire ADR LU",
    description: "ADR médian, percentiles, occupation et RevPAR par zone. 4 200 listings LU Q4 2025. Alternative locale gratuite à AirDNA.",
    color: "from-teal-600 to-emerald-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
  },
  {
    href: "/str/compliance-eu",
    title: "Registre EU STR 2024/1028",
    description: "Enregistrement obligatoire au registre européen des locations courte durée (mi-2026). Génération du dossier + numéro d'identification.",
    color: "from-blue-600 to-sky-600",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25c5.385 0 9.75 4.365 9.75 9.75M12 2.25c-5.385 0-9.75 4.365-9.75 9.75M12 2.25v19.5M2.25 12h19.5" />
      </svg>
    ),
  },
];

export default async function StrHub() {
  const locale = await getLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  return (
    <div className="bg-background">
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-900 via-rose-800 to-pink-800 py-20">
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-white/80">
            <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400"></span>
            Nouveau vertical — avril 2026
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Location courte durée au Luxembourg
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg leading-8 text-white/80">
            3 outils gratuits pour les hôtes Airbnb, Booking, Vrbo et saisonnier au Luxembourg. Rentabilité réaliste,
            conformité légale 2026, arbitrage entre location longue et courte durée.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-white/60">
            <span className="rounded-full border border-white/20 px-3 py-1">Seuil 3 mois / an</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Fiscalité IR LU</span>
            <span className="rounded-full border border-white/20 px-3 py-1">EU Regulation 2024/1028</span>
            <span className="rounded-full border border-white/20 px-3 py-1">Airbnb / Booking / Vrbo</span>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={`${lp}${tool.href}`}
                className="group relative flex flex-col rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-0.5"
              >
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${tool.color} text-white shadow-sm`}>
                  {tool.icon}
                </div>
                <h3 className="text-lg font-semibold text-navy group-hover:text-navy-light transition-colors">
                  {tool.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>
                <div className="mt-4 flex items-center justify-end">
                  <svg className="h-5 w-5 text-muted transition-transform group-hover:translate-x-1 group-hover:text-navy" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-card-border bg-card py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl text-center">Pourquoi un vertical STR dédié au Luxembourg ?</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">📐</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Règles LU spécifiques</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Au-delà de <strong>90 jours cumulés par an</strong>, le loueur doit obtenir une licence d&apos;hébergement
                (art. 6 loi 17.07.2020). Luxembourg-Ville impose des restrictions communales supplémentaires.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">🇪🇺</div>
              <h3 className="mt-3 text-base font-semibold text-navy">EU Regulation 2024/1028</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Entrée en vigueur <strong>mi-2026</strong> : registre unique européen, transmission obligatoire des nuitées
                aux communes. Tous les hôtes Airbnb/Booking concernés.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">💶</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Fiscalité IR 2026</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                Revenus &gt; 600 €/an → déclaration IR obligatoire. Taux marginal jusqu&apos;à
                <strong> 45,78 %</strong> (IR 42 % × contribution emploi 1,09). Charges déductibles : intérêts, PNO, ménage, OTA 15-18 %.
              </p>
            </div>
            <div className="rounded-xl border border-card-border bg-background p-6">
              <div className="text-3xl">📊</div>
              <h3 className="mt-3 text-base font-semibold text-navy">Arbitrage LT vs CT</h3>
              <p className="mt-2 text-sm text-muted leading-relaxed">
                La règle des 5 % plafonne les loyers long terme LU — mais le STR est-il plus rentable après charges,
                commissions OTA et impôts ? Nos outils vous donnent la réponse chiffrée.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
