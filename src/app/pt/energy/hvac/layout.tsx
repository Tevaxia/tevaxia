import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Simulador HVAC Luxemburgo — Dimensionamento, Produtos e Orçamento",
  description: "Dimensionamento de aquecimento e ventilação segundo EN 12831. Catálogo de bombas de calor (Viessmann, Daikin, Vaillant, Buderus), VMC duplo fluxo, caldeiras a pellets. Klimabonus 2026.",
  alternates: { canonical: "https://tevaxia.lu/energy/pt/hvac" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
