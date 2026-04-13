import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const LOCALES = ["", "/en", "/de", "/pt", "/lb"];

  // Pages privées (compte utilisateur) — bloquer dans toutes les langues
  const privatePages = ["/mes-evaluations", "/profil", "/connexion"];
  const disallow = [
    "/api/",
    "/_next/",
    ...LOCALES.flatMap((loc) => privatePages.map((p) => `${loc}${p}`)),
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
      {
        // Googlebot — crawl budget optimization
        userAgent: "Googlebot",
        allow: "/",
        disallow,
      },
    ],
    sitemap: "https://tevaxia.lu/sitemap.xml",
    host: "https://tevaxia.lu",
  };
}
