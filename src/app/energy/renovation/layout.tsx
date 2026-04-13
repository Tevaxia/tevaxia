import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "ROI Rénovation énergétique",
  description: "Simulez le coût, les aides Klimabonus/Klimaprêt, le gain de valeur et le retour sur investissement d'une rénovation énergétique au Luxembourg.",
  alternates: { canonical: "https://tevaxia.lu/energy/renovation" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
