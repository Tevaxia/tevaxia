import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "tevaxia.lu — Luxembourg Real Estate Tools",
    template: "%s | tevaxia.lu",
  },
  description:
    "The reference platform for Luxembourg real estate. Rent cap calculators, acquisition fees, capital gains, state subsidies, EVS 2025 valuation, banking tools.",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return children;
}
