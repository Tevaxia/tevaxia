import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc — Calculadora Imobiliária para WordPress",
  description: "A calculadora de investimento imobiliário multi-país para WordPress. 10 países, 10 módulos, 7 idiomas.",
  alternates: localizedAlternates("/propcalc", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
