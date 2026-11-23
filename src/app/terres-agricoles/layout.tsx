import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Prix des terres agricoles au Luxembourg : calcul",
  description: "Terres agricoles au Luxembourg : calcul avec prix et coûts documentés, conversion hectare/m² et série nationale publiée par le SER.",
  alternates: localizedAlternates("/terres-agricoles", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
