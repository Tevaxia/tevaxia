"use client";

import LocaleLink from "./LocaleLink";
import { useTranslations } from "next-intl";

const TOOL_KEYS: Record<string, string> = {
  estimation: "/estimation",
  frais: "/frais-acquisition",
  loyer: "/calculateur-loyer",
  aides: "/simulateur-aides",
  plusValues: "/plus-values",
  achatLocation: "/achat-vs-location",
  valorisation: "/valorisation",
  vefa: "/vefa",
  bancaire: "/outils-bancaires",
  carte: "/carte",
  bilanPromoteur: "/bilan-promoteur",
  estimateurConstruction: "/estimateur-construction",
  calculateurVrd: "/calculateur-vrd",
  convertisseurSurfaces: "/convertisseur-surfaces",
  dcfMulti: "/dcf-multi",
  portfolio: "/portfolio",
  hedonique: "/hedonique",
  facturation: "/facturation",
  strHub: "/str",
  amlKyc: "/aml-kyc",
  pagPap: "/pag-pap",
  comparer: "/comparer",
  indices: "/indices",
  marche: "/marche",
  terresAgricoles: "/terres-agricoles",
  hvac: "/energy/hvac",
  energyImpact: "/energy/impact",
  energyRenovation: "/energy/renovation",
  energyCommunaute: "/energy/communaute",
  energyEpbd: "/energy/epbd-2050",
  energyCpe: "/energy/estimateur-cpe",
  energyLenoz: "/energy/lenoz",
  esgCrrem: "/esg/crrem",
  esgTaxonomy: "/esg/taxonomy",
  esgHub: "/esg",
  syndic: "/syndic",
  hotelHub: "/hotellerie",
  pms: "/pms",
  hotelValorisation: "/hotellerie/valorisation",
  hotelDscr: "/hotellerie/dscr",
  hotelExploitation: "/hotellerie/exploitation",
  hotelRenovation: "/hotellerie/renovation",
  hotelRevpar: "/hotellerie/revpar-comparison",
  hotelE2: "/hotellerie/score-e2",
};

export default function RelatedTools({ keys }: { keys: string[] }) {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const tools = keys.filter((k) => TOOL_KEYS[k]);
  if (tools.length === 0) return null;

  return (
    <section className="mt-10 border-t border-card-border pt-8">
      <h2 className="text-lg font-semibold text-navy">{tc("relatedToolsTitle")}</h2>
      <p className="mt-1 text-sm text-muted">{tc("relatedToolsSubtitle")}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tools.map((key) => (
          <LocaleLink
            key={key}
            href={TOOL_KEYS[key]}
            className="group rounded-xl border border-card-border bg-card p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
          >
            <div className="text-sm font-semibold text-navy group-hover:text-gold transition-colors">
              {t(key)}
            </div>
          </LocaleLink>
        ))}
      </div>
    </section>
  );
}
