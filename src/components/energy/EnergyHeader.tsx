"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import LanguageSwitcher from "../LanguageSwitcher";

const ALL_TOOLS = [
  { href: "/energy/impact", key: "impact" },
  { href: "/energy/renovation", key: "renovation" },
  { href: "/energy/communaute", key: "communaute" },
  { href: "/energy/epbd", key: "epbd" },
  { href: "/energy/estimateur-cpe", key: "estimateurCpe" },
  { href: "/energy/lenoz", key: "lenoz" },
  { href: "/energy/portfolio", key: "portfolio" },
  { href: "/energy/hvac", key: "hvac" },
];

function Dropdown({ label, items, t }: { label: string; items: typeof ALL_TOOLS; t: (k: string) => string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
        {label}
        <svg className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-52 rounded-xl bg-navy-dark border border-white/10 shadow-xl py-1 z-50">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-white/70 hover:bg-white/10 hover:text-white transition-colors">
              {t(item.key)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function EnergyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("energy.nav");
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-50 bg-navy text-white shadow-lg">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/energy" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-energy text-white font-bold text-lg">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight">
              energy<span className="text-energy-light">.tevaxia</span>
              <span className="text-white/40 text-sm">.lu</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            <Dropdown label={t("outils")} items={ALL_TOOLS} t={t} />
            <a
              href="https://tevaxia.lu"
              className="ml-3 rounded-lg bg-energy/20 border border-energy/40 px-3 py-2 text-sm font-semibold text-energy-light hover:bg-energy/30 hover:text-white transition-colors"
            >
              tevaxia.lu
            </a>
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <div className="hidden sm:flex items-center gap-1">
                <a href="/profil" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  Profil
                </a>
                <a href="/mes-evaluations" className="rounded-lg px-2 py-1 text-xs text-white/60 hover:text-white hover:bg-white/10 transition-colors">
                  Mes éval.
                </a>
              </div>
            ) : (
              <a href="/connexion?returnTo=/" className="hidden sm:inline-flex rounded-lg bg-energy/90 px-3 py-1 text-xs font-medium text-white hover:bg-energy transition-colors">
                Connexion
              </a>
            )}
            <LanguageSwitcher />
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="md:hidden rounded-lg p-2 text-white/80 hover:bg-white/10 hover:text-white"
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
          <nav className="md:hidden border-t border-white/10 py-3 space-y-1">
            {ALL_TOOLS.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                {t(item.key)}
              </Link>
            ))}
            <div className="border-t border-white/10 mt-2 pt-2">
              {user ? (
                <>
                  <a href="/profil" className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                    Profil
                  </a>
                  <a href="/mes-evaluations" className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                    Mes évaluations
                  </a>
                </>
              ) : (
                <a href="/connexion?returnTo=/" className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                  Connexion
                </a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
