import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Benchmark inter-copropriétés — KPIs syndic Luxembourg",
  description:
    "Comparez en temps réel les KPIs opérationnels et financiers de toutes les copropriétés sous mandat de votre cabinet : charges €/m², fonds travaux, taux de recouvrement, retard moyen, relances. Score composite par copropriété.",
  openGraph: {
    title: "Benchmark inter-copropriétés — Syndic LU",
    description:
      "Comparaison KPIs en temps réel : charges, fonds travaux, recouvrement, retards.",
    type: "website",
  },
  alternates: localizedAlternates("/syndic/benchmark", "fr"),
  robots: "noindex,nofollow", // Page privée syndic
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
