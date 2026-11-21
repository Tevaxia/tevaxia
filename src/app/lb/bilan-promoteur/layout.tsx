import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Promoteursbilan zu Lëtzebuerg: Marge an Terrainsbudget",
  description:
    "Calculate the maximum land charge using the residual method. Sale price, construction costs, fees, developer margin. Tailored to the Luxembourg market.",
  alternates: localizedAlternates("/bilan-promoteur", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
