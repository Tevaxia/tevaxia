import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Simulateur Communauté d'énergie",
  description: "Estimez les économies d'une communauté d'énergie renouvelable au Luxembourg. Production PV, autoconsommation, conformité ILR.",
  alternates: { canonical: "https://energy.tevaxia.lu/communaute" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
