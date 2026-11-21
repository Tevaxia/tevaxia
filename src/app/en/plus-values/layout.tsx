import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Capital Gains Tax on Property in Luxembourg 2026: Calculator",
  description:
    "Calculate tax on a property capital gain in Luxembourg: speculation or long-term disposal, revaluation coefficients, allowances, main residence.",
  alternates: localizedAlternates("/plus-values", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
