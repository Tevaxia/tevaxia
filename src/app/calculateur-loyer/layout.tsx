import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Calculateur de loyer Luxembourg — Capital investi et plafond légal",
  description:
    "Calculez le plafond légal de loyer au Luxembourg selon la règle des 5% du capital investi. Coefficients de réévaluation STATEC, vétusté, colocation. Loi du 21 septembre 2006.",
  alternates: localizedAlternates("/calculateur-loyer", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
