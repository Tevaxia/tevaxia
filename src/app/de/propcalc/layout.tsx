import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Immobilien-Rechner für WordPress",
  description: "Der Multi-Länder Immobilien-Investitionsrechner für WordPress. 10 Länder, 10 Module, 7 Sprachen.",
  alternates: localizedAlternates("/propcalc", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
