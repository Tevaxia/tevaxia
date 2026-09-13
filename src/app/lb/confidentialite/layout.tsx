import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Dateschutzerklärung — Tevaxia",
  description: "Informatiounen iwwer d’Veraarbechtung vu perséinlechen Donnéeën, Cookien an Är Dateschutzrechter bei Tevaxia.",
  alternates: localizedAlternates("/confidentialite", "lb"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
