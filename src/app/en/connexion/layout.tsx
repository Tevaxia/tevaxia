import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Sign In — tevaxia.lu",
  description: "Sign in to save your property valuations in the cloud.",
  alternates: localizedAlternates("/connexion", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
