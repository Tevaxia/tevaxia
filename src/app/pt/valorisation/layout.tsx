import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Avaliação imobiliária no Luxemburgo: métodos e cenários",
  description: "Compare vendas documentadas, capitalize rendimentos ou desconte fluxos e escolha pesos adequados ao processo.",
  alternates: localizedAlternates("/valorisation", "pt"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
