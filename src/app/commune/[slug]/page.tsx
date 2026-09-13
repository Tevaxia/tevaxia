import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import { buildLocaleUrl, localizedAlternates, type Locale } from "@/lib/seo";
import { SEO_BRANDING } from "@/lib/seo-branding";
import { getAllCommunes, getCommuneBySlug, slugifyCommune } from "@/lib/market-data";
import { COMMUNE_COORDS } from "@/lib/communes-coords";
import CommunePageClient from "./CommunePageClient";

const BASE = "https://tevaxia.lu";
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

  const locale = await getLocale() as Locale;
  const name = commune.commune;
  const canton = commune.canton;
  const copy = {
    fr: { title: `Immobilier ${name} — Prix m², tendances, estimation`, description: `Marché immobilier à ${name} (canton ${canton}, Luxembourg) : données de prix publiées, tendances, loyers et outils d’estimation.` },
    en: { title: `Property in ${name} — Prices per m² and valuation`, description: `Property market in ${name} (canton of ${canton}, Luxembourg): published price data, trends, rents and valuation tools.` },
    de: { title: `Immobilien in ${name} — Quadratmeterpreise und Bewertung`, description: `Immobilienmarkt in ${name} (Kanton ${canton}, Luxemburg): veröffentlichte Preisdaten, Entwicklungen, Mieten und Bewertungsrechner.` },
    pt: { title: `Imóveis em ${name} — Preços por m² e avaliação`, description: `Mercado imobiliário em ${name} (cantão de ${canton}, Luxemburgo): dados de preços publicados, tendências, rendas e ferramentas de avaliação.` },
    lb: { title: `Immobilien zu ${name} — Quadratmeterpräisser a Bewäertung`, description: `Immobiliemaart zu ${name} (Kanton ${canton}, Lëtzebuerg): publizéiert Präisdonnéeën, Entwécklungen, Loyeren a Bewäertungsrechner.` },
  }[locale];
  const pagePath = `/commune/${slugifyCommune(name)}`;
  const canonical = buildLocaleUrl(pagePath, locale);
  return {
    ...copy,
    alternates: localizedAlternates(pagePath, locale),
    openGraph: { ...copy, url: canonical, siteName: "tevaxia.lu", locale: SEO_BRANDING[locale].ogLocale, type: "website", images: ["https://tevaxia.lu/og-image.png"] },
    twitter: { ...copy, card: "summary_large_image", images: ["https://tevaxia.lu/og-image.png"] },
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
    description: `Marché immobilier à ${commune.commune}, canton ${commune.canton}, Luxembourg. Prix moyen : ${commune.prixM2Existant ? commune.prixM2Existant.toLocaleString("fr-FR") + " EUR/m2" : "N/A"}.`,
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
