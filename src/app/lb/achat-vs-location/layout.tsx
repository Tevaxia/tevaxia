import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Buy or Rent in Luxembourg — Real Estate Comparison Tool",
  description:
    "Compare the total cost of buying vs renting property in Luxembourg. Net wealth accumulation, crossover point, mortgage, alternative investment.",
  alternates: localizedAlternates("/achat-vs-location", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
