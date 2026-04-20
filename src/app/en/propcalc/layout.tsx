import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Real Estate Calculator for WordPress",
  description: "The multi-country property investment calculator for WordPress. 10 countries, 10 modules, 7 languages.",
  alternates: localizedAlternates("/propcalc", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
