import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Valorisation hédonique Luxembourg — Modèle de régression",
  description: "Estimation de la valeur immobilière par modèle hédonique multi-critères. Surface, localisation, étage, énergie, parking, extérieur, état. Inspiré du modèle Observatoire de l'Habitat.",
  alternates: localizedAlternates("/hedonique", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
