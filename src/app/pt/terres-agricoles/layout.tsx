import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Preços de terrenos agrícolas no Luxemburgo: cálculo",
  description: "Cálculo agrícola com preços e custos documentados, conversão hectare/m² e série nacional SER publicada.",
  alternates: localizedAlternates("/terres-agricoles", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
