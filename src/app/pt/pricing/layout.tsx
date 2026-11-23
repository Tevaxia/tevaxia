import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Preços do tevaxia.lu: gratuito durante o lançamento",
  description: "Preços do tevaxia.lu: calculadoras de acesso livre, conta gratuita, oferta Pro gratuita durante o lançamento. Ferramentas imobiliárias para o Luxemburgo.",
  alternates: localizedAlternates("/pricing", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
