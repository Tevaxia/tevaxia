import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Bilan promoteur Luxembourg — Compte à rebours immobilier",
  description: "Calculez la charge foncière maximale par la méthode du compte à rebours. Prix de vente, coûts de construction, frais, marge promoteur. Adapté au marché luxembourgeois.",
  alternates: localizedAlternates("/bilan-promoteur", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
