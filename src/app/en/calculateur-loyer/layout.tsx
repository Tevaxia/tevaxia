import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Maximum Rent in Luxembourg: 5% Rule Calculator",
  description:
    "Calculate the legal rent cap in Luxembourg: 5% of revalued invested capital, depreciation, furnished lets, shared lets. Amended law of 21 September 2006.",
  alternates: localizedAlternates("/calculateur-loyer", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
