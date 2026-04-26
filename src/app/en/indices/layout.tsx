import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Luxembourg Property Price Index 2026 — Price per m² by Commune",
  description:
    "Monthly Luxembourg property price index for 2026. Average price per m² by municipality, trends, top gainers and decliners, market evolution. Observatoire de l'Habitat data.",
  keywords: [
    "Luxembourg property price index 2026",
    "price per m2 Luxembourg",
    "Luxembourg real estate trends",
    "Luxembourg property market 2026",
    "Luxembourg municipality prices",
  ],
  openGraph: {
    title: "Luxembourg Property Price Index — March 2026",
    description:
      "Average price per m² by municipality, trends and evolution of the Luxembourg property market. Updated monthly.",
    url: "https://tevaxia.lu/en/indices",
    siteName: "tevaxia.lu",
    locale: "en",
    type: "article",
  },
  alternates: localizedAlternates("/indices", "en"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
