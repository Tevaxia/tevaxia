import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Mapa do site — tevaxia.lu",
  description: "Mapa do site tevaxia.lu: todas as ferramentas imobiliárias, simuladores de energia, dados de mercado e páginas legais do Luxemburgo.",
  alternates: localizedAlternates("/plan-du-site", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
