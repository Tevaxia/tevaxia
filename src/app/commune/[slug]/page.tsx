import type { Metadata } from "next";
import { getAllCommunes, getCommuneBySlug, slugifyCommune } from "@/lib/market-data";
import { COMMUNE_COORDS } from "@/lib/communes-coords";
import CommunePageClient from "./CommunePageClient";

const BASE = "https://tevaxia.lu";
const LOCALES = ["fr", "en", "de", "pt", "lb"] as const;

function buildLocaleUrl(page: string, locale: string): string {
  if (locale === "fr") return `${BASE}${page}`;
  return `${BASE}/${locale}${page}`;
}

/* ------------------------------------------------------------------ */
/*  generateStaticParams — pre-render all known commune pages         */
/* ------------------------------------------------------------------ */
export function generateStaticParams() {
  return getAllCommunes().map((c) => ({ slug: slugifyCommune(c) }));
}

/* ------------------------------------------------------------------ */
/*  generateMetadata — dynamic SEO metadata per commune               */
/* ------------------------------------------------------------------ */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const commune = getCommuneBySlug(slug);

  if (!commune) {
    return {
      title: "Commune non trouvée",
      description: "Cette commune n'a pas été trouvée dans notre base de données immobilières au Luxembourg.",
    };
  }

  const normSlug = slugifyCommune(commune.commune);

  const prixStr = commune.prixM2Existant
    ? `${commune.prixM2Existant.toLocaleString("fr-LU")} EUR/m2`
    : "";

  const title = `Immobilier ${commune.commune} — Prix m², tendances, estimation`;

  const description = prixStr
    ? `Prix immobilier à ${commune.commune} (canton ${commune.canton}) : ${prixStr} en moyenne (${commune.periode}). Tendances, loyers, rendement et outils d'estimation sur tevaxia.lu.`
    : `Marché immobilier à ${commune.commune} (canton ${commune.canton}). Tendances, loyers, rendement et outils d'estimation sur tevaxia.lu.`;

  const pagePath = `/commune/${normSlug}`;
  const canonical = `${BASE}${pagePath}`;

  const languages: Record<string, string> = {};
  for (const loc of LOCALES) languages[loc] = buildLocaleUrl(pagePath, loc);
  languages["x-default"] = canonical;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "tevaxia.lu",
      locale: "fr_LU",
      type: "website",
      images: [
        {
          url: "https://tevaxia.lu/og-image.png",
          width: 1200,
          height: 630,
          alt: `Immobilier ${commune.commune} — tevaxia.lu`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `Immobilier ${commune.commune}`,
      description,
      images: ["https://tevaxia.lu/og-image.png"],
    },
  };
}

/* ------------------------------------------------------------------ */
/*  JSON-LD structured data                                           */
/* ------------------------------------------------------------------ */
function buildJsonLd(slug: string) {
  const commune = getCommuneBySlug(slug);
  if (!commune) return null;

  const coords = COMMUNE_COORDS[commune.commune];
  const canonical = `${BASE}/commune/${slugifyCommune(commune.commune)}`;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Place",
    name: commune.commune,
    description: `Marché immobilier à ${commune.commune}, canton ${commune.canton}, Luxembourg. Prix moyen : ${commune.prixM2Existant ? commune.prixM2Existant.toLocaleString("fr-LU") + " EUR/m2" : "N/A"}.`,
    url: canonical,
    address: {
      "@type": "PostalAddress",
      addressLocality: commune.commune,
      addressRegion: `Canton ${commune.canton}`,
      addressCountry: "LU",
    },
  };

  if (coords) {
    jsonLd.geo = {
      "@type": "GeoCoordinates",
      latitude: coords[0],
      longitude: coords[1],
    };
  }

  // Add RealEstateAgent / Offer-style additional data for rich results
  jsonLd.additionalProperty = [
    ...(commune.prixM2Existant
      ? [{
          "@type": "PropertyValue",
          name: "Prix moyen m2 (existant)",
          value: `${commune.prixM2Existant} EUR`,
          unitCode: "MTK",
        }]
      : []),
    ...(commune.prixM2VEFA
      ? [{
          "@type": "PropertyValue",
          name: "Prix moyen m2 (VEFA/neuf)",
          value: `${commune.prixM2VEFA} EUR`,
          unitCode: "MTK",
        }]
      : []),
    ...(commune.loyerM2Annonces
      ? [{
          "@type": "PropertyValue",
          name: "Loyer moyen m2/mois",
          value: `${commune.loyerM2Annonces} EUR`,
        }]
      : []),
  ];

  return jsonLd;
}

/* ------------------------------------------------------------------ */
/*  BreadcrumbList JSON-LD                                            */
/* ------------------------------------------------------------------ */
function buildBreadcrumbJsonLd(slug: string, communeName: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: BASE,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Carte des prix",
        item: `${BASE}/carte`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: communeName,
        item: `${BASE}/commune/${slugifyCommune(slug)}`,
      },
    ],
  };
}

/* ------------------------------------------------------------------ */
/*  Page component (server)                                           */
/* ------------------------------------------------------------------ */
export default async function CommunePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const commune = getCommuneBySlug(slug);
  const communeName = commune?.commune ?? slug;
  const jsonLd = buildJsonLd(slug);
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(slug, communeName);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <CommunePageClient />
    </>
  );
}
