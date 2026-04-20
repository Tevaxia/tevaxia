import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc Developers — Widget, REST API, npm, Chrome, Google Sheets",
  description: "Integre calculos imobiliarios multi-pais nos seus projetos. Widget, REST API, npm, Chrome Extension, Google Sheets Add-on.",
  alternates: localizedAlternates("/propcalc/developers", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
