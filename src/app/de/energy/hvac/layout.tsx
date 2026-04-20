import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "HVAC-Simulator Luxemburg — Dimensionierung, Produkte & Kostenschätzung",
  description: "Heizlastberechnung nach EN 12831. Wärmepumpen-Katalog (Viessmann, Daikin, Vaillant, Buderus), KWL, Pelletkessel. Detailliertes Leistungsverzeichnis, Klimabonus 2026.",
  alternates: localizedAlternates("/energy/hvac", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
