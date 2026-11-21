import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ in Luxemburg: Klassifizierungsschwellen prüfen",description:"Geben Sie die Erfüllungsgrade Ihrer LENOZ-Akte ein, um die vom Ministerium veröffentlichten Schwellen zu prüfen. Ersetzt nicht die Kriterienbewertung.",alternates:localizedAlternates("/energy/lenoz","de")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
