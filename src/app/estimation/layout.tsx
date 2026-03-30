import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Estimation immobilière Luxembourg — Prix au m² par commune",
  description:
    "Estimez la valeur de votre bien immobilier au Luxembourg. Prix au m² par commune et quartier, ajustements statistiques, données Observatoire de l'Habitat.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
