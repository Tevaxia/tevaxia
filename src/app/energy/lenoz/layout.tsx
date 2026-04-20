import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Scoring LENOZ simplifié",
  description: "Évaluez la durabilité de votre bien selon la certification LENOZ luxembourgeoise. 6 catégories, 20 critères, notation Bronze à Platine.",
  alternates: localizedAlternates("/energy/lenoz", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
