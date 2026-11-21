import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ no Luxemburgo: verificar os limiares de classificação",description:"Introduza os graus de realização do seu dossiê LENOZ para verificar os limiares publicados pelo ministério. Não substitui a avaliação dos critérios.",alternates:localizedAlternates("/energy/lenoz","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
