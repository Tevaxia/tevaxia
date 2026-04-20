import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

// Pages lot individuelles (création + édition + sous-pages) = auth-gated.
export const metadata: Metadata = NOINDEX_METADATA;

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
