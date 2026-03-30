import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Outils bancaires immobilier Luxembourg — LTV, capacité d'emprunt, DSCR",
  description:
    "Outils bancaires pour le crédit immobilier au Luxembourg : ratio prêt/valeur (LTV), capacité d'emprunt, tableaux d'amortissement, ratio de couverture de dette (DSCR).",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
