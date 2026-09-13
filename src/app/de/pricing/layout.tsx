import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Funktionen und Tarife — Tevaxia",
  description: "Entdecken Sie die Immobilienrechner, Berichte und Verwaltungsfunktionen von Tevaxia sowie die verfügbaren Angebote.",
  alternates: localizedAlternates("/pricing", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
