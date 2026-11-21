import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Mehrmieter-DCF in Luxemburg: Zahlungsströme und IRR",
  description: "DCF-Analyse je Mietvertrag für ein Gebäude in Luxemburg: monatliche Zahlungsströme pro Jahr und IRR. Deterministisches Szenario, unverbindliche Parameter.",
  alternates: localizedAlternates("/dcf-multi", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
