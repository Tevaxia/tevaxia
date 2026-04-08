import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Plan du site — tevaxia.lu",
  description: "Plan du site tevaxia.lu : tous les outils immobiliers, simulateurs énergie, données marché et pages légales du Luxembourg.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
