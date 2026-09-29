import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Fonctionnalités — tevaxia.lu",
  description: "Découvrez les outils de tevaxia.lu : estimations indicatives, analyse de valeur, DCF et préparation de dossiers immobiliers.",
  alternates: localizedAlternates("/pricing", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
