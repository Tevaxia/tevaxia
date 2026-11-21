import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Development Appraisal in Luxembourg: Margin and Land Budget",
  description:
    "Calculate the maximum land charge using the residual method. Sale price, construction costs, fees, developer margin. Tailored to the Luxembourg market.",
  alternates: localizedAlternates("/bilan-promoteur", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
