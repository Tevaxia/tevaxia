import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Multi-tenant DCF — Lease-by-lease Valuation",
  description: "Multi-tenant DCF modelling: each lease modelled individually (rent, indexation, break, renewal, rent-free period). WAULT, occupancy rate, IRR.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
