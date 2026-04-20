import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Construction Cost Estimator Luxembourg — 17 STATEC Trades",
  description: "Detailed construction cost breakdown by trade (STATEC classification). Energy class and finish level adjustment. October 2025 index.",
  alternates: localizedAlternates("/estimateur-construction", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
