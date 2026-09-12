import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import bundleAnalyzer from "@next/bundle-analyzer";
import { withSentryConfig } from "@sentry/nextjs";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");
const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  compiler: {
    // Strip console.* calls in production builds (keep error/warn for Sentry).
    removeConsole: { exclude: ["error", "warn"] },
  },
  experimental: {
    optimizePackageImports: ["@react-pdf/renderer", "posthog-js", "@sentry/nextjs", "@supabase/supabase-js", "recharts", "pdfjs-dist", "tesseract.js", "leaflet", "react-leaflet"],
    // Inlines the page's critical CSS into the HTML response, removing the
    // render-blocking CSS request (the 25 KB Tailwind chunk that PageSpeed
    // flagged at 640 ms LCP delay). Next 16 native, replaces optimizeCss
    // which silently no-op'd without critters/beasties installed.
    inlineCss: true,
  },
  async redirects() {
    const LOCALES = ["en", "de", "lb", "pt"];
    const renames: Array<{ from: string; to: string }> = [
      { from: "/hotellerie/revpar-comparison", to: "/hotellerie/compset" },
      { from: "/energy/cpe", to: "/energy/audit" },
      { from: "/energy/epbd-2050", to: "/energy/epbd" },
      { from: "/esg/crrem", to: "/esg/crrem-pathways" },
    ];
    const redirects: Array<{ source: string; destination: string; permanent: boolean }> = [];
    for (const r of renames) {
      redirects.push({ source: r.from, destination: r.to, permanent: true });
      for (const loc of LOCALES) {
        redirects.push({ source: `/${loc}${r.from}`, destination: `/${loc}${r.to}`, permanent: true });
      }
    }
    return redirects;
  },
  async headers() {
    return [
      { source: "/sw.js", headers: [{ key: "Cache-Control", value: "no-cache, no-store, must-revalidate" }] },
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https://*.tile.openstreetmap.org https://*.supabase.co",
              "connect-src 'self' https://*.supabase.co https://data.public.lu https://statistiques.public.lu https://*.google-analytics.com https://*.analytics.google.com https://*.onrender.com https://fonts.gstatic.com https://*.ingest.sentry.io https://*.ingest.de.sentry.io https://*.i.posthog.com https://*.ingest.posthog.com",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src 'self' https://vercel.live",
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },
      ...['', '/en', '/de', '/pt', '/lb'].map(locale => ({ source: `${locale}/partage/:token`, headers: [
        { key: 'Referrer-Policy', value: 'no-referrer' },
        { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
      ] })),
      { source: "/auth/callback", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

// Téléversement des source maps vers Sentry.
//
// Sans cette enveloppe, Sentry recevait bien les erreurs mais avec des piles
// entièrement minifiées : « Error: Ea at Ji » ne se diagnostique pas. Une
// alerte illisible coûte le temps de la lire et n'apprend rien.
//
// Les source maps sont produites pour le téléversement puis supprimées du
// build : elles ne sont jamais servies aux visiteurs, et le code reste
// minifié en production.
//
// Sans SENTRY_AUTH_TOKEN — le cas en local — le greffon saute simplement le
// téléversement. Une construction locale ne doit pas échouer faute d'un jeton
// qui ne la concerne pas.
export default withSentryConfig(withBundleAnalyzer(withNextIntl(nextConfig)), {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
  // Étend le téléversement aux fichiers servis depuis des sous-dossiers, sans
  // quoi une partie des piles reste minifiée.
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },
  // Retire les journaux de débogage du SDK du bundle client.
  // `disableLogger` faisait la même chose et est déprécié.
  webpack: { treeshake: { removeDebugLogging: true } },
  telemetry: false,
});
