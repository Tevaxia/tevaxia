import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Heizung in Luxemburg: Bedarf, Angebote, Kosten vergleichen",description:"Vergleichen Sie zwei Heizungsszenarien anhand von Wärmebedarf, saisonaler Leistung, Tarifen und Angeboten. Ausgangswerte dienen nur der Veranschaulichung.",alternates:localizedAlternates("/energy/hvac","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
