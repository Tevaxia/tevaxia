import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "HVAC Simulator Luxembourg — Sizing, Products and Cost",
  description: "Heating and ventilation sizing per EN 12831. Heat pump catalogue (Viessmann, Daikin, Vaillant, Buderus), HRV, pellet boilers. Detailed bill of quantities, Klimabonus 2026.",
  alternates: localizedAlternates("/energy/hvac", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
