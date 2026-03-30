"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "./AuthProvider";

interface MenuGroup {
  label: string;
  items: { href: string; label: string }[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    label: "Estimer",
    items: [
      { href: "/estimation", label: "Estimation instantanée" },
      { href: "/carte", label: "Carte des prix" },
    ],
  },
  {
    label: "Calculer",
    items: [
      { href: "/calculateur-loyer", label: "Capital investi & Loyer" },
      { href: "/frais-acquisition", label: "Frais d'acquisition" },
      { href: "/plus-values", label: "Plus-values" },
      { href: "/simulateur-aides", label: "Simulateur d'aides" },
      { href: "/outils-bancaires", label: "Outils bancaires" },
      { href: "/achat-vs-location", label: "Acheter ou louer" },
    ],
  },
  {
    label: "Évaluer",
    items: [
      { href: "/valorisation", label: "Valorisation EVS 2025" },
      { href: "/dcf-multi", label: "DCF multi-locataires" },
      { href: "/bilan-promoteur", label: "Bilan promoteur" },
      { href: "/portfolio", label: "Portfolio" },
    ],
  },
];

function DropdownMenu({ group, onClose }: { group: MenuGroup; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute top-full left-0 mt-1 w-56 rounded-lg border border-white/10 bg-navy-dark shadow-xl py-1 z-50">
      {group.items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="block px-4 py-2 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          onClick={onClose}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-lg">T</div>
            <span className="text-xl font-bold tracking-tight">tevaxia<span className="text-gold">.lu</span></span>
          </Link>

          {/* Desktop nav — grouped dropdowns */}
          <nav className="hidden lg:flex items-center gap-1">
            {MENU_GROUPS.map((group) => (
              <div key={group.label} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === group.label ? null : group.label)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {group.label}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openDropdown === group.label && (
                  <DropdownMenu group={group} onClose={() => setOpenDropdown(null)} />
                )}
              </div>
            ))}
            <Link href="/pricing" className="rounded-lg px-3 py-2 text-xs font-medium text-gold/80 hover:text-gold hover:bg-white/10 transition-colors">
              Tarifs
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Link href="/mes-evaluations" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                Mes éval.
              </Link>
            ) : (
              <Link href="/connexion" className="rounded-lg bg-gold/90 px-3 py-1 text-xs font-medium text-navy-dark hover:bg-gold transition-colors">
                Connexion
              </Link>
            )}
            <LanguageSwitcher />

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Menu"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                {menuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <nav className="lg:hidden border-t border-white/10 py-3 space-y-3">
            {MENU_GROUPS.map((group) => (
              <div key={group.label}>
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/40">{group.label}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
