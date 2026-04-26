import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Convertisseur de surfaces — SCB, SCP, ILNAS 101 Luxembourg",
  description: "Conversion entre SCB, SCP, surface utile et surface habitable (ILNAS 101:2016). Pondération ACT pour balcons, caves, terrasses. Normes OAI FC.04.",
  alternates: localizedAlternates("/convertisseur-surfaces", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
