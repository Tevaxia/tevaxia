import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Comparer deux biens immobiliers Luxembourg — Estimation cote a cote",
  description:
    "Comparez deux biens immobiliers au Luxembourg cote a cote : prix estime, prix au m2, confiance, ajustements. Donnees Observatoire de l'Habitat.",
  alternates: localizedAlternates("/comparer", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
