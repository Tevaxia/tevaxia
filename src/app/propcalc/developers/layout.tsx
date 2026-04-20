import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc Developers — Widget, API REST, npm, Chrome, Google Sheets",
  description: "Intégrez les calculs immobiliers multi-pays dans vos projets. Widget embeddable, API REST, package npm, extension Chrome, add-on Google Sheets.",
  alternates: localizedAlternates("/propcalc/developers", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
