import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF multi-inquilinos no Luxemburgo: fluxos e TIR",
  description: "Análise DCF contrato a contrato de um edifício no Luxemburgo: fluxos mensais agrupados por ano e TIR. Cenário determinístico, parâmetros indicativos.",
  alternates: localizedAlternates("/dcf-multi", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
