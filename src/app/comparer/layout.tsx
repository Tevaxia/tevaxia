import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Comparer deux biens immobiliers au Luxembourg | Tevaxia",
  description:
    "Comparez deux biens immobiliers au Luxembourg côte à côte : prix estimé, prix au m², confiance, ajustements. Données de l'Observatoire de l'Habitat.",
  alternates: localizedAlternates("/comparer", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
