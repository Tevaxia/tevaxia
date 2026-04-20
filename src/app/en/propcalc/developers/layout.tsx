import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PropCalc Developers — Widget, REST API, npm, Chrome, Google Sheets",
  description: "Integrate multi-country real estate calculations into your projects. Embeddable widget, REST API, npm package, Chrome extension, Google Sheets add-on.",
  alternates: localizedAlternates("/propcalc/developers", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
