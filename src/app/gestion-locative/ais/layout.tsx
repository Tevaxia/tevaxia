import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "AIS Luxembourg — Gestion locative sociale, abattement 75 %",
  description:
    "Calculez l'économie fiscale d'une gestion via une Agence Immobilière Sociale LU (abattement 75 % art. L. 162bis LIR, accord tripartite 03/2023). Liste des 5 AIS agréées + conditions d'éligibilité.",
  openGraph: {
    title: "AIS Luxembourg — Abattement fiscal 75 % sur les loyers",
    description:
      "Conditions d'éligibilité + calcul économie fiscale + liste partenaires AIS agréés LU.",
    type: "website",
  },
  alternates: localizedAlternates("/gestion-locative/ais", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
