import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Balanço de promotor no Luxemburgo: margem e custo do terreno",
  description:
    "Calculate the maximum land charge using the residual method. Sale price, construction costs, fees, developer margin. Tailored to the Luxembourg market.",
  alternates: localizedAlternates("/bilan-promoteur", "pt"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
