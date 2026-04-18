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
      { href: "/rapprochement", label: "Rapprochement bancaire", icon: "🏦", description: "Import CSV banque + matching auto" },
      { href: "/sepa-virements", label: "Virements SEPA", icon: "💳", description: "Pain.001 XML bulk fournisseurs" },
      { href: "/ocr-factures", label: "OCR factures", icon: "📷", description: "Scan PDF/photo → données auto" },
      { href: "/fonds-travaux", label: "Fonds de travaux", icon: "🏛️", description: "Provision loi 10.06.1999" },
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
        bg-card border-r lg:border border-card-border lg:rounded-xl p-4
      `}>
        <div className="mb-5 px-1">
          <div className="text-xs uppercase tracking-wider text-muted font-semibold">Copropriété</div>
          <Link href={basePath} className="mt-1 block text-base font-bold text-navy hover:underline truncate"
            onClick={() => setMobileOpen(false)}>
            {coownershipName}
          </Link>
        </div>

        {SECTIONS.map((section) => (
          <div key={section.title} className="mb-5">
            <div className="px-1 mb-2 text-xs uppercase tracking-wider text-muted font-bold">
              {section.title}
            </div>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link href={`${basePath}${item.href}`}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                        active
                          ? "bg-navy text-white"
                          : "hover:bg-background text-slate"
                      }`}>
                      <span className="shrink-0 text-lg leading-tight">{item.icon}</span>
                      <div className="min-w-0 flex-1">
                        <div className={`font-semibold leading-tight ${active ? "" : "text-navy"}`}>
                          {item.label}
                        </div>
                        {item.description && (
                          <div className={`mt-0.5 text-xs ${active ? "text-white/80" : "text-muted"} truncate`}>
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

        <div className="mt-5 border-t border-card-border pt-4 px-1 space-y-1.5 text-xs">
          <Link href={`${lp}/syndic/portefeuille`} className="block text-muted hover:text-navy font-medium">
            ← Portefeuille multi-copros
          </Link>
          <Link href={`${lp}/syndic/lettres-types`} className="block text-muted hover:text-navy font-medium">
            📝 Bibliothèque lettres types
          </Link>
          <Link href={`${lp}/syndic/benchmark`} className="block text-muted hover:text-navy font-medium">
            📊 Benchmark inter-copros
          </Link>
          <Link href={`${lp}/actions-prioritaires`} className="block text-muted hover:text-navy font-medium">
            🔔 Actions prioritaires
          </Link>
        </div>
      </aside>
    </>
  );
}
