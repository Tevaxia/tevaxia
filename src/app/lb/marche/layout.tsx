import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Immobiliemaart Lëtzebuerg — Präisser, Locatiounen, Büroen",
  description:
    "Luxembourg real estate market data: residential prices by commune, offices, retail, logistics, land prices and macroeconomic indicators. Official sources.",
  alternates: localizedAlternates("/marche", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
