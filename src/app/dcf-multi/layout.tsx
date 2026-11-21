import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF multi-locataires au Luxembourg : flux et TRI | Tevaxia",
  description: "Analyse DCF bail par bail d’un immeuble au Luxembourg : flux mensuels regroupés par an et TRI. Scénario déterministe, paramètres indicatifs, exemples fictifs.",
  alternates: localizedAlternates("/dcf-multi", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
