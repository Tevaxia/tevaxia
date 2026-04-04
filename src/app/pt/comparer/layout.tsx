import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Compare Two Properties in Luxembourg — Side-by-Side Valuation",
  description:
    "Compare two properties in Luxembourg side by side: estimated price, price per m2, confidence level, adjustments. Observatoire de l'Habitat data.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
