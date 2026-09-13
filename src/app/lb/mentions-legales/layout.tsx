import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Impressum — Tevaxia",
  description: "Informatiounen iwwer den Editeur, de Kontakt, den Hosting an d’Notzung vun der Immobilieplattform Tevaxia.",
  alternates: localizedAlternates("/mentions-legales", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
