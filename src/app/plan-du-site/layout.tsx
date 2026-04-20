import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Plan du site — tevaxia.lu",
  description: "Plan du site tevaxia.lu : tous les outils immobiliers, simulateurs énergie, données marché et pages légales du Luxembourg.",
  alternates: localizedAlternates("/plan-du-site", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
