import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "VRD-Schätzer Lëtzebuerg — Ingenieurbüro, Mengenermëttlung & Leeschtungsverzechnes",
  description: "Professionell VRD-Budgetschätzung: Äerdaarbechten, Stroossebauen, EU/EP-Netzer, Tréchenleitungen, Beliichtung, Landschaftsbauen. 9 Loser, beleete Präisser Batiprix/CTG/CSDC-CT.",
  alternates: localizedAlternates("/calculateur-vrd", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
