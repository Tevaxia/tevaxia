import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "VRD Estimator Luxembourg — Engineering Office, Quantities & Bill of Prices",
  description: "Professional VRD budget estimation: earthworks, roads, EU/EP networks, dry utilities, lighting, landscaping. 9 lots, sourced prices from Batiprix/CTG/CSDC-CT.",
  alternates: localizedAlternates("/calculateur-vrd", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
