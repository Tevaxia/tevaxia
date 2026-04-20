import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// Portefeuille locatif = auth-gated, pas de valeur SEO publique.
export const metadata: Metadata = NOINDEX_METADATA;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
