import type { Metadata } from "next";
import { localizedAlternates, NOINDEX_METADATA } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Portfolio énergétique multi-biens",
  description: "Analysez le profil énergétique de votre parc immobilier. Comparaison multi-biens, score moyen pondéré, risque EPBD, CO₂.",
  alternates: localizedAlternates("/energy/portfolio", "fr"),
  ...NOINDEX_METADATA,
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Portfolio énergétique multi-biens</h1>
      {children}
    </>
  );
}
