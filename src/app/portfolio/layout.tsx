import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Portfolio immobilier — Tableau de bord multi-actifs",
  description: "Agrégez vos biens immobiliers : valeur totale, rendement pondéré, répartition par type et localisation, suivi de performance.",
  alternates: localizedAlternates("/portfolio", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
