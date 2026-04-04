import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Estimateur de classe CPE",
  description: "Estimez votre classe énergétique (passeport énergétique) en 6 questions. Outil gratuit pour l'immobilier au Luxembourg.",
  alternates: { canonical: "https://energy.tevaxia.lu/estimateur-cpe" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
