import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// Pages auth-gated sans valeur SEO publique (les hubs marketing sont sur /hotellerie).
export const metadata: Metadata = NOINDEX_METADATA;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
