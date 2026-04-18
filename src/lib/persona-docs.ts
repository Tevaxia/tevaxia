import type { ProfileType } from "./profile-types";

export interface PersonaGuide {
  /** Clé i18n utilisée comme `personaDocs.{value}.*` */
  value: ProfileType;
  /** slug URL (ex. "particulier", "expert-evaluateur") */
  slug: string;
  /** tools recommandés : href + clé i18n pour titre + description */
  tools: Array<{ href: string; key: string }>;
  /** autres pages utiles */
  related: Array<{ href: string; key: string }>;
  /** nombre de questions FAQ spécifiques à cette persona */
  faqCount: number;
}

export const PERSONA_GUIDES: PersonaGuide[] = [
  {
    value: "particulier",
    slug: "particulier",
    tools: [
      { href: "/estimation", key: "estimation" },
      { href: "/frais-acquisition", key: "fraisAcquisition" },
      { href: "/simulateur-aides", key: "simulateurAides" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/achat-vs-location", key: "achatLocation" },
      { href: "/wizard-particulier", key: "wizardParticulier" },
    ],
    related: [
      { href: "/guide", key: "guide" },
      { href: "/carte", key: "carte" },
    ],
    faqCount: 4,
  },
  {
    value: "expert",
    slug: "expert-evaluateur",
    tools: [
      { href: "/valorisation", key: "valorisation" },
      { href: "/hedonique", key: "hedonique" },
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/verify", key: "verify" },
      { href: "/indices", key: "indices" },
      { href: "/profil/organisation", key: "organisation" },
    ],
    related: [
      { href: "/transparence", key: "transparence" },
      { href: "/api-docs", key: "apiDocs" },
    ],
    faqCount: 4,
  },
  {
    value: "syndic",
    slug: "syndic",
    tools: [
      { href: "/syndic", key: "syndicHub" },
      { href: "/syndic/coproprietes", key: "coproprietes" },
      { href: "/syndic/procuration", key: "procuration" },
      { href: "/syndic/benchmark", key: "syndicBenchmark" },
    ],
    related: [
      { href: "/energy/portfolio", key: "energyPortfolio" },
      { href: "/aml-kyc/archives", key: "amlKyc" },
    ],
    faqCount: 4,
  },
  {
    value: "hotelier",
    slug: "hotellier",
    tools: [
      { href: "/pms", key: "pms" },
      { href: "/hotellerie", key: "hotellerieHub" },
      { href: "/hotellerie/groupe", key: "hotellerieGroupe" },
      { href: "/hotellerie/exploitation", key: "exploitation" },
      { href: "/hotellerie/capex", key: "hotelCapex" },
      { href: "/hotellerie/housekeeping", key: "housekeeping" },
    ],
    related: [
      { href: "/hotellerie/observatoire-lu", key: "observatoireLu" },
      { href: "/hotellerie/benchmark", key: "benchmark" },
    ],
    faqCount: 5,
  },
  {
    value: "investisseur",
    slug: "investisseur",
    tools: [
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/portfolio", key: "portfolio" },
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/outils-bancaires", key: "outilsBancaires" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/marche/forecast", key: "marcheForecast" },
    ],
    related: [
      { href: "/indices", key: "indices" },
      { href: "/energy/portfolio", key: "energyPortfolio" },
    ],
    faqCount: 4,
  },
  {
    value: "agence",
    slug: "agence",
    tools: [
      { href: "/pro-agences", key: "proAgences" },
      { href: "/pro-agences/mandats", key: "mandats" },
      { href: "/pro-agences/crm", key: "crm" },
      { href: "/pro-agences/fiche-bien", key: "ficheBien" },
      { href: "/valorisation", key: "valorisation" },
      { href: "/profil/organisation", key: "organisation" },
    ],
    related: [
      { href: "/profil/liens-partages", key: "liensPartages" },
      { href: "/aml-kyc", key: "amlKyc" },
    ],
    faqCount: 4,
  },
  {
    value: "promoteur",
    slug: "promoteur",
    tools: [
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/vefa", key: "vefa" },
      { href: "/estimateur-construction", key: "estimateurConstruction" },
      { href: "/calculateur-vrd", key: "calculateurVrd" },
      { href: "/pag-pap", key: "pagPap" },
      { href: "/convertisseur-surfaces", key: "convertisseurSurfaces" },
    ],
    related: [
      { href: "/simulateur-aides", key: "simulateurAides" },
      { href: "/dcf-multi", key: "dcfMulti" },
    ],
    faqCount: 4,
  },
  {
    value: "api",
    slug: "integrateur-api",
    tools: [
      { href: "/api-docs", key: "apiDocs" },
      { href: "/profil/api", key: "apiKeys" },
      { href: "/api-banques", key: "apiBanques" },
      { href: "/transparence", key: "transparence" },
    ],
    related: [
      { href: "/verify", key: "verify" },
      { href: "/hedonique", key: "hedonique" },
    ],
    faqCount: 4,
  },
  {
    value: "str_operator",
    slug: "location-courte-duree",
    tools: [
      { href: "/str", key: "strHub" },
      { href: "/str/forecast", key: "strForecast" },
      { href: "/str/portefeuille", key: "strPortefeuille" },
      { href: "/simulateur-aides", key: "simulateurAides" },
    ],
    related: [
      { href: "/hotellerie/observatoire-lu", key: "observatoireLu" },
      { href: "/gestion-locative/ais", key: "ais" },
    ],
    faqCount: 4,
  },
];

export function getPersonaBySlug(slug: string): PersonaGuide | null {
  return PERSONA_GUIDES.find((p) => p.slug === slug) ?? null;
}
