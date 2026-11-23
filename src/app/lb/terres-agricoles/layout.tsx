import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Präisser vun Agrarflächen zu Lëtzebuerg: Berechnung",
  description: "Agrarberechnung mat dokumentéierte Präisser a Käschten, Hektar/m²-Konversioun a publizéierter nationaler SER-Serie.",
  alternates: localizedAlternates("/terres-agricoles", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
