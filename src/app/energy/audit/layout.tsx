import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Audit énergétique Luxembourg — 20 questions + plan Klimabonus",
  description:
    "Questionnaire 20 questions pour diagnostiquer votre bien et obtenir un plan de rénovation priorisé avec les aides Klimabonus applicables (toiture, façade, PAC, VMC, ECS, PV). Classe énergie estimée A-G + totaux coûts et subventions.",
  openGraph: {
    title: "Audit énergétique Luxembourg — 20 questions",
    description:
      "Diagnostic rapide + plan de rénovation priorisé avec aides Klimabonus applicables (jusqu'à 75 %).",
    type: "website",
  },
  alternates: localizedAlternates("/energy/audit", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
