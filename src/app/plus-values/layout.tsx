import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculateur plus-values immobilières Luxembourg",
  description:
    "Calculez l'impôt sur les plus-values immobilières au Luxembourg. Spéculation vs cession longue durée, coefficients de réévaluation STATEC, abattement décennal, exemption résidence principale.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
