import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Avisos legais — Tevaxia",
  description: "Informações sobre o editor, contactos, alojamento e condições de utilização da plataforma imobiliária Tevaxia.",
  alternates: localizedAlternates("/mentions-legales", "pt"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
