import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "tevaxia.lu Pricing: Free During the Launch Phase",
  description: "tevaxia.lu pricing: open-access calculators, free account, Pro plan free during launch. Real estate tools for Luxembourg.",
  alternates: localizedAlternates("/pricing", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
