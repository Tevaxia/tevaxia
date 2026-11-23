import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Immobiliebewäertung zu Lëtzebuerg: Methoden a Szenarien",
  description: "Vergläicht dokumentéiert Verkeef, kapitaliséiert Erträg oder diskontéiert Cashflowen a wielt Gewiichter, déi bei Ären Dossier passen.",
  alternates: localizedAlternates("/valorisation", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
