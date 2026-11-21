import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Tarifs de tevaxia.lu : gratuit pendant le lancement",
  description: "Tarifs de tevaxia.lu : calculateurs en accès libre, compte gratuit, offre Pro offerte pendant le lancement. Outils immobiliers pour le Luxembourg.",
  alternates: localizedAlternates("/pricing", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
