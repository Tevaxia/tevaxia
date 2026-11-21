import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Preise für Agrarflächen in Luxemburg: Berechnung",
  description: "Agrarberechnung mit belegten Preisen und Kosten, Hektar/m²-Umrechnung und veröffentlichter nationaler SER-Reihe.",
  alternates: localizedAlternates("/terres-agricoles", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
