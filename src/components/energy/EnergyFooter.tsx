"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function EnergyFooter() {
  const t = useTranslations("energy.nav");
  const tc = useTranslations("common");

  return (
    <footer className="border-t border-card-border bg-navy-dark text-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-energy text-white font-bold text-sm">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                </svg>
              </div>
              <span className="font-semibold text-white/80">
                energy<span className="text-energy-light">.tevaxia</span>
              </span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              Simulateurs de performance et transition énergétique pour l&apos;immobilier au Luxembourg.
            </p>
          </div>

          {/* Outils */}
          <div className="sm:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{t("outils")}</h3>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
              <li><Link href="/impact" className="hover:text-white transition-colors">{t("impact")}</Link></li>
              <li><Link href="/epbd" className="hover:text-white transition-colors">{t("epbd")}</Link></li>
              <li><Link href="/renovation" className="hover:text-white transition-colors">{t("renovation")}</Link></li>
              <li><Link href="/estimateur-cpe" className="hover:text-white transition-colors">{t("estimateurCpe")}</Link></li>
              <li><Link href="/communaute" className="hover:text-white transition-colors">{t("communaute")}</Link></li>
              <li><Link href="/lenoz" className="hover:text-white transition-colors">{t("lenoz")}</Link></li>
              <li>&nbsp;</li>
              <li><Link href="/portfolio" className="hover:text-white transition-colors">{t("portfolio")}</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tc("legal")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><a href="https://tevaxia.lu" className="hover:text-white transition-colors">tevaxia.lu</a></li>
              <li><a href="https://tevaxia.lu/mentions-legales" className="hover:text-white transition-colors">{tc("legalNotice")}</a></li>
              <li><a href="https://tevaxia.lu/confidentialite" className="hover:text-white transition-colors">{tc("privacy")}</a></li>
            </ul>
            <a href="mailto:contact@tevaxia.lu" className="mt-4 inline-flex items-center gap-2 text-sm text-energy-light hover:text-energy transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              contact@tevaxia.lu
            </a>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          energy.tevaxia.lu — {tc("disclaimer")}
        </div>
      </div>
    </footer>
  );
}
