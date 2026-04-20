import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Surface Area Converter Luxembourg — GBA, GFA, Living Area ILNAS 101",
  description: "Convert between GBA, GFA, usable area and living area (ILNAS 101:2016). ACT weighting for balconies, cellars, terraces. OAI FC.04 standards.",
  alternates: localizedAlternates("/convertisseur-surfaces", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
