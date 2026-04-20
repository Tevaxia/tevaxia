import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Acheter ou louer au Luxembourg — Comparateur immobilier",
  description: "Comparez le coût total d'un achat immobilier vs la location au Luxembourg. Patrimoine constitué, point de croisement, crédit, placement alternatif.",
  alternates: localizedAlternates("/achat-vs-location", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
