import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Multi-tenant DCF — Lease-by-lease Valuation",
  description: "Multi-tenant DCF modelling: each lease modelled individually (rent, indexation, break, renewal, rent-free period). WAULT, occupancy rate, IRR.",
  alternates: localizedAlternates("/dcf-multi", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
