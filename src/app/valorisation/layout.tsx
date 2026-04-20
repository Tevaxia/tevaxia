import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Valorisation immobilière EVS 2025 — TEGOVA Luxembourg",
  description:
    "Outil de valorisation immobilière conforme TEGOVA EVS 2025. Méthode par comparaison, capitalisation, DCF, valeur hypothécaire CRR, approche résiduelle énergétique, réconciliation. Bureaux, commerces, hôtels, logistique.",
  alternates: localizedAlternates("/valorisation", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
