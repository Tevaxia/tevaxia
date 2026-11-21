import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Capacité d'emprunt au Luxembourg : simulateur, LTV, DSCR",
  description:
    "Simulez votre capacité d'emprunt immobilier au Luxembourg : ratio prêt/valeur (LTV), mensualités, tableau d'amortissement et couverture de dette (DSCR).",
  alternates: localizedAlternates("/outils-bancaires", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
