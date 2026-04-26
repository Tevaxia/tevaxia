import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Marché immobilier Luxembourg — Prix, loyers, bureaux, commerces",
  description:
    "Données de marché immobilier au Luxembourg : prix résidentiels par commune, bureaux, commerces, logistique, terrains à bâtir et indicateurs macroéconomiques. Sources officielles.",
  alternates: localizedAlternates("/marche", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
