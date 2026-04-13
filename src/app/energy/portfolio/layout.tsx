import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Portfolio énergétique multi-biens",
  description: "Analysez le profil énergétique de votre parc immobilier. Comparaison multi-biens, score moyen pondéré, risque EPBD, CO₂.",
  alternates: { canonical: "https://tevaxia.lu/energy/portfolio" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
