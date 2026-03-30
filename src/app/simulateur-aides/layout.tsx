import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulateur d'aides au logement Luxembourg — Bëllegen Akt, Klimabonus",
  description:
    "Simulez toutes les aides au logement au Luxembourg : Bëllegen Akt, prime d'accession, subvention d'intérêt, garantie État, Klimabonus, aides communales. 5 couches d'aides cumulables.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
