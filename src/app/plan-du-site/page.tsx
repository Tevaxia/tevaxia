import Link from "next/link";
import { getTranslations } from "next-intl/server";

const SECTIONS = [
  {
    titleKey: "particuliers",
    links: [
      { href: "/estimation", key: "estimation" },
      { href: "/carte", key: "carte" },
      { href: "/frais-acquisition", key: "frais" },
      { href: "/calculateur-loyer", key: "loyer" },
      { href: "/simulateur-aides", key: "aides" },
      { href: "/plus-values", key: "plusValues" },
      { href: "/achat-vs-location", key: "achatLocation" },
      { href: "/comparer", key: "comparer" },
      { href: "/vefa", key: "vefa" },
    ],
  },
  {
    titleKey: "professionnels",
    links: [
      { href: "/valorisation", key: "valorisation" },
      { href: "/hedonique", key: "hedonique" },
      { href: "/dcf-multi", key: "dcfMulti" },
      { href: "/outils-bancaires", key: "bancaire" },
      { href: "/bilan-promoteur", key: "bilanPromoteur" },
      { href: "/estimateur-construction", key: "estimateurConstruction" },
      { href: "/calculateur-vrd", key: "calculateurVrd" },
      { href: "/convertisseur-surfaces", key: "convertisseurSurfaces" },
      { href: "/portfolio", key: "portfolio" },
      { href: "/aml-kyc", key: "amlKyc" },
    ],
  },
  {
    titleKey: "donnees",
    links: [
      { href: "/marche", key: "marche" },
      { href: "/indices", key: "indices" },
      { href: "/pag-pap", key: "pagPap" },
      { href: "/terres-agricoles", key: "terresAgricoles" },
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
      { href: "/energy/portfolio", key: "energyPortfolio" },
    ],
  },
  {
    titleKey: "compte",
    links: [
      { href: "/connexion", key: "connexion" },
      { href: "/profil", key: "profil" },
      { href: "/mes-evaluations", key: "mesEvaluations" },
      { href: "/pricing", key: "tarifs" },
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
    ],
  },
];

export default async function PlanDuSite() {
  const t = await getTranslations("planDuSite");

  return (
    <div className="bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
