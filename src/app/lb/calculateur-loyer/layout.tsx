import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Luxembourg Rent Calculator — Invested Capital & Legal Rent Cap",
  description:
    "Calculate the legal rent cap in Luxembourg based on the 5% invested capital rule. STATEC revaluation coefficients, depreciation, shared tenancy. Law of 21 September 2006.",
  alternates: localizedAlternates("/calculateur-loyer", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
