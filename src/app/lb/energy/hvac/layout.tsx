import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HVAC-Simulator Lëtzebuerg — Dimensionéierung, Produkter & Käschteschätzung",
  description: "Heizlaaschtberechnung no EN 12831. Wärmepompel-Katalog (Viessmann, Daikin, Vaillant, Buderus), KWL, Pelletkessel. Detailléiert Leeschtungsverzechnes, Klimabonus 2026.",
  alternates: { canonical: "https://tevaxia.lu/energy/lb/hvac" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
