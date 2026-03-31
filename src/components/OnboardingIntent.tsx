"use client";

import { useState } from "react";
import Link from "next/link";

interface IntentCard {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  links: { href: string; label: string }[];
}

const INTENTS: IntentCard[] = [
  {
    id: "acheter",
    title: "Acheter",
    description: "Estimez, simulez les frais et découvrez les aides disponibles",
    color: "from-blue-600 to-blue-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
      </svg>
    ),
    links: [
      { href: "/estimation", label: "Estimation de prix" },
      { href: "/frais-acquisition", label: "Frais d'acquisition" },
      { href: "/simulateur-aides", label: "Simulateur d'aides" },
      { href: "/achat-vs-location", label: "Acheter ou louer ?" },
    ],
  },
  {
    id: "vendre",
    title: "Vendre",
    description: "Évaluez votre bien et anticipez la fiscalité",
    color: "from-emerald-600 to-emerald-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    links: [
      { href: "/estimation", label: "Estimation de prix" },
      { href: "/plus-values", label: "Plus-values immobilières" },
      { href: "/valorisation", label: "Valorisation professionnelle" },
      { href: "/carte", label: "Prix du marché par commune" },
    ],
  },
  {
    id: "investir",
    title: "Investir",
    description: "Analysez la rentabilité et gérez votre portefeuille",
    color: "from-gold-dark to-gold",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    links: [
      { href: "/valorisation", label: "Valorisation EVS" },
      { href: "/dcf-multi", label: "DCF multi-locataires" },
      { href: "/portfolio", label: "Portefeuille" },
      { href: "/outils-bancaires", label: "Outils bancaires" },
    ],
  },
  {
    id: "construire",
    title: "Construire",
    description: "Montez votre opération et vérifiez l'urbanisme",
    color: "from-purple-700 to-purple-500",
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.25 3.03a.75.75 0 01-1.08-.82l1.42-5.87L1.72 7.3a.75.75 0 01.46-1.28l6.06-.46L11.02.82a.75.75 0 011.36 0l2.78 4.74 6.06.46a.75.75 0 01.46 1.28l-4.79 4.21 1.42 5.87a.75.75 0 01-1.08.82l-5.25-3.03z" />
      </svg>
    ),
    links: [
      { href: "/bilan-promoteur", label: "Bilan promoteur" },
      { href: "/vefa", label: "VEFA" },
      { href: "/pag-pap", label: "PAG / PAP urbanisme" },
    ],
  },
];

export default function OnboardingIntent() {
  const [expanded, setExpanded] = useState<string | null>(null);

  function toggle(id: string) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  return (
    <section className="py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-center text-xl font-bold text-navy sm:text-2xl">
          Que souhaitez-vous faire ?
        </h2>
        <p className="mt-2 text-center text-sm text-muted">
          Cliquez pour découvrir les outils adaptés à votre projet
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {INTENTS.map((intent) => {
            const isOpen = expanded === intent.id;
            return (
              <div key={intent.id} className="flex flex-col">
                <button
                  onClick={() => toggle(intent.id)}
                  className={`group flex flex-col items-center rounded-2xl border p-6 text-center transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                    isOpen
                      ? "border-navy ring-2 ring-navy/20 bg-card shadow-lg"
                      : "border-card-border bg-card"
                  }`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${intent.color} text-white shadow-sm`}
                  >
                    {intent.icon}
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-navy">{intent.title}</h3>
                  <p className="mt-1 text-xs text-muted leading-relaxed">{intent.description}</p>
                  <svg
                    className={`mt-3 h-5 w-5 text-muted transition-transform ${isOpen ? "rotate-180" : ""}`}
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
                          href={link.href}
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
