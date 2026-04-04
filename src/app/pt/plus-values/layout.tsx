import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxembourg Real Estate Capital Gains Tax Calculator",
  description:
    "Calculate capital gains tax on real estate in Luxembourg. Speculation vs long-term disposal, STATEC revaluation coefficients, ten-year allowance, primary residence exemption.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
