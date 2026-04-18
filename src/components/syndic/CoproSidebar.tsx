"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import { useState } from "react";

interface Props {
  coownershipId: string;
  coownershipName: string;
}

interface NavItem {
  href: string; // path relatif
  label: string;
  icon: string;
  description?: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: "Général",
    items: [
      { href: "", label: "Tableau de bord", icon: "📊", description: "Vue d'ensemble + lots" },
      { href: "/archives", label: "Archives documents", icon: "🗃️", description: "PV, contrats, factures" },
      { href: "/messagerie", label: "Messagerie", icon: "✉️", description: "Communication copropriétaires" },
    ],
  },
  {
    title: "Finance & comptabilité",
    items: [
      { href: "/comptabilite", label: "Comptabilité", icon: "📓", description: "Journal, balance, exercices" },
      { href: "/budget", label: "Budget prévisionnel", icon: "📈", description: "Budget vs réalisé par compte" },
      { href: "/cles-repartition", label: "Clés de répartition", icon: "🔑", description: "Chauffage, ascenseur, escaliers" },
      { href: "/appels", label: "Appels de fonds", icon: "💸", description: "Trimestriels + PDF + paiements" },
      { href: "/fonds-travaux", label: "Fonds de travaux", icon: "🏦", description: "Provision loi 10.06.1999" },
      { href: "/relances", label: "Relances impayés", icon: "⚠️", description: "3 paliers + intérêts légaux" },
    ],
  },
  {
    title: "Assemblées générales",
    items: [
      { href: "/assemblees", label: "Assemblées", icon: "🏛️", description: "Convocation, ODJ, vote en ligne" },
      { href: "/annexes", label: "Annexes comptables AG", icon: "📑", description: "5 annexes PDF obligatoires" },
    ],
  },
  {
    title: "Travaux & projets",
    items: [
      { href: "/travaux", label: "Travaux & devis", icon: "🛠️", description: "RFQ, sélection, suivi" },
    ],
  },
];

export default function CoproSidebar({ coownershipId, coownershipName }: Props) {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const pathname = usePathname();
  const basePath = `${lp}/syndic/coproprietes/${coownershipId}`;
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (href: string): boolean => {
    const fullPath = `${basePath}${href}`;
    if (href === "") return pathname === fullPath;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  };

  return (
    <>
      {/* Mobile toggle */}
      <button onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed bottom-4 right-4 z-50 rounded-full bg-navy px-4 py-3 text-sm font-bold text-white shadow-lg">
        {mobileOpen ? "✕ Fermer" : "☰ Outils syndic"}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        ${mobileOpen ? "fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto" : "hidden"}
        lg:block lg:sticky lg:top-4 lg:self-start lg:h-[calc(100vh-2rem)] lg:overflow-y-auto
        bg-card border-r lg:border border-card-border lg:rounded-xl p-3
      `}>
        <div className="mb-4 px-2">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">Copropriété</div>
          <Link href={basePath} className="mt-1 block text-sm font-bold text-navy hover:underline truncate"
            onClick={() => setMobileOpen(false)}>
            {coownershipName}
          </Link>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <div className="px-2 mb-1 text-[9px] uppercase tracking-wider text-muted font-semibold">
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={`${basePath}${item.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-start gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
                        active
                          ? "bg-navy text-white"
                          : "hover:bg-background text-slate"
                      }`}>
                      <span className="shrink-0 text-base leading-tight">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold ${active ? "" : "text-navy"}`}>
                          {item.label}
                        </div>
                        {item.description && (
                          <div className={`text-[10px] ${active ? "text-white/70" : "text-muted"} truncate`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}

        <div className="mt-4 border-t border-card-border pt-3 px-2 text-[10px] text-muted">
          <Link href={`${lp}/syndic/portefeuille`} className="block hover:text-navy">
            ← Portefeuille multi-copros
          </Link>
          <Link href={`${lp}/syndic/lettres-types`} className="block mt-1 hover:text-navy">
            Bibliothèque lettres types
          </Link>
          <Link href={`${lp}/syndic/benchmark`} className="block mt-1 hover:text-navy">
            Benchmark inter-copros
          </Link>
          <Link href={`${lp}/actions-prioritaires`} className="block mt-1 hover:text-navy">
            Actions prioritaires (cross-modules)
          </Link>
        </div>
      </aside>
    </>
  );
}
