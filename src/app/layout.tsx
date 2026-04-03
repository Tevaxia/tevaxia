import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { headers } from "next/headers";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const BASE = "https://tevaxia.lu";

export async function generateMetadata(): Promise<Metadata> {
  const h = await headers();
  const url = h.get("x-url") || "/";
  const isEN = url === "/en" || url.startsWith("/en/");
  const pathWithoutLocale = isEN ? url.replace(/^\/en/, "") || "/" : url;
  const frUrl = `${BASE}${pathWithoutLocale}`;
  const enUrl = `${BASE}/en${pathWithoutLocale === "/" ? "" : pathWithoutLocale}`;
  const canonical = isEN ? enUrl : frUrl;

  return {
    title: {
      default: "tevaxia.lu — Outils Immobiliers Luxembourg",
      template: "%s | tevaxia.lu",
    },
    description:
      "Plateforme de référence pour l'immobilier au Luxembourg. Calculateurs de loyer, frais d'acquisition, plus-values, aides étatiques, outils bancaires.",
    alternates: {
      canonical,
      languages: {
        fr: frUrl,
        en: enUrl,
        "x-default": frUrl,
      },
    },
    openGraph: {
      title: "tevaxia.lu — Outils Immobiliers Luxembourg",
      description: "Outils de calcul immobilier pour le Luxembourg. Estimation, frais, plus-values, aides, valorisation EVS 2025, DCF, MLV/CRR.",
      url: canonical,
      siteName: "tevaxia.lu",
      locale: isEN ? "en_GB" : "fr_LU",
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
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [messages, locale, headersList] = await Promise.all([
    getMessages(),
    getLocale(),
    headers(),
  ]);
  const url = headersList.get("x-url") || "";
  const isEnergy = headersList.get("x-energy-subdomain") === "1"
    || url.startsWith("/energy")
    || url.startsWith("/en/energy");

  return (
    <html
      lang={locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('consent', 'default', {
                analytics_storage: 'denied',
                ad_storage: 'denied',
                ad_user_data: 'denied',
                ad_personalization: 'denied',
                wait_for_update: 500
              });
            `,
          }}
        />
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-4033901KHR" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-4033901KHR');
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <NextIntlClientProvider messages={messages}>
          {isEnergy ? (
            <>{children}</>
          ) : (
            <AuthProvider>
              <Header />
              <main className="flex-1">{children}</main>
              <Footer />
              <CookieBanner />
            </AuthProvider>
          )}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
