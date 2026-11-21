import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "EPBD au Luxembourg : objectifs européens et application",
  description: "Repères EPBD pour le résidentiel, le non-résidentiel et les constructions neuves. Objectifs européens, textes nationaux à vérifier et sources officielles.",
  alternates: localizedAlternates("/energy/epbd", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
