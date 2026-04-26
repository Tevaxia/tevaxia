import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "HVAC-Simulator Lëtzebuerg — Dimensionéierung a Käschten",
  description: "Heizlaaschtberechnung no EN 12831. Wärmepompel-Katalog (Viessmann, Daikin, Vaillant, Buderus), KWL, Pelletkessel. Detailléiert Leeschtungsverzechnes, Klimabonus 2026.",
  alternates: localizedAlternates("/energy/hvac", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
