import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Präisser vun tevaxia.lu: gratis an der Startphas",
  description: "Präisser vun tevaxia.lu: fräi zougänglech Rechner, gratis Kont, Pro-Offer gratis an der Startphas. Immobilien-Tools fir Lëtzebuerg.",
  alternates: localizedAlternates("/pricing", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
