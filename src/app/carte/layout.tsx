import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Carte des prix immobiliers Luxembourg — Prix au m² par commune",
  description:
    "Prix immobiliers au m² pour toutes les communes du Luxembourg. Données Observatoire de l'Habitat, transactions notariales, quartiers de Luxembourg-Ville.",
  alternates: localizedAlternates("/carte", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
