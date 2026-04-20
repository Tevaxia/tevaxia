import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimateur coût de construction Luxembourg — 17 corps de métier STATEC",
  description: "Décomposition détaillée du coût de construction par corps de métier (classification STATEC). Ajustement classe énergétique, niveau de finition. Indice octobre 2025.",
  alternates: localizedAlternates("/estimateur-construction", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
