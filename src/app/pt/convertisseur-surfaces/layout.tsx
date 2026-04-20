import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Conversor de Superfícies Luxemburgo — ABC, APC, Área Habitável ILNAS 101",
  description: "Conversão entre ABC, APC, área útil e área habitável (ILNAS 101:2016). Ponderação ACT para varandas, caves, terraços. Normas OAI FC.04.",
  alternates: localizedAlternates("/convertisseur-surfaces", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
