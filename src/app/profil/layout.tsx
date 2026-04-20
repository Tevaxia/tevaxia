import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Mon profil — Paramètres de rapport",
  description: "Personnalisez vos rapports de valorisation : nom, société, qualifications, mentions légales.",
  alternates: localizedAlternates("/profil", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
