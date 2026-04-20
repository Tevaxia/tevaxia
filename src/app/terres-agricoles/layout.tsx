import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Évaluation terres agricoles Luxembourg",
  description: "Estimation de la valeur des terres agricoles au Luxembourg. Prix par hectare, bâtiments d'exploitation, démolition, désamiantage, constructibilité PAG.",
  alternates: localizedAlternates("/terres-agricoles", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
