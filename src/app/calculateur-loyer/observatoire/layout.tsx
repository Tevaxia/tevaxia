import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Observatoire des loyers Luxembourg — 19 zones × 5 typologies",
  description:
    "Loyers médians observés par commune, zone et typologie (studio, 1/2/3 chambres, maison). Mietspiegel-like LU Q4 2025 basé sur Athome Pro + Observatoire Habitat + panel tevaxia.",
  openGraph: {
    title: "Observatoire des loyers Luxembourg Q4 2025",
    description:
      "19 zones × 5 typologies. Loyers médians P25/P75, trend 12 mois.",
    type: "website",
  },
  alternates: localizedAlternates("/calculateur-loyer/observatoire", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
