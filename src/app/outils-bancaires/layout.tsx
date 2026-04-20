import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Outils bancaires immobilier Luxembourg — LTV, capacité d'emprunt, DSCR",
  description:
    "Outils bancaires pour le crédit immobilier au Luxembourg : ratio prêt/valeur (LTV), capacité d'emprunt, tableaux d'amortissement, ratio de couverture de dette (DSCR).",
  alternates: localizedAlternates("/outils-bancaires", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
