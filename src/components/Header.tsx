"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "./LanguageSwitcher";
import { useAuth } from "./AuthProvider";

interface MenuItem {
  href: string;
  key: string;
}

interface MenuGroup {
  key: string;
  items: MenuItem[];
}

const MENU_GROUPS: MenuGroup[] = [
  {
    key: "particuliers",
    items: [
      { href: "/estimation", key: "estimation" },
      { href: "/carte", key: "carte" },
      { href: "/frais-acquisition", key: "frais" },
      { href: "/calculateur-loyer", key: "loyer" },
      { href: "/simulateur-aides", key: "aides" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/achat-vs-location", key: "achatLocation" },
      { href: "/comparer", key: "comparer" },
      { href: "/vefa", key: "vefa" },
    ],
  },
  {
    key: "professionnels",
    items: [
      { href: "/valorisation", key: "valorisation" },
      { href: "/hedonique", key: "hedonique" },
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/outils-bancaires", key: "bancaire" },
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/estimateur-construction", key: "estimateurConstruction" },
      { href: "/calculateur-vrd", key: "calculateurVrd" },
      { href: "/convertisseur-surfaces", key: "convertisseurSurfaces" },
      { href: "/energy/hvac", key: "hvac" },
      { href: "/portfolio", key: "portfolio" },
      { href: "/aml-kyc", key: "amlKyc" },
    ],
  },
  {
    key: "donnees",
    items: [
      { href: "/marche", key: "marche" },
      { href: "/indices", key: "indices" },
      { href: "/pag-pap", key: "pagPap" },
      { href: "/terres-agricoles", key: "terresAgricoles" },
    ],
  },
];

function DropdownMenu({ group, t, onClose }: { group: MenuGroup; t: (key: string) => string; onClose: () => void }) {
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
          {t(item.key)}
        </Link>
      ))}
    </div>
  );
}

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const t = useTranslations("nav");
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold text-navy-dark font-bold text-lg">T</div>
            <span className="text-xl font-bold tracking-tight">tevaxia<span className="text-gold">.lu</span></span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {MENU_GROUPS.map((group) => (
              <div key={group.key} className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === group.key ? null : group.key)}
                  className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                >
                  {t(group.key)}
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                {openDropdown === group.key && (
                  <DropdownMenu group={group} t={t} onClose={() => setOpenDropdown(null)} />
                )}
              </div>
            ))}
            <a href="https://energy.tevaxia.lu" className="flex items-center gap-1 rounded-lg bg-energy/15 border border-energy/30 px-3 py-2 text-sm font-medium text-energy-light hover:bg-energy/25 transition-colors">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Energy
            </a>
            <Link href="/pricing" className="rounded-lg bg-gold/15 border border-gold/30 px-3 py-2 text-sm font-medium text-gold hover:bg-gold/25 transition-colors">
              {t("tarifs")}
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="flex items-center gap-1">
                <Link href="/profil" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  Profil
                </Link>
                <Link href="/mes-evaluations" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  {t("mesEval")}
                </Link>
              </div>
            ) : (
              <Link href="/connexion" className="rounded-lg bg-gold/90 px-3 py-1 text-xs font-medium text-navy-dark hover:bg-gold transition-colors">
                {t("connexion")}
              </Link>
            )}
            <LanguageSwitcher />

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

        {menuOpen && (
          <nav className="lg:hidden border-t border-white/10 py-3 space-y-3">
            {MENU_GROUPS.map((group) => (
              <div key={group.key}>
                <div className="px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white/40">{t(group.key)}</div>
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t(item.key)}
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
