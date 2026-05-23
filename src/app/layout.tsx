import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { headers } from "next/headers";
import { pickNamespaces } from "@/i18n/pick-namespaces";
import FullMessagesProvider from "@/components/FullMessagesProvider";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AuthProvider from "@/components/AuthProvider";
import PostHogProvider from "@/components/PostHogProvider";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";
import { OrganizationJsonLd, WebSiteJsonLd, PersonJsonLd } from "@/components/JsonLd";
import DeferredWidgets from "@/components/DeferredWidgets";
import DeferredContextBars from "@/components/DeferredContextBars";
import GtagLoader from "@/components/GtagLoader";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

const BASE = "https://tevaxia.lu";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const url = h.get("x-url") || "/";
  const LOCALE_PREFIXES = ["en", "de", "pt", "lb"];
  const detectedLocale = LOCALE_PREFIXES.find((l) => url === `/${l}` || url.startsWith(`/${l}/`));
  const pathWithoutLocale = detectedLocale ? url.replace(new RegExp(`^/${detectedLocale}`), "") || "/" : url;
  const buildUrl = (loc: string) => loc === "fr" ? `${BASE}${pathWithoutLocale}` : `${BASE}/${loc}${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  const canonical = buildUrl(detectedLocale || "fr");

  return {
    title: {
      default: "tevaxia.lu — Outils Immobiliers Luxembourg",
      template: "%s",
    },
    description:
      "Plateforme de référence pour l'immobilier au Luxembourg. Calculateurs de loyer, frais d'acquisition, plus-values, aides étatiques, outils bancaires.",
    authors: [{ name: "Tevaxia", url: "https://tevaxia.lu" }],
    creator: "Tevaxia",
    publisher: "Tevaxia",
    alternates: {
      canonical,
      languages: {
        fr: buildUrl("fr"),
        en: buildUrl("en"),
        de: buildUrl("de"),
        pt: buildUrl("pt"),
        lb: buildUrl("lb"),
        "x-default": buildUrl("fr"),
      },
    },
    openGraph: {
      title: "tevaxia.lu — Outils Immobiliers Luxembourg",
      description: "Outils de calcul immobilier pour le Luxembourg. Estimation, frais, plus-values, aides, valorisation EVS 2025, DCF, MLV/CRR.",
      url: canonical,
      siteName: "tevaxia.lu",
      locale: detectedLocale === "en" ? "en_GB" : detectedLocale === "de" ? "de_LU" : detectedLocale === "pt" ? "pt_PT" : "fr_LU",
      type: "website",
      images: [{
        url: "https://tevaxia.lu/og-image.png",
        width: 1200,
        height: 630,
        alt: "tevaxia.lu — Outils immobiliers Luxembourg",
      }],
    },
    twitter: {
      card: "summary_large_image",
      title: "tevaxia.lu — Outils Immobiliers Luxembourg",
      description: "Outils de calcul immobilier pour le Luxembourg.",
      images: ["https://tevaxia.lu/og-image.png"],
    },
    manifest: "/manifest.json",
    themeColor: "#0f172a",
    appleWebApp: {
      capable: true,
      title: "Tevaxia",
      statusBarStyle: "black-translucent",
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [allMessages, locale, h] = await Promise.all([
    getMessages(),
    getLocale(),
    headers(),
  ]);

  // Server side we inline ONLY this route's namespaces (~10–80 KB) so the first
  // paint is correct + light. But the root layout does NOT re-render on
  // client-side navigation, so this provider would stay frozen on the landing
  // page's namespace set and every page reached by a link click would render
  // raw keys (vefa.title, …). FullMessagesProvider (below) fixes that: after
  // hydration it loads the complete locale bundle once (a cached JS chunk, not
  // re-inlined per page) and re-provides it, so in-app navigation always has
  // the namespaces it needs.
  const pathname = h.get("x-url") || "/";
  const messages = pickNamespaces(allMessages as Record<string, unknown>, pathname);

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://www.googletagmanager.com" />
        <link rel="dns-prefetch" href="https://www.google-analytics.com" />
        <OrganizationJsonLd />
        <WebSiteJsonLd />
        <PersonJsonLd />
      </head>
      <Script id="gtag-consent" strategy="afterInteractive">{`
        window.dataLayer=window.dataLayer||[];
        function gtag(){dataLayer.push(arguments);}
        gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
      `}</Script>
      <body className="min-h-full flex flex-col">
        <ServiceWorkerRegistration />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <PostHogProvider>
              <Header />
              <DeferredContextBars />
              <main className="flex-1">
                <FullMessagesProvider locale={locale}>{children}</FullMessagesProvider>
              </main>
              <Footer />
              <CookieBanner />
              <GtagLoader />
              <DeferredWidgets />
            </PostHogProvider>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
