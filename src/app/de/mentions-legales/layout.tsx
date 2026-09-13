import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Impressum — Tevaxia",
  description: "Angaben zum Herausgeber, Kontakt, Hosting und Nutzungsrahmen der Immobilienplattform Tevaxia.",
  alternates: localizedAlternates("/mentions-legales", "de"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
