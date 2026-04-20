import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "My Valuations — Saved History",
  description: "View your saved property valuations. Local history, restore and manage.",
  alternates: localizedAlternates("/mes-evaluations", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
