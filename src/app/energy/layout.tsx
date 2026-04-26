import type { Metadata } from "next";

const ENERGY_BASE = "https://tevaxia.lu/energy";

export const metadata: Metadata = {
  title: {
    default: "Tevaxia Energy — Simulateurs Énergie Immobilier Luxembourg",
    template: "%s",
  },
  description:
    "Simulateurs de performance énergétique pour l'immobilier au Luxembourg. Impact CPE sur la valeur, ROI rénovation, communautés d'énergie, EPBD, LENOZ.",
  metadataBase: new URL(ENERGY_BASE),
  alternates: {
    canonical: ENERGY_BASE,
    languages: {
      fr: ENERGY_BASE,
      en: "https://tevaxia.lu/en/energy",
      de: "https://tevaxia.lu/de/energy",
      pt: "https://tevaxia.lu/pt/energy",
      lb: "https://tevaxia.lu/lb/energy",
      "x-default": ENERGY_BASE,
    },
  },
  openGraph: {
    title: "Tevaxia Energy — Simulateurs Énergie Immobilier",
    description:
      "Impact énergétique sur la valeur, ROI rénovation, communautés d'énergie, timeline EPBD, scoring LENOZ, portfolio. Luxembourg.",
    url: ENERGY_BASE,
    siteName: "tevaxia.lu",
    locale: "fr_LU",
    type: "website",
    images: [{
      url: "https://tevaxia.lu/og-image.png",
      width: 1200,
      height: 630,
      alt: "Tevaxia Energy — Simulateurs énergétiques Luxembourg",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Tevaxia Energy — Simulateurs Énergie Immobilier Luxembourg",
    description: "7 outils de simulation énergétique pour l'immobilier au Luxembourg.",
    images: ["https://tevaxia.lu/og-image.png"],
  },
};

export default function EnergyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
