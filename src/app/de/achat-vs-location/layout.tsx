import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Buy or Rent in Luxembourg — Real Estate Comparison Tool",
  description:
    "Compare the total cost of buying vs renting property in Luxembourg. Net wealth accumulation, crossover point, mortgage, alternative investment.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
