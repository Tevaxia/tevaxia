"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";

interface IntentCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  links: { href: string; label: string }[];
}

export default function OnboardingIntent() {
  const t = useTranslations("onboarding");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const [expanded, setExpanded] = useState<string | null>(null);

  const INTENTS: IntentCard[] = [
    {
      id: "particulier",
      title: t("particulier.title"),
      description: t("particulier.description"),
      color: "from-blue-600 to-blue-500",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
        </svg>
      ),
      links: [
        { href: "/wizard-particulier", label: t("particulier.linkWizard") },
        { href: "/estimation", label: t("particulier.link1") },
        { href: "/frais-acquisition", label: t("particulier.link2") },
        { href: "/simulateur-aides", label: t("particulier.link3") },
        { href: "/calculateur-loyer", label: t("particulier.link4") },
        { href: "/achat-vs-location", label: t("particulier.link5") },
        { href: "/plus-values", label: t("particulier.link6") },
      ],
    },
    {
      id: "investisseur",
      title: t("investisseur.title"),
      description: t("investisseur.description"),
      color: "from-gold-dark to-gold",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      links: [
        { href: "/gestion-locative", label: t("investisseur.linkGestion") },
        { href: "/valorisation", label: t("investisseur.link1") },
        { href: "/dcf-multi", label: t("investisseur.link2") },
        { href: "/portfolio", label: t("investisseur.link3") },
        { href: "/propcalc", label: t("investisseur.link4") },
        { href: "/comparer", label: t("investisseur.link5") },
        { href: "/inspection", label: t("investisseur.linkInspection") },
        { href: "/transparence", label: t("investisseur.linkTransparence") },
      ],
    },
    {
      id: "promoteur",
      title: t("promoteur.title"),
      description: t("promoteur.description"),
      color: "from-amber-600 to-amber-500",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 11-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 004.486-6.336l-3.276 3.277a3.004 3.004 0 01-2.25-2.25l3.276-3.276a4.5 4.5 0 00-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
        </svg>
      ),
      links: [
        { href: "/bilan-promoteur", label: t("promoteur.link1") },
        { href: "/vefa", label: t("promoteur.link2") },
        { href: "/estimateur-construction", label: t("promoteur.link3") },
        { href: "/calculateur-vrd", label: t("promoteur.link4") },
        { href: "/pag-pap", label: t("promoteur.link5") },
        { href: "/convertisseur-surfaces", label: t("promoteur.link6") },
      ],
    },
    {
      id: "agent",
      title: t("agent.title"),
      description: t("agent.description"),
      color: "from-rose-600 to-pink-500",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
        </svg>
      ),
      links: [
        { href: "/pro-agences", label: t("agent.link1") },
        { href: "/estimation", label: t("agent.link2") },
        { href: "/hedonique", label: t("agent.link3") },
        { href: "/carte", label: t("agent.link4") },
      ],
    },
    {
      id: "syndic",
      title: t("syndic.title"),
      description: t("syndic.description"),
      color: "from-orange-600 to-amber-500",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      ),
      links: [
        { href: "/syndic", label: t("syndic.link1") },
        { href: "/syndic/coproprietes", label: t("syndic.linkCopros") },
        { href: "/gestion-locative", label: t("syndic.linkGestion") },
        { href: "/bail-commercial", label: t("syndic.linkBailCo") },
        { href: "/calculateur-loyer", label: t("syndic.link2") },
        { href: "/portfolio", label: t("syndic.link3") },
        { href: "/energy/portfolio", label: t("syndic.link4") },
      ],
    },
    {
      id: "banque",
      title: t("banque.title"),
      description: t("banque.description"),
      color: "from-slate to-slate",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0012 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75z" />
        </svg>
      ),
      links: [
        { href: "/api-banques", label: t("banque.link1") },
        { href: "/outils-bancaires", label: t("banque.link2") },
        { href: "/aml-kyc", label: t("banque.link3") },
        { href: "/valorisation", label: t("banque.link4") },
      ],
    },
    {
      id: "hotellerie",
      title: t("hotellerie.title"),
      description: t("hotellerie.description"),
      color: "from-purple-700 to-purple-500",
      icon: (
        <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m18-18v18M6 8.25h2.25M6 12h2.25m-2.25 3.75h2.25M9.75 8.25h.008v.008H9.75V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008zm5.625-7.5h.008v.008h-.008V8.25zm.375 3.75h.008v.008h-.008V12zm.375 3.75h.008v.008h-.008v-.008z" />
        </svg>
      ),
      links: [
        { href: "/hotellerie", label: t("hotellerie.link1") },
        { href: "/hotellerie/groupe", label: t("hotellerie.linkGroupe") },
        { href: "/hotellerie/forecast", label: t("hotellerie.linkForecast") },
        { href: "/hotellerie/valorisation", label: t("hotellerie.link2") },
        { href: "/hotellerie/exploitation", label: t("hotellerie.link4") },
        { href: "/hotellerie/dscr", label: t("hotellerie.link3") },
        { href: "/hotellerie/revpar-comparison", label: t("hotellerie.linkRevpar") },
        { href: "/hotellerie/renovation", label: t("hotellerie.linkReno") },
        { href: "/hotellerie/score-e2", label: t("hotellerie.link5") },
      ],
    },
  ];

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <section id="profils" className="py-12 sm:py-16 scroll-mt-4">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-navy sm:text-2xl">
          {t("heading")}
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          {t("subheading")}
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          {INTENTS.map((intent) => {
            const isOpen = expanded === intent.id;
            return (
              <div key={intent.id} className="flex flex-col">
                <button
                  onClick={() => toggle(intent.id)}
                  className={`group flex flex-col items-center rounded-2xl border p-4 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isOpen
                      ? "border-navy ring-2 ring-navy/20 bg-card shadow-lg"
                      : "border-card-border bg-card"
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${intent.color} text-white shadow-sm`}
                  >
                    {intent.icon}
                  </div>
                  <h3 className="mt-3 text-sm font-semibold text-navy">{intent.title}</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{intent.description}</p>
                  <svg
                    className={`mt-2 h-4 w-4 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {isOpen && (
                  <div className="mt-2 rounded-xl border border-card-border bg-card p-3 shadow-sm animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="space-y-1.5">
                      {intent.links.map((link) => (
                        <Link
                          key={link.href}
                          href={`${lp}${link.href}`}
                          className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-navy hover:bg-background transition-colors"
                        >
                          {link.label}
                          <svg
                            className="h-4 w-4 text-muted"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                          </svg>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
