"use client";

import LocaleLink from "./LocaleLink";
import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";

const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];

export default function Footer() {
  const tc = useTranslations("common");
  const tn = useTranslations("nav");
  const pathname = usePathname();
  const locale = LOCALE_PREFIXES.find(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  ) || "fr";
  const localePath = locale === "fr" ? "" : `/${locale}`;

  return (
    <footer className="border-t border-card-border bg-navy-dark text-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-6">
          {/* Logo */}
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded bg-gold text-navy-dark font-bold text-sm">T</div>
              <span className="font-semibold text-white/80">tevaxia<span className="text-gold">.lu</span></span>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-white/40">
              Outils immobiliers pour le Luxembourg.
            </p>
          </div>

          {/* Particuliers */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("particuliers")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><LocaleLink href="/estimation" className="hover:text-white transition-colors">{tn("estimation")}</LocaleLink></li>
              <li><LocaleLink href="/carte" className="hover:text-white transition-colors">{tn("carte")}</LocaleLink></li>
              <li><LocaleLink href="/frais-acquisition" className="hover:text-white transition-colors">{tn("frais")}</LocaleLink></li>
              <li><LocaleLink href="/calculateur-loyer" className="hover:text-white transition-colors">{tn("loyer")}</LocaleLink></li>
              <li><LocaleLink href="/simulateur-aides" className="hover:text-white transition-colors">{tn("aides")}</LocaleLink></li>
              <li><LocaleLink href="/plus-values" className="hover:text-white transition-colors">{tn("plusValues")}</LocaleLink></li>
              <li><LocaleLink href="/achat-vs-location" className="hover:text-white transition-colors">{tn("achatLocation")}</LocaleLink></li>
              <li><LocaleLink href="/comparer" className="hover:text-white transition-colors">{tn("comparer")}</LocaleLink></li>
              <li><LocaleLink href="/vefa" className="hover:text-white transition-colors">{tn("vefa")}</LocaleLink></li>
            </ul>
          </div>

          {/* Professionnels */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("professionnels")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><LocaleLink href="/valorisation" className="hover:text-white transition-colors">{tn("valorisation")}</LocaleLink></li>
              <li><LocaleLink href="/hedonique" className="hover:text-white transition-colors">{tn("hedonique")}</LocaleLink></li>
              <li><LocaleLink href="/dcf-multi" className="hover:text-white transition-colors">{tn("dcfMulti")}</LocaleLink></li>
              <li><LocaleLink href="/bilan-promoteur" className="hover:text-white transition-colors">{tn("bilanPromoteur")}</LocaleLink></li>
              <li><LocaleLink href="/estimateur-construction" className="hover:text-white transition-colors">{tn("estimateurConstruction")}</LocaleLink></li>
              <li><LocaleLink href="/calculateur-vrd" className="hover:text-white transition-colors">{tn("calculateurVrd")}</LocaleLink></li>
              <li><LocaleLink href="/convertisseur-surfaces" className="hover:text-white transition-colors">{tn("convertisseurSurfaces")}</LocaleLink></li>
              <li><LocaleLink href="/outils-bancaires" className="hover:text-white transition-colors">{tn("bancaire")}</LocaleLink></li>
              <li><LocaleLink href="/portfolio" className="hover:text-white transition-colors">{tn("portfolio")}</LocaleLink></li>
              <li><LocaleLink href="/aml-kyc" className="hover:text-white transition-colors">{tn("amlKyc")}</LocaleLink></li>
            </ul>
          </div>

          {/* Données & Légal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("donnees")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><LocaleLink href="/marche" className="hover:text-white transition-colors">{tn("marche")}</LocaleLink></li>
              <li><LocaleLink href="/indices" className="hover:text-white transition-colors">{tn("indices")}</LocaleLink></li>
              <li><LocaleLink href="/pag-pap" className="hover:text-white transition-colors">{tn("pagPap")}</LocaleLink></li>
              <li><LocaleLink href="/terres-agricoles" className="hover:text-white transition-colors">{tn("terresAgricoles")}</LocaleLink></li>
            </ul>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 mt-6">{tn("guide")}</h3>
            <ul className="space-y-1.5 text-sm mb-6">
              <li><LocaleLink href="/guide" className="hover:text-white transition-colors">{tn("guide")}</LocaleLink></li>
            </ul>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 mt-6">{tc("legal")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><LocaleLink href="/mentions-legales" className="hover:text-white transition-colors">{tc("legalNotice")}</LocaleLink></li>
              <li><LocaleLink href="/confidentialite" className="hover:text-white transition-colors">{tc("privacy")}</LocaleLink></li>
              <li><LocaleLink href="/pricing" className="hover:text-white transition-colors">Tarifs</LocaleLink></li>
              <li><LocaleLink href="/plan-du-site" className="hover:text-white transition-colors">Plan du site</LocaleLink></li>
              <li><LocaleLink href={`${localePath}/propcalc`} className="hover:text-white transition-colors text-teal-light">PropCalc (WordPress)</LocaleLink></li>
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

          {/* Energy + Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
              <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              {tn("energy")}
            </h3>
            <ul className="space-y-1.5 text-sm mb-6">
              <li><LocaleLink href="/energy/impact" className="hover:text-energy-light transition-colors">{tn("energyImpact")}</LocaleLink></li>
              <li><LocaleLink href="/energy/renovation" className="hover:text-energy-light transition-colors">{tn("energyRenovation")}</LocaleLink></li>
              <li><LocaleLink href="/energy/communaute" className="hover:text-energy-light transition-colors">{tn("energyCommunaute")}</LocaleLink></li>
              <li><LocaleLink href="/energy/hvac" className="hover:text-energy-light transition-colors">{tn("hvac")}</LocaleLink></li>
              <li><LocaleLink href="/energy/epbd" className="hover:text-energy-light transition-colors">{tn("energyEpbd")}</LocaleLink></li>
              <li><LocaleLink href="/energy/estimateur-cpe" className="hover:text-energy-light transition-colors">{tn("energyCpe")}</LocaleLink></li>
              <li><LocaleLink href="/energy/lenoz" className="hover:text-energy-light transition-colors">{tn("energyLenoz")}</LocaleLink></li>
            </ul>
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
