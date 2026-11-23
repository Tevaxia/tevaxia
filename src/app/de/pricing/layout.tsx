import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Preise von tevaxia.lu: kostenlos in der Startphase",
  description: "Preise von tevaxia.lu: frei zugängliche Rechner, kostenloses Konto, Pro-Angebot in der Startphase kostenlos. Immobilienwerkzeuge für Luxemburg.",
  alternates: localizedAlternates("/pricing", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
