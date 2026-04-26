import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Acquisitiounskäschten Lëtzebuerg — Drot, Bëllegen Akt, MwSt",
  description:
    "Calculate property acquisition fees in Luxembourg: 7% registration duties, Bellegen Akt tax credit of 40,000 EUR, 3% VAT for off-plan (VEFA), notary fees, mortgage costs.",
  alternates: localizedAlternates("/frais-acquisition", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
