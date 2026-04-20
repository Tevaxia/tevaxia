import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Simulateur VEFA Luxembourg — Appels de fonds, TVA 3%, Garantie d'achèvement",
  description:
    "Calculez votre achat en VEFA au Luxembourg : échéancier des appels de fonds par étape de construction, TVA 3% résidence principale (plafond 50 000 €), droits d'enregistrement terrain, garantie d'achèvement, frais de notaire.",
  alternates: localizedAlternates("/vefa", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
