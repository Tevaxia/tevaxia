// ============================================================
// JSON-LD Structured Data — Schema.org
// ============================================================

/** Erwan Bargain Person schema — reusable reference */
const PERSON_ERWAN = {
  "@type": "Person" as const,
  "name": "Erwan Bargain",
  "jobTitle": "Expert en évaluation immobilière",
  "hasCredential": "REV TEGOVA (Recognised European Valuer)",
  "url": "https://bargain-expertise.fr",
  "sameAs": [
    "https://www.linkedin.com/in/erwanbargain",
    "https://tevaxia.lu"
  ],
};

/**
 * Person — Erwan Bargain, fondateur et expert REV TEGOVA
 * Placé dans le root layout pour E-E-A-T.
 */
export function PersonJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      ...PERSON_ERWAN,
    })}} />
  );
}

/**
 * Organization — identité de tevaxia pour Google Knowledge Panel
 * Placé dans le root layout, rendu sur chaque page.
 */
export function OrganizationJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Tevaxia",
      "legalName": "Tevaxia",
      "url": "https://tevaxia.lu",
      "logo": "https://tevaxia.lu/logo-tevaxia-512.svg",
      "description": "Plateforme d'outils immobiliers pour le Luxembourg. Valorisation, simulation énergétique, données de marché, calculateurs.",
      "foundingDate": "2025",
      "founder": {
        "@type": "Person",
        "name": "Erwan Bargain",
        "url": "https://bargain-expertise.fr",
      },
      "areaServed": {
        "@type": "Country",
        "name": "Luxembourg",
        "sameAs": "https://en.wikipedia.org/wiki/Luxembourg"
      },
      "knowsAbout": [
        "Real estate valuation",
        "Property investment",
        "Energy performance certificates",
        "Luxembourg housing market",
        "TEGOVA EVS 2025",
        "EPBD directive"
      ],
      "sameAs": [
        "https://github.com/Tevaxia",
        "https://www.linkedin.com/company/tevaxia"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "email": "contact@tevaxia.lu",
        "contactType": "customer service",
        "availableLanguage": ["French", "English", "German", "Portuguese", "Luxembourgish"]
      }
    })}} />
  );
}

/**
 * WebSite — pour activer le Sitelinks Search Box dans Google
 */
export function WebSiteJsonLd() {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Tevaxia",
      "alternateName": "tevaxia.lu",
      "url": "https://tevaxia.lu",
      "inLanguage": ["fr", "en", "de", "pt", "lb"],
      "publisher": {
        "@type": "Organization",
        "name": "Tevaxia",
        "url": "https://tevaxia.lu"
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": "https://tevaxia.lu/carte?q={search_term_string}"
        },
        "query-input": "required name=search_term_string"
      }
    })}} />
  );
}

/**
 * SoftwareApplication — pour chaque outil (résultats enrichis)
 */
export function SoftwareApplicationJsonLd({ name, description, url }: { name: string; description: string; url: string }) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": name,
      "description": description,
      "url": url,
      "applicationCategory": "FinanceApplication",
      "operatingSystem": "Web",
      "author": {
        "@type": "Organization",
        "name": "Tevaxia",
        "url": "https://tevaxia.lu"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "EUR"
      },
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.8",
        "ratingCount": "1",
        "bestRating": "5"
      }
    })}} />
  );
}

/**
 * Article — pour les pages guide (E-E-A-T : auteur + publisher)
 */
export function ArticleJsonLd({ headline, datePublished, dateModified }: {
  headline: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": headline,
      "author": {
        "@type": "Person",
        "name": "Erwan Bargain",
        "url": "https://bargain-expertise.fr",
      },
      "publisher": {
        "@type": "Organization",
        "name": "tevaxia.lu",
        "url": "https://tevaxia.lu",
      },
      "datePublished": datePublished ?? "2026-04-16",
      "dateModified": dateModified ?? "2026-04-16",
    })}} />
  );
}
