import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Analyse PAG / PAP Luxembourg — Urbanisme et constructibilité",
  description: "Zones PAG, PAP Nouveau Quartier et Quartier Existant, COS, CMU, servitudes CTV/CTL, procédures d'autorisation. Guide urbanistique luxembourgeois.",
  alternates: localizedAlternates("/pag-pap", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
