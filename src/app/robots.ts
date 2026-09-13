import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    // Allow rendering resources and let crawlers read account pages' noindex.
    // Authentication and database policies remain responsible for data access.
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: "https://tevaxia.lu/sitemap.xml",
    host: "https://tevaxia.lu",
  };
}
