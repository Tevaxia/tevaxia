import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Mes évaluations — Historique sauvegardé",
  description: "Retrouvez vos évaluations immobilières sauvegardées. Historique local, restauration et gestion.",
  alternates: localizedAlternates("/mes-evaluations", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
