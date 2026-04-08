import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Seitenübersicht — tevaxia.lu",
  description: "Seitenübersicht von tevaxia.lu: alle Immobilientools, Energiesimulatoren, Marktdaten und rechtliche Seiten für Luxemburg.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
