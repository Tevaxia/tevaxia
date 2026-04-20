import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Fonctionnalités — tevaxia.lu",
  description: "Découvrez toutes les fonctionnalités de tevaxia.lu : estimation, valorisation EVS, DCF, portfolio. Gratuit pendant la phase de lancement.",
  alternates: localizedAlternates("/pricing", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
