import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Price Map Luxembourg — Price per m² by Commune",
  description:
    "Property prices per m² for all communes in Luxembourg. Data from the Observatoire de l'Habitat, notarial deeds, Luxembourg City neighbourhoods.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
