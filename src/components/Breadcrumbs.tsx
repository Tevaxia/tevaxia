"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LABELS: Record<string, string> = {
  estimation: "Estimation",
  "frais-acquisition": "Frais d'acquisition",
  "calculateur-loyer": "Capital investi & Loyer",
  "plus-values": "Plus-values",
  valorisation: "Valorisation",
  "dcf-multi": "DCF multi-locataires",
  carte: "Carte des prix",
  "simulateur-aides": "Simulateur d'aides",
  "achat-vs-location": "Acheter ou Louer",
  "bilan-promoteur": "Bilan Promoteur",
  "outils-bancaires": "Outils Bancaires",
  marche: "Base de données marché",
  "pag-pap": "PAG / PAP",
  hedonique: "Modèle hédonique",
  portfolio: "Portfolio",
  vefa: "VEFA",
  "terres-agricoles": "Terres agricoles",
  "aml-kyc": "AML / KYC",
  "estimateur-construction": "Coût de construction",
  "calculateur-vrd": "Estimateur VRD",
  hvac: "Simulateur HVAC",
  "convertisseur-surfaces": "Convertisseur de surfaces",
  comparer: "Comparer deux biens",
  pricing: "Tarifs",
  "plan-du-site": "Plan du site",
  en: "English",
  particuliers: "Particuliers",
  professionnels: "Professionnels",
};

function labelFor(segment: string): string {
  return LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, " ");
}

export default function Breadcrumbs() {
  const pathname = usePathname();
  if (!pathname || pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);
  if (segments.length === 0) return null;

  const crumbs = segments.map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Accueil",
        "item": "https://tevaxia.lu",
      },
      ...crumbs.map((c, i) => ({
        "@type": "ListItem",
        "position": i + 2,
        "name": c.label,
        "item": `https://tevaxia.lu${c.href}`,
      })),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <nav aria-label="Fil d'Ariane" className="mb-4 text-xs text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="hover:text-navy transition-colors">Accueil</Link>
          </li>
          {crumbs.map((crumb, i) => (
            <li key={crumb.href} className="flex items-center gap-1">
              <span className="text-muted/50" aria-hidden="true">&gt;</span>
              {i === crumbs.length - 1 ? (
                <span className="font-medium text-slate" aria-current="page">{crumb.label}</span>
              ) : (
                <Link href={crumb.href} className="hover:text-navy transition-colors">{crumb.label}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
