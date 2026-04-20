import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "DCF multi-locataires — Valorisation bail par bail",
  description: "Modélisation DCF multi-locataires : chaque bail modélisé individuellement (loyer, indexation, break, renouvellement, franchise). WAULT, taux d'occupation, TRI.",
  alternates: localizedAlternates("/dcf-multi", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
