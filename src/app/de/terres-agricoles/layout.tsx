import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Agricultural Land Valuation Luxembourg",
  description: "Estimate the value of agricultural land in Luxembourg. Price per hectare, farm buildings, demolition, asbestos removal, PAG buildability.",
  alternates: localizedAlternates("/terres-agricoles", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
