import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Agricultural Land Prices in Luxembourg: Calculator",
  description: "Agricultural calculation with documented prices and costs, hectare/m² conversion and published SER national data.",
  alternates: localizedAlternates("/terres-agricoles", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
