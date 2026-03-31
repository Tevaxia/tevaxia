import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Agricultural Land Valuation Luxembourg",
  description: "Estimate the value of agricultural land in Luxembourg. Price per hectare, farm buildings, demolition, asbestos removal, PAG buildability.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
