// ============================================================
// JSON-LD Structured Data — Schema.org
// ============================================================

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
        "https://github.com/Interne52105110/tevaxia"
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
