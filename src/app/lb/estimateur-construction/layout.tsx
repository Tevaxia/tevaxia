import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Baukaschteschätzer Lëtzebuerg — 17 STATEC-Gewierk",
  description: "Detailléiert Opschlësselung vun de Baukaschten no Gewierk (STATEC-Klassifikatioun). Upassung no Energieklass an Ausbaustufe. Index Oktober 2025.",
  alternates: localizedAlternates("/estimateur-construction", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
