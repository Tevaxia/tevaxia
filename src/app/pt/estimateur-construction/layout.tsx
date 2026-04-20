import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimador de Custo de Construção Luxemburgo — 17 Ofícios STATEC",
  description: "Decomposição detalhada do custo de construção por ofício (classificação STATEC). Ajuste por classe energética e nível de acabamento. Índice outubro 2025.",
  alternates: localizedAlternates("/estimateur-construction", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
