import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Baukostenschätzer Luxemburg — 17 STATEC-Gewerke",
  description: "Detaillierte Baukostenaufschlüsselung nach Gewerk (STATEC-Klassifikation). Anpassung nach Energieklasse und Ausbaustufe. Index Oktober 2025.",
  alternates: localizedAlternates("/estimateur-construction", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
