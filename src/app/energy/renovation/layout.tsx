import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "ROI Rénovation énergétique",
  description: "Simulez le coût, les aides Klimabonus/Klimaprêt, le gain de valeur et le retour sur investissement d'une rénovation énergétique au Luxembourg.",
  alternates: localizedAlternates("/energy/renovation", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
