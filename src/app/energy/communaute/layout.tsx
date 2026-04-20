import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Simulateur Communauté d'énergie",
  description: "Estimez les économies d'une communauté d'énergie renouvelable au Luxembourg. Production PV, autoconsommation, conformité ILR.",
  alternates: localizedAlternates("/energy/communaute", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
