import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Simulador HVAC Luxemburgo — Dimensionamento e Orçamento",
  description: "Dimensionamento de aquecimento e ventilação segundo EN 12831. Catálogo de bombas de calor (Viessmann, Daikin, Vaillant, Buderus), VMC duplo fluxo, caldeiras a pellets. Klimabonus 2026.",
  alternates: localizedAlternates("/energy/hvac", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
