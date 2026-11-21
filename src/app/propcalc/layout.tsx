import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Calculateur Immobilier Multi-Pays pour WordPress",
  description: "PropCalc, plugin WordPress de calcul immobilier multi-pays : frais d'acquisition, capacité d'emprunt, rendement locatif, cash-flow. Dix pays, sept langues.",
  alternates: localizedAlternates("/propcalc", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
