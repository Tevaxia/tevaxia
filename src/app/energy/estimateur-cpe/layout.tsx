import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Préparer son passeport énergétique (CPE) au Luxembourg",
  description: "Préparez les informations et documents pour un expert CPE. Ratio d’énergie déclarée par surface, sans attribution automatique de classe énergétique.",
  alternates: localizedAlternates("/energy/estimateur-cpe", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
