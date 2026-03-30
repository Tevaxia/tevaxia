import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Acheter ou louer au Luxembourg — Comparateur immobilier",
  description: "Comparez le coût total d'un achat immobilier vs la location au Luxembourg. Patrimoine constitué, point de croisement, crédit, placement alternatif.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
