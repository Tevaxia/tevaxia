import type { Metadata } from "next";
import EnergyHeader from "@/components/energy/EnergyHeader";
import EnergyFooter from "@/components/energy/EnergyFooter";

export const metadata: Metadata = {
  title: {
    default: "energy.tevaxia.lu — Simulateurs Énergie Immobilier Luxembourg",
    template: "%s | energy.tevaxia.lu",
  },
  description:
    "Simulateurs de performance énergétique pour l'immobilier au Luxembourg. Impact CPE sur la valeur, ROI rénovation, communautés d'énergie.",
  openGraph: {
    title: "energy.tevaxia.lu — Simulateurs Énergie Immobilier",
    description:
      "Impact énergétique sur la valeur, ROI rénovation, communautés d'énergie renouvelable. Outils de simulation pour le Luxembourg.",
    url: "https://energy.tevaxia.lu",
    siteName: "energy.tevaxia.lu",
    locale: "fr_LU",
    type: "website",
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
