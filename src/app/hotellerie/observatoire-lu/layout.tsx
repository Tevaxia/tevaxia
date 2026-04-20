import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Observatoire hôtelier Luxembourg — Occupation, RevPAR, ADR public | tevaxia.lu",
  description:
    "Données publiques STATEC + Eurostat + STR EMEA : nuitées, occupation, RevPAR national par catégorie d'hôtel (1-2★ à 5★), saisonnalité, provenance des clients. Alternative gratuite aux panels payants STR Global / Horwath.",
  openGraph: {
    title: "Observatoire hôtelier LU — données publiques gratuites",
    description:
      "Occupation, RevPAR, ADR par catégorie. STATEC + Eurostat + STR EMEA.",
    type: "website",
  },
  alternates: localizedAlternates("/hotellerie/observatoire-lu", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
