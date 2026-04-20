import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Hedonic Valuation Luxembourg — Regression Model",
  description: "Property value estimation using a multi-criteria hedonic model. Surface area, location, floor, energy class, parking, outdoor space, condition. Inspired by the Observatoire de l'Habitat model.",
  alternates: localizedAlternates("/hedonique", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
