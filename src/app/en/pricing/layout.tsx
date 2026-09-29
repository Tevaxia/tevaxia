import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Features — tevaxia.lu",
  description: "Discover tevaxia.lu tools: indicative estimates, value analysis, DCF and property dossier preparation.",
  alternates: localizedAlternates("/pricing", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
