import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Säiteplang — tevaxia.lu",
  description: "Säiteplang vun tevaxia.lu: all Immobilietools, Energiesimulatoren, Maartdaten a rechtlech Säite fir Lëtzebuerg.",
  alternates: localizedAlternates("/plan-du-site", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
