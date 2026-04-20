"use client";

import LocaleLink from "./LocaleLink";
import { useTranslations } from "next-intl";

export default function Footer() {
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <footer className="border-t border-card-border bg-navy-dark text-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {/* Logo + tagline */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-navy-dark font-bold text-sm">T</div>
              <span className="font-semibold text-white/80">tevaxia<span className="text-gold">.lu</span></span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              Outils immobiliers pour le Luxembourg.
            </p>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tc("legal")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><LocaleLink href="/mentions-legales" className="hover:text-white transition-colors">{tc("legalNotice")}</LocaleLink></li>
              <li><LocaleLink href="/confidentialite" className="hover:text-white transition-colors">{tc("privacy")}</LocaleLink></li>
              <li><LocaleLink href="/cgu" className="hover:text-white transition-colors">CGU</LocaleLink></li>
              <li><LocaleLink href="/solutions" className="hover:text-white transition-colors">Solutions</LocaleLink></li>
              <li><LocaleLink href="/plan-du-site" className="hover:text-white transition-colors">Plan du site</LocaleLink></li>
            </ul>
          </div>

          {/* Sources externes */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("sourcesExternes")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><a href="https://observatoire.liser.lu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Observatoire de l&apos;Habitat</a></li>
              <li><a href="https://statistiques.public.lu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">STATEC</a></li>
              <li><a href="https://data.public.lu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">data.public.lu</a></li>
              <li><a href="https://legilux.public.lu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Legilux</a></li>
              <li><a href="https://www.myenergy.lu" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">myenergy.lu</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">Contact</h3>
            <a href="mailto:contact@tevaxia.lu" className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              contact@tevaxia.lu
            </a>
            <p className="mt-3 text-xs text-white/40">{tc("suggestionText")}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-white/10 pt-6 text-center text-xs text-white/30">
          tevaxia.lu — {tc("disclaimer")}
        </div>
      </div>
    </footer>
  );
}
