import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Calcul du loyer maximum au Luxembourg : règle des 5 %",
  description:
    "Calculez le plafond légal du loyer au Luxembourg : 5 % du capital investi réévalué, vétusté, logement meublé, colocation. Loi modifiée du 21 septembre 2006.",
  alternates: localizedAlternates("/calculateur-loyer", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
