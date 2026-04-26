import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimateur VRD Luxembourg — Métrés et bordereau de prix",
  description: "Estimation budgétaire VRD professionnelle : terrassement, voirie, réseaux EU/EP, réseaux secs, éclairage, aménagements. 9 lots, prix sourcés Batiprix/CTG/CSDC-CT.",
  alternates: localizedAlternates("/calculateur-vrd", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
