import type { Metadata } from "next";
import EnergyHeader from "@/components/energy/EnergyHeader";
import EnergyFooter from "@/components/energy/EnergyFooter";

const ENERGY_BASE = "https://energy.tevaxia.lu";

export const metadata: Metadata = {
  title: {
    default: "energy.tevaxia.lu — Simulateurs Énergie Immobilier Luxembourg",
    template: "%s | energy.tevaxia.lu",
  },
  description:
    "Simulateurs de performance énergétique pour l'immobilier au Luxembourg. Impact CPE sur la valeur, ROI rénovation, communautés d'énergie, EPBD, LENOZ.",
  metadataBase: new URL(ENERGY_BASE),
  alternates: {
    canonical: ENERGY_BASE,
    languages: {
      fr: ENERGY_BASE,
      en: `${ENERGY_BASE}/en`,
      de: `${ENERGY_BASE}/de`,
      pt: `${ENERGY_BASE}/pt`,
      lb: `${ENERGY_BASE}/lb`,
      "x-default": ENERGY_BASE,
    },
  },
  openGraph: {
    title: "energy.tevaxia.lu — Simulateurs Énergie Immobilier",
    description:
      "Impact énergétique sur la valeur, ROI rénovation, communautés d'énergie, timeline EPBD, scoring LENOZ, portfolio. Luxembourg.",
    url: ENERGY_BASE,
    siteName: "energy.tevaxia.lu",
    locale: "fr_LU",
    type: "website",
    images: [{
      url: "https://tevaxia.lu/og-image.png",
      width: 1200,
      height: 630,
      alt: "energy.tevaxia.lu — Simulateurs énergétiques Luxembourg",
    }],
  },
  twitter: {
    card: "summary_large_image",
    title: "energy.tevaxia.lu — Simulateurs Énergie Immobilier Luxembourg",
    description: "7 outils de simulation énergétique pour l'immobilier au Luxembourg.",
    images: ["https://tevaxia.lu/og-image.png"],
  },
};

export default function EnergyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <EnergyHeader />
      <main className="flex-1">{children}</main>
      <EnergyFooter />
    </>
  );
}
