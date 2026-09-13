import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Funktiounen an Tariffer — Tevaxia",
  description: "Entdeckt d’Immobilienrechner, Rapporten a Gestiounsfunktioune vun Tevaxia souwéi déi verfügbar Offeren.",
  alternates: localizedAlternates("/pricing", "lb"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
