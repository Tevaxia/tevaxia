import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Simulateur HVAC Luxembourg — Dimensionnement et chiffrage",
  description: "Dimensionnement chauffage et ventilation selon EN 12831. Catalogue PAC (Viessmann, Daikin, Vaillant, Buderus), VMC double flux, chaudières pellets. Bordereau détaillé, Klimabonus 2026.",
  alternates: localizedAlternates("/energy/hvac", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
