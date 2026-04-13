import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Simulateur HVAC Luxembourg — Dimensionnement, produits et chiffrage",
  description: "Dimensionnement chauffage et ventilation selon EN 12831. Catalogue PAC (Viessmann, Daikin, Vaillant, Buderus), VMC double flux, chaudières pellets. Bordereau détaillé, Klimabonus 2026.",
  alternates: {
    canonical: "https://tevaxia.lu/energy/hvac",
  },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
