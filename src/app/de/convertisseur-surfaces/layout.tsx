import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Flächenrechner — BGF, NRF, ILNAS 101 Luxemburg",
  description: "Umrechnung zwischen BGF, Geschossfläche, Nutzfläche und Wohnfläche (ILNAS 101:2016). ACT-Gewichtung für Balkone, Keller, Terrassen. OAI FC.04 Normen.",
  alternates: localizedAlternates("/convertisseur-surfaces", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
