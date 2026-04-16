import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@react-pdf/renderer", "posthog-js", "@sentry/nextjs", "@supabase/supabase-js"],
    optimizeCss: true,
  },
  async redirects() {
    return [];
  },
  async headers() {
    return [
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
    ];
  },
};

export default withNextIntl(nextConfig);
