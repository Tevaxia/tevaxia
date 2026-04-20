import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Immobilie-Rechner fir WordPress",
  description: "De Multi-Land Immobilie-Investitiounsrechner fir WordPress. 10 Länner, 10 Moduler, 7 Sproochen.",
  alternates: localizedAlternates("/propcalc", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
