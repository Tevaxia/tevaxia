"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import LanguageSwitcher from "../LanguageSwitcher";

const ALL_TOOLS = [
  { href: "/impact", key: "impact" },
  { href: "/renovation", key: "renovation" },
  { href: "/communaute", key: "communaute" },
  { href: "/epbd", key: "epbd" },
  { href: "/estimateur-cpe", key: "estimateurCpe" },
  { href: "/lenoz", key: "lenoz" },
  { href: "/portfolio", key: "portfolio" },
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
          <Link href="/" className="flex items-center gap-2">
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
            <LanguageSwitcher />
            {user ? (
              <a href="https://tevaxia.lu/profil" className="hidden sm:flex items-center gap-1.5 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/20 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
                {user.email?.split("@")[0]}
              </a>
            ) : (
              <a href="https://tevaxia.lu/connexion" className="hidden sm:flex items-center gap-1.5 rounded-lg bg-energy/20 border border-energy/40 px-3 py-1.5 text-xs font-semibold text-energy-light hover:bg-energy/30 hover:text-white transition-colors">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
                Connexion
              </a>
            )}
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
                <a href="https://tevaxia.lu/profil" className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white">
                  Mon profil ({user.email?.split("@")[0]})
                </a>
              ) : (
                <a href="https://tevaxia.lu/connexion" className="block rounded-lg px-3 py-2 text-sm font-medium text-energy-light hover:bg-white/10">
                  Connexion / Inscription
                </a>
              )}
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
