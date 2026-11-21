import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Plus-value immobilière au Luxembourg 2026 : calculateur",
  description:
    "Calculez l'impôt sur une plus-value immobilière au Luxembourg : spéculation ou cession, coefficients de réévaluation, abattements, résidence principale.",
  alternates: localizedAlternates("/plus-values", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
