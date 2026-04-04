import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Property Portfolio — Multi-Asset Dashboard",
  description: "Aggregate your real estate assets: total value, weighted yield, breakdown by type and location, performance tracking.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
