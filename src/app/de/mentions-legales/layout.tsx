import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Legal Notice",
  description:
    "Legal notice for tevaxia.lu — Luxembourg real estate tools.",
  alternates: localizedAlternates("/mentions-legales", "de"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
