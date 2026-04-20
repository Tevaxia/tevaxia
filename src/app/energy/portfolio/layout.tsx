import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Portfolio énergétique multi-biens",
  description: "Analysez le profil énergétique de votre parc immobilier. Comparaison multi-biens, score moyen pondéré, risque EPBD, CO₂.",
  alternates: localizedAlternates("/energy/portfolio", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
