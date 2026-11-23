import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Rénovation énergétique au Luxembourg : calcul du ROI",
  description: "Calculez un scénario de rénovation à partir des devis, aides confirmées et économies de factures : trésorerie, VAN, TRI et financement séparé.",
  alternates: localizedAlternates("/energy/renovation", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
