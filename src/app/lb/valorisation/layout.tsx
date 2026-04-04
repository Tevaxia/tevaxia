import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Valuation EVS 2025 — TEGOVA Luxembourg",
  description:
    "Property valuation tool compliant with TEGOVA EVS 2025. Comparison method, capitalisation, DCF, CRR mortgage lending value, energy residual approach, reconciliation. Offices, retail, hotels, logistics.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
