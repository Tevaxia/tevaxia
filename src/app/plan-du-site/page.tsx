import Link from "next/link";
import { getTranslations } from "next-intl/server";

interface Section {
  titleKey: string;
  links: Array<{ href: string; key: string }>;
}

const SECTIONS: Section[] = [
  {
    titleKey: "particuliers",
    links: [
      { href: "/estimation", key: "estimation" },
      { href: "/valorisation", key: "valorisation" },
      { href: "/carte", key: "carte" },
      { href: "/frais-acquisition", key: "frais" },
      { href: "/calculateur-loyer", key: "loyer" },
      { href: "/calculateur-loyer/observatoire", key: "loyerObservatoire" },
      { href: "/simulateur-aides", key: "aides" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/achat-vs-location", key: "achatLocation" },
      { href: "/comparer", key: "comparer" },
      { href: "/vefa", key: "vefa" },
      { href: "/wizard-particulier", key: "wizardParticulier" },
      { href: "/inspection", key: "inspection" },
    ],
  },
  {
    titleKey: "investisseur",
    links: [
      { href: "/portfolio", key: "portfolio" },
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/outils-bancaires", key: "bancaire" },
      { href: "/marche", key: "marche" },
      { href: "/marche/forecast", key: "marcheForecast" },
      { href: "/indices", key: "indices" },
      { href: "/transparence", key: "transparence" },
      { href: "/bail-commercial", key: "bailCommercial" },
    ],
  },
  {
    titleKey: "evaluateurConstruction",
    links: [
      { href: "/valorisation", key: "valorisation" },
      { href: "/hedonique", key: "hedonique" },
      { href: "/verify", key: "verify" },
      { href: "/estimateur-construction", key: "estimateurConstruction" },
      { href: "/calculateur-vrd", key: "calculateurVrd" },
      { href: "/convertisseur-surfaces", key: "convertisseurSurfaces" },
      { href: "/pag-pap", key: "pagPap" },
      { href: "/terres-agricoles", key: "terresAgricoles" },
    ],
  },
  {
    titleKey: "agences",
    links: [
      { href: "/pro-agences", key: "proAgences" },
      { href: "/pro-agences/mandats", key: "mandats" },
      { href: "/pro-agences/crm", key: "crm" },
      { href: "/pro-agences/crm/contacts", key: "crmContacts" },
      { href: "/pro-agences/crm/tasks", key: "crmTasks" },
      { href: "/pro-agences/fiche-bien", key: "ficheBien" },
    ],
  },
  {
    titleKey: "syndic",
    links: [
      { href: "/syndic", key: "syndicHub" },
      { href: "/syndic/coproprietes", key: "coproprietes" },
      { href: "/syndic/procuration", key: "procuration" },
      { href: "/syndic/benchmark", key: "syndicBenchmark" },
    ],
  },
  {
    titleKey: "gestionLocative",
    links: [
      { href: "/gestion-locative", key: "gestionLocativeHub" },
      { href: "/gestion-locative/portefeuille", key: "glPortefeuille" },
      { href: "/gestion-locative/ais", key: "glAis" },
      { href: "/gestion-locative/fiscal", key: "glFiscal" },
      { href: "/gestion-locative/relances", key: "glRelances" },
      { href: "/gestion-locative/reconciliation", key: "glReconciliation" },
      { href: "/gestion-locative/reconciliation/psd2", key: "glPsd2" },
      { href: "/gestion-locative/etat-des-lieux", key: "glEdl" },
      { href: "/gestion-locative/assurance-impayes", key: "glAssurance" },
    ],
  },
  {
    titleKey: "pms",
    links: [
      { href: "/pms", key: "pmsHub" },
      { href: "/pms/proprietes/nouveau", key: "pmsNewProperty" },
    ],
  },
  {
    titleKey: "hotellerie",
    links: [
      { href: "/hotellerie", key: "hotellerieHub" },
      { href: "/hotellerie/valorisation", key: "hotelValorisation" },
      { href: "/hotellerie/dscr", key: "hotelDscr" },
      { href: "/hotellerie/exploitation", key: "hotelExploitation" },
      { href: "/hotellerie/renovation", key: "hotelRenovation" },
      { href: "/hotellerie/revpar-comparison", key: "hotelRevpar" },
      { href: "/hotellerie/score-e2", key: "hotelE2" },
      { href: "/hotellerie/forecast", key: "hotelForecast" },
      { href: "/hotellerie/compset", key: "hotelCompset" },
      { href: "/hotellerie/observatoire-lu", key: "hotelObservatoire" },
      { href: "/hotellerie/certifications-esg", key: "hotelEsg" },
      { href: "/hotellerie/motel", key: "hotelMotel" },
      { href: "/hotellerie/alerts", key: "hotelAlerts" },
      { href: "/hotellerie/due-diligence", key: "hotelDd" },
      { href: "/hotellerie/mice", key: "hotelMice" },
      { href: "/hotellerie/housekeeping", key: "hotelHousekeeping" },
      { href: "/hotellerie/impayes", key: "hotelImpayes" },
      { href: "/hotellerie/benchmark", key: "hotelBenchmark" },
      { href: "/hotellerie/capex", key: "hotelCapex" },
      { href: "/hotellerie/transactions", key: "hotelTransactions" },
      { href: "/hotellerie/groupe", key: "hotelGroupe" },
    ],
  },
  {
    titleKey: "str",
    links: [
      { href: "/str", key: "strHub" },
      { href: "/str/rentabilite", key: "strRenta" },
      { href: "/str/forecast", key: "strForecast" },
      { href: "/str/pricing", key: "strPricing" },
      { href: "/str/arbitrage", key: "strArbitrage" },
      { href: "/str/portefeuille", key: "strPortefeuille" },
      { href: "/str/compliance", key: "strCompliance" },
      { href: "/str/compliance-eu", key: "strComplianceEu" },
      { href: "/str/observatoire", key: "strObservatoire" },
    ],
  },
  {
    titleKey: "energy",
    links: [
      { href: "/energy", key: "energyHome" },
      { href: "/energy/impact", key: "energyImpact" },
      { href: "/energy/renovation", key: "energyRenovation" },
      { href: "/energy/communaute", key: "energyCommunaute" },
      { href: "/energy/epbd", key: "energyEpbd" },
      { href: "/energy/estimateur-cpe", key: "energyCpe" },
      { href: "/energy/lenoz", key: "energyLenoz" },
      { href: "/energy/hvac", key: "energyHvac" },
      { href: "/energy/audit", key: "energyAudit" },
      { href: "/energy/portfolio", key: "energyPortfolio" },
    ],
  },
  {
    titleKey: "conformite",
    links: [
      { href: "/aml-kyc", key: "amlKyc" },
      { href: "/aml-kyc/archives", key: "amlKycArchives" },
    ],
  },
  {
    titleKey: "compte",
    links: [
      { href: "/connexion", key: "connexion" },
      { href: "/profil", key: "profil" },
      { href: "/tableau-bord", key: "tableauBord" },
      { href: "/mes-evaluations", key: "mesEvaluations" },
      { href: "/profil/organisation", key: "organisation" },
      { href: "/profil/api", key: "apiKeys" },
      { href: "/profil/liens-partages", key: "liensPartages" },
      { href: "/profil/confidentialite", key: "consentements" },
      { href: "/pricing", key: "tarifs" },
    ],
  },
  {
    titleKey: "api",
    links: [
      { href: "/api-docs", key: "apiDocs" },
      { href: "/api-banques", key: "apiBanques" },
    ],
  },
  {
    titleKey: "guides",
    links: [
      { href: "/docs", key: "docsHub" },
      { href: "/docs/particulier", key: "docsParticulier" },
      { href: "/docs/expert-evaluateur", key: "docsExpert" },
      { href: "/docs/syndic", key: "docsSyndic" },
      { href: "/docs/hotellier", key: "docsHotellier" },
      { href: "/docs/investisseur", key: "docsInvestisseur" },
      { href: "/docs/agence", key: "docsAgence" },
      { href: "/docs/promoteur", key: "docsPromoteur" },
      { href: "/docs/integrateur-api", key: "docsApi" },
      { href: "/docs/location-courte-duree", key: "docsStr" },
      { href: "/guide", key: "guideHub" },
      { href: "/guide/ia-tevaxia", key: "guideIa" },
      { href: "/guide/estimation-bien-immobilier", key: "guideEstimation" },
      { href: "/guide/frais-notaire-luxembourg", key: "guideFrais" },
      { href: "/guide/bellegen-akt", key: "guideBellegen" },
      { href: "/guide/klimabonus", key: "guideKlimabonus" },
      { href: "/guide/plus-value-immobiliere", key: "guidePv" },
      { href: "/guide/bail-habitation-luxembourg", key: "guideBail" },
      { href: "/guide/bail-commercial-luxembourg", key: "guideBailCo" },
      { href: "/guide/regle-5-pourcent-loyer", key: "guideRegle5" },
      { href: "/guide/tva-3-pourcent-logement", key: "guideTva3" },
      { href: "/guide/copropriete-luxembourg", key: "guideCopro" },
      { href: "/guide/achat-immobilier-non-resident", key: "guideNonResident" },
      { href: "/guide/investir-hotel-luxembourg", key: "guideHotel" },
    ],
  },
  {
    titleKey: "wordpress",
    links: [
      { href: "/propcalc", key: "propcalc" },
      { href: "/propcalc/developers", key: "propcalcDev" },
    ],
  },
  {
    titleKey: "legal",
    links: [
      { href: "/mentions-legales", key: "mentionsLegales" },
      { href: "/confidentialite", key: "confidentialite" },
      { href: "/status", key: "status" },
    ],
  },
];

export default async function PlanDuSite() {
  const t = await getTranslations("planDuSite");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h1 className="text-2xl font-bold text-navy mb-2">{t("title")}</h1>
        <p className="text-muted mb-10">{t("subtitle")}</p>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {SECTIONS.map((section) => (
            <div key={section.titleKey}>
              <h2 className="text-sm font-semibold uppercase tracking-wider text-navy/50 mb-3">
                {t(`sections.${section.titleKey}`)}
              </h2>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate hover:text-navy transition-colors"
                    >
                      {t(`links.${link.key}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-xl border border-card-border bg-card p-6">
          <p className="text-xs text-muted">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}
