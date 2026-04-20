import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc Developers — Widget, REST API, npm, Chrome, Google Sheets",
  description: "Integrieren Sie Multi-Lander Immobilienberechnungen in Ihre Projekte. Widget, REST API, npm, Chrome Extension, Google Sheets Add-on.",
  alternates: localizedAlternates("/propcalc/developers", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
