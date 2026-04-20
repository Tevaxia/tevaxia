import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "VRD-Schätzer Luxemburg — Ingenieurbüro, Mengenermittlung & Leistungsverzeichnis",
  description: "Professionelle VRD-Budgetschätzung: Erdarbeiten, Straßenbau, EU/EP-Netze, Trockenleitungen, Beleuchtung, Landschaftsbau. 9 Lose, belegte Preise Batiprix/CTG/CSDC-CT.",
  alternates: localizedAlternates("/calculateur-vrd", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
