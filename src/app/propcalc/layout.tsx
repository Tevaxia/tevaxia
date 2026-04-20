import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Calculateur Immobilier Multi-Pays pour WordPress",
  description: "Le plugin WordPress de calcul d'investissement immobilier multi-pays. 10 pays, 10 modules, 7 langues. Frais d'acquisition, capacité d'emprunt, rendement locatif, cash-flow.",
  alternates: localizedAlternates("/propcalc", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
