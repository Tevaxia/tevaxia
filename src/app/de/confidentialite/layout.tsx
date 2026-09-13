import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Datenschutzerklärung — Tevaxia",
  description: "Informationen zur Verarbeitung personenbezogener Daten, zu Cookies und zu Ihren Datenschutzrechten bei Tevaxia.",
  alternates: localizedAlternates("/confidentialite", "de"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
