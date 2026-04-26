import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Surface-Konvertisseur — SCB, SCP, ILNAS 101 Lëtzebuerg",
  description: "Ëmrechnung tëscht BGF, Geschossfläch, Notzfläch a Wunnfläch (ILNAS 101:2016). ACT-Gewiichtung fir Balkonen, Keller, Terrassen. OAI FC.04 Normen.",
  alternates: localizedAlternates("/convertisseur-surfaces", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
