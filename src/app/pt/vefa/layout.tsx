import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Calculadora VEFA Luxemburgo — Planeamento off-plan, IVA 3 %",
  description:
    "Calculate your off-plan (VEFA) property purchase in Luxembourg: milestone-based payment schedule, 3% reduced VAT for primary residence (max EUR 50,000 benefit), land registration duties, completion guarantee, notary fees.",
  alternates: localizedAlternates("/vefa", "pt"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
