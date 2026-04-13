import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "HVAC Simulator Luxembourg — Sizing, Products & Cost Estimation",
  description: "Heating and ventilation sizing per EN 12831. Heat pump catalogue (Viessmann, Daikin, Vaillant, Buderus), HRV, pellet boilers. Detailed bill of quantities, Klimabonus 2026.",
  alternates: { canonical: "https://tevaxia.lu/energy/en/hvac" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
