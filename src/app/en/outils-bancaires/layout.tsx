import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Borrowing Capacity in Luxembourg: Simulator, LTV, DSCR",
  description:
    "Simulate your mortgage borrowing capacity in Luxembourg: loan-to-value (LTV), monthly payments, amortisation schedule and debt service coverage (DSCR).",
  alternates: localizedAlternates("/outils-bancaires", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
