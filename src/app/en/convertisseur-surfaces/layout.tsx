import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Surface Area Converter — GBA, GFA, ILNAS 101 Luxembourg",
  description: "Convert between GBA, GFA, usable area and living area (ILNAS 101:2016). ACT weighting for balconies, cellars, terraces. OAI FC.04 standards.",
  alternates: localizedAlternates("/convertisseur-surfaces", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
