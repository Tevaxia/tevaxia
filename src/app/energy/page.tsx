import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

export const metadata: Metadata = {
  title: "energy.tevaxia.lu — Simulateurs Énergie Immobilier Luxembourg",
};

const SIMULATORS = [
  {
    href: "/impact",
    titleKey: "impactTitle" as const,
    descKey: "impactDesc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    color: "from-emerald-600 to-green-500",
  },
  {
    href: "/renovation",
    titleKey: "renovationTitle" as const,
    descKey: "renovationDesc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.384-3.028A1.125 1.125 0 005.3 12.4v6.146a1.125 1.125 0 00.736.258 1.125 1.125 0 00.535-.258l5.384-3.028a1.125 1.125 0 000-1.948zM20.122 7.647l-5.384-3.028A1.125 1.125 0 0014 4.878v6.146a1.125 1.125 0 00.738.258 1.125 1.125 0 00.535-.258l5.384-3.028a1.125 1.125 0 000-1.949z" />
      </svg>
    ),
    color: "from-teal to-teal-light",
  },
  {
    href: "/communaute",
    titleKey: "communauteTitle" as const,
    descKey: "communauteDesc" as const,
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
      </svg>
    ),
    color: "from-amber-500 to-yellow-400",
  },
];

export default async function EnergyHomePage() {
  const t = await getTranslations("energy.home");

  return (
    <div className="min-h-[80vh]">
      {/* Hero */}
      <section className="bg-gradient-to-br from-navy via-navy-dark to-navy py-16 sm:py-24 text-white">
        <div className="mx-auto max-w-4xl px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            {t("heroTitle")}
            <br />
            <span className="text-energy-light">{t("heroHighlight")}</span>
          </h1>
          <p className="mt-6 text-lg text-white/70 max-w-2xl mx-auto">
            {t("heroDescription")}
          </p>
        </div>
      </section>

      {/* Simulators grid */}
      <section className="py-12 sm:py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {SIMULATORS.map((sim) => (
              <Link
                key={sim.href}
                href={sim.href}
                className="group relative overflow-hidden rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1"
              >
                <div className={`inline-flex items-center justify-center rounded-xl bg-gradient-to-br ${sim.color} p-3 text-white mb-4`}>
                  {sim.icon}
                </div>
                <h2 className="text-lg font-semibold text-foreground mb-2">{t(sim.titleKey)}</h2>
                <p className="text-sm text-muted leading-relaxed">{t(sim.descKey)}</p>
                <div className="mt-4 flex items-center text-sm font-medium text-energy group-hover:text-energy-dark transition-colors">
                  {t("simuler")}
                  <svg className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Context section */}
      <section className="border-t border-card-border bg-card py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h2 className="text-xl font-semibold text-foreground mb-4">{t("whyTitle")}</h2>
          <p className="text-muted leading-relaxed">
            {t("whyDesc", { pct: "33%" })}
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-energy">+33%</div>
              <div className="text-xs text-muted mt-1">{t("statEcart")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-energy">62,5%</div>
              <div className="text-xs text-muted mt-1">{t("statKlimabonus")}</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-energy">120-220</div>
              <div className="text-xs text-muted mt-1">{t("statIsolation")}</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
