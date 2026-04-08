"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export default function Footer() {
  const tc = useTranslations("common");
  const tn = useTranslations("nav");

  return (
    <footer className="border-t border-card-border bg-navy-dark text-white/60">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
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
              <li><Link href="/estimation" className="hover:text-white transition-colors">{tn("estimation")}</Link></li>
              <li><Link href="/carte" className="hover:text-white transition-colors">{tn("carte")}</Link></li>
              <li><Link href="/frais-acquisition" className="hover:text-white transition-colors">{tn("frais")}</Link></li>
              <li><Link href="/calculateur-loyer" className="hover:text-white transition-colors">{tn("loyer")}</Link></li>
              <li><Link href="/simulateur-aides" className="hover:text-white transition-colors">{tn("aides")}</Link></li>
              <li><Link href="/plus-values" className="hover:text-white transition-colors">{tn("plusValues")}</Link></li>
              <li><Link href="/achat-vs-location" className="hover:text-white transition-colors">{tn("achatLocation")}</Link></li>
              <li><Link href="/comparer" className="hover:text-white transition-colors">{tn("comparer")}</Link></li>
              <li><Link href="/vefa" className="hover:text-white transition-colors">{tn("vefa")}</Link></li>
            </ul>
          </div>

          {/* Professionnels */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("professionnels")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/valorisation" className="hover:text-white transition-colors">{tn("valorisation")}</Link></li>
              <li><Link href="/hedonique" className="hover:text-white transition-colors">{tn("hedonique")}</Link></li>
              <li><Link href="/dcf-multi" className="hover:text-white transition-colors">{tn("dcfMulti")}</Link></li>
              <li><Link href="/bilan-promoteur" className="hover:text-white transition-colors">{tn("bilanPromoteur")}</Link></li>
              <li><Link href="/estimateur-construction" className="hover:text-white transition-colors">{tn("estimateurConstruction")}</Link></li>
              <li><Link href="/calculateur-vrd" className="hover:text-white transition-colors">{tn("calculateurVrd")}</Link></li>
              <li><Link href="/convertisseur-surfaces" className="hover:text-white transition-colors">{tn("convertisseurSurfaces")}</Link></li>
              <li><Link href="/outils-bancaires" className="hover:text-white transition-colors">{tn("bancaire")}</Link></li>
              <li><Link href="/portfolio" className="hover:text-white transition-colors">{tn("portfolio")}</Link></li>
              <li><Link href="/aml-kyc" className="hover:text-white transition-colors">{tn("amlKyc")}</Link></li>
            </ul>
          </div>

          {/* Données & Légal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{tn("donnees")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/marche" className="hover:text-white transition-colors">{tn("marche")}</Link></li>
              <li><Link href="/indices" className="hover:text-white transition-colors">{tn("indices")}</Link></li>
              <li><Link href="/pag-pap" className="hover:text-white transition-colors">{tn("pagPap")}</Link></li>
              <li><Link href="/terres-agricoles" className="hover:text-white transition-colors">{tn("terresAgricoles")}</Link></li>
            </ul>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 mt-6">{tc("legal")}</h3>
            <ul className="space-y-1.5 text-sm">
              <li><Link href="/mentions-legales" className="hover:text-white transition-colors">{tc("legalNotice")}</Link></li>
              <li><Link href="/confidentialite" className="hover:text-white transition-colors">{tc("privacy")}</Link></li>
              <li><Link href="/pricing" className="hover:text-white transition-colors">Tarifs</Link></li>
              <li><Link href="/plan-du-site" className="hover:text-white transition-colors">Plan du site</Link></li>
            </ul>
          </div>

          {/* Energy + Contact */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">
              <svg className="inline h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              Energy
            </h3>
            <ul className="space-y-1.5 text-sm mb-6">
              <li><a href="https://energy.tevaxia.lu/impact" className="hover:text-energy-light transition-colors">Impact CPE</a></li>
              <li><a href="https://energy.tevaxia.lu/renovation" className="hover:text-energy-light transition-colors">ROI Rénovation</a></li>
              <li><a href="https://energy.tevaxia.lu/communaute" className="hover:text-energy-light transition-colors">Communauté d'énergie</a></li>
              <li><a href="https://energy.tevaxia.lu/hvac" className="hover:text-energy-light transition-colors">Simulateur HVAC</a></li>
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
