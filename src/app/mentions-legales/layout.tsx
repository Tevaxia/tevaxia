import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site tevaxia.lu — outils immobiliers Luxembourg.",
  alternates: localizedAlternates("/mentions-legales", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
