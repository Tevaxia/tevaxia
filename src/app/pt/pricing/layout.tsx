import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Funcionalidades e preços — Tevaxia",
  description: "Conheça as calculadoras imobiliárias, os relatórios e as ferramentas de gestão da Tevaxia, bem como as ofertas disponíveis.",
  alternates: localizedAlternates("/pricing", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
