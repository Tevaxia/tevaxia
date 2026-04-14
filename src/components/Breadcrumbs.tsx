"use client";

import LocaleLink from "./LocaleLink";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";

const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];

/**
 * Locale-aware Breadcrumbs with JSON-LD structured data.
 * - Strips locale prefix from breadcrumb segments
 * - Uses translation keys for labels (nav.* namespace)
 * - Links use LocaleLink (locale-aware)
 * - "Accueil" / "Home" / "Startseite" etc. from translations
 */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tc = useTranslations("common");

  if (!pathname || pathname === "/") return null;

  const allSegments = pathname.split("/").filter(Boolean);
  if (allSegments.length === 0) return null;

  // Detect and strip locale prefix
  let localePrefix = "";
  let segments = allSegments;
  if (LOCALE_PREFIXES.includes(allSegments[0])) {
    localePrefix = `/${allSegments[0]}`;
    segments = allSegments.slice(1);
  }

  if (segments.length === 0) return null;

  // Map segments to label keys (nav.* translations)
  const SEGMENT_TO_KEY: Record<string, string> = {
    estimation: "estimation",
    "frais-acquisition": "frais",
    "calculateur-loyer": "loyer",
    "plus-values": "plusValues",
    valorisation: "valorisation",
    "dcf-multi": "dcfMulti",
    carte: "carte",
    "simulateur-aides": "aides",
    "achat-vs-location": "achatLocation",
    "bilan-promoteur": "bilanPromoteur",
    "outils-bancaires": "bancaire",
    marche: "marche",
    "pag-pap": "pagPap",
    hedonique: "hedonique",
    portfolio: "portfolio",
    vefa: "vefa",
    "terres-agricoles": "terresAgricoles",
    "aml-kyc": "amlKyc",
    "estimateur-construction": "estimateurConstruction",
    "calculateur-vrd": "calculateurVrd",
    "convertisseur-surfaces": "convertisseurSurfaces",
    comparer: "comparer",
    pricing: "tarifs",
    "plan-du-site": "planDuSite",
    syndic: "syndic",
    indices: "indices",
    energy: "energy",
    impact: "energyImpact",
    renovation: "energyRenovation",
    communaute: "energyCommunaute",
    epbd: "energyEpbd",
    "estimateur-cpe": "energyCpe",
    lenoz: "energyLenoz",
    hvac: "hvac",
    propcalc: "propcalc",
    connexion: "connexion",
    profil: "profil",
  };

  function labelFor(segment: string): string {
    const key = SEGMENT_TO_KEY[segment];
    if (key) {
      try { return t(key); } catch { /* fallback below */ }
    }
    return segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
  }

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const homeLabel = tc("home");
  const homeUrl = `https://tevaxia.lu${localePrefix || ""}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: homeLabel,
        item: homeUrl,
      },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        position: i + 2,
        name: c.label,
        item: `https://tevaxia.lu${localePrefix}${c.href}`,
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label={homeLabel} className="mb-4 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <LocaleLink href="/" className="hover:text-navy transition-colors">{homeLabel}</LocaleLink>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1">
              <span className="text-muted/50" aria-hidden="true">&gt;</span>
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-slate" aria-current="page">{crumb.label}</span>
              ) : (
                <LocaleLink href={crumb.href} className="hover:text-navy transition-colors">{crumb.label}</LocaleLink>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
