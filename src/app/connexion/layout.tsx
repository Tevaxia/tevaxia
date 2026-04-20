import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Connexion — tevaxia.lu",
  description: "Connectez-vous pour sauvegarder vos évaluations immobilières dans le cloud.",
  alternates: localizedAlternates("/connexion", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
