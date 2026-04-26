import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimador VRD Luxemburgo — Medições e Mapa de Quantidades",
  description: "Estimativa orçamental VRD profissional: terraplenagem, estradas, redes EU/EP, redes secas, iluminação, paisagismo. 9 lotes, preços referenciados Batiprix/CTG/CSDC-CT.",
  alternates: localizedAlternates("/calculateur-vrd", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
