import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Seitenübersicht — tevaxia.lu",
  description: "Seitenübersicht von tevaxia.lu: alle Immobilientools, Energiesimulatoren, Marktdaten und rechtliche Seiten für Luxemburg.",
  alternates: localizedAlternates("/plan-du-site", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
