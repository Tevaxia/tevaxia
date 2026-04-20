import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Sitemap — tevaxia.lu",
  description: "Sitemap of tevaxia.lu: all real estate tools, energy simulators, market data and legal pages for Luxembourg.",
  alternates: localizedAlternates("/plan-du-site", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
