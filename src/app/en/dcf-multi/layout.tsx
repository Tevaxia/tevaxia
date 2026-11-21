import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Multi-tenant DCF in Luxembourg: Cash Flows and IRR",
  description: "Lease-by-lease DCF analysis for a building in Luxembourg: monthly cash flows grouped by year and IRR. Deterministic scenario, indicative inputs.",
  alternates: localizedAlternates("/dcf-multi", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
