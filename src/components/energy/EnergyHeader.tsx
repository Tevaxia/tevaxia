"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import LanguageSwitcher from "../LanguageSwitcher";

const NAV_ITEMS = [
  { href: "/impact", key: "impact" },
  { href: "/renovation", key: "renovation" },
  { href: "/communaute", key: "communaute" },
];

export default function EnergyHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useTranslations("energy.nav");

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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
              >
                {t(item.key)}
              </Link>
            ))}
            <a
              href="https://tevaxia.lu"
              className="ml-2 rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/50 hover:text-white hover:border-white/30 transition-colors"
            >
              tevaxia.lu
            </a>
          </nav>

          <div className="flex items-center gap-2">
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
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-lg px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white"
                onClick={() => setMenuOpen(false)}
              >
                {t(item.key)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  );
}
