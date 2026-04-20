import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Estimation immobilière Luxembourg — Prix au m² par commune",
  description:
    "Estimez la valeur de votre bien immobilier au Luxembourg. Prix au m² par commune et quartier, ajustements statistiques, données Observatoire de l'Habitat.",
  alternates: localizedAlternates("/estimation", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
