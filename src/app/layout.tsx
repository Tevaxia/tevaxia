import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieBanner from "@/components/CookieBanner";
import AuthProvider from "@/components/AuthProvider";
import HreflangTags from "@/components/HreflangTags";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "tevaxia.lu — Outils Immobiliers Luxembourg",
    template: "%s | tevaxia.lu",
  },
  description:
    "Plateforme de référence pour l'immobilier au Luxembourg. Calculateurs de loyer, frais d'acquisition, plus-values, aides étatiques, outils bancaires.",
  openGraph: {
    title: "tevaxia.lu — Outils Immobiliers Luxembourg",
    description: "22 outils de calcul immobilier pour le Luxembourg. Estimation, frais, plus-values, aides, valorisation EVS 2025, DCF, MLV/CRR.",
    url: "https://tevaxia.lu",
    siteName: "tevaxia.lu",
    locale: "fr_LU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "tevaxia.lu — Outils Immobiliers Luxembourg",
    description: "22 outils de calcul immobilier pour le Luxembourg.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const messages = await getMessages();

  return (
    <html
      lang="fr"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <HreflangTags />
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
          <AuthProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CookieBanner />
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
