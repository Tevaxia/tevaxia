import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Prévisions prix immobilier Luxembourg — 3 scénarios",
  description:
    "Projection des prix m² par commune luxembourgeoise à 12, 24 ou 48 mois. 3 scénarios configurables (pessimiste, central, optimiste) basés sur données STATEC + Observatoire Habitat. CAGR historique 5 ans affiché en référence.",
  openGraph: {
    title: "Prévisions prix immobilier LU — 12 à 48 mois",
    description:
      "3 scénarios configurables par commune, basés sur données STATEC + Observatoire Habitat.",
    type: "website",
  },
  alternates: localizedAlternates("/marche/forecast", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
