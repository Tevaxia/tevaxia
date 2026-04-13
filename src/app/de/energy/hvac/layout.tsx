import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HVAC-Simulator Luxemburg — Dimensionierung, Produkte & Kostenschätzung",
  description: "Heizlastberechnung nach EN 12831. Wärmepumpen-Katalog (Viessmann, Daikin, Vaillant, Buderus), KWL, Pelletkessel. Detailliertes Leistungsverzeichnis, Klimabonus 2026.",
  alternates: { canonical: "https://tevaxia.lu/energy/de/hvac" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
