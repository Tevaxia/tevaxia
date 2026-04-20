import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Luxembourg Real Estate Market Database — Prices, Rents, Offices, Retail",
  description:
    "Luxembourg real estate market data: residential prices by commune, offices, retail, logistics, land prices and macroeconomic indicators. Official sources.",
  alternates: localizedAlternates("/marche", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
