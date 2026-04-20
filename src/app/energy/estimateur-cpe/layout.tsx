import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Estimateur de classe CPE",
  description: "Estimez votre classe énergétique (passeport énergétique) en 6 questions. Outil gratuit pour l'immobilier au Luxembourg.",
  alternates: localizedAlternates("/energy/estimateur-cpe", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
