import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxembourg Property Valuation — Price per m² by Municipality",
  description:
    "Estimate the value of your property in Luxembourg. Price per m² by municipality and neighbourhood, statistical adjustments, Observatoire de l'Habitat data.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
