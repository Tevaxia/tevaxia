import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/mes-evaluations", "/profil", "/en/mes-evaluations", "/en/profil"],
    },
    sitemap: "https://tevaxia.lu/sitemap.xml",
  };
}
