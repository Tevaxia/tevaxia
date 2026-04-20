import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Timeline EPBD 2050 — Risque de stranding",
  description: "Directive européenne EPBD : échéances 2026-2050, risque de stranding par classe énergétique, impact sur la valeur immobilière au Luxembourg.",
  alternates: localizedAlternates("/energy/epbd", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
