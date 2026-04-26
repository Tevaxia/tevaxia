import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Indice prix immobilier Luxembourg 2026 — Prix au m² commune",
  description:
    "Indice mensuel des prix immobiliers au Luxembourg en 2026. Prix moyen au m² par commune, tendances, top hausses et baisses, evolution du marche. Donnees Observatoire de l'Habitat.",
  keywords: [
    "indice prix immobilier Luxembourg 2026",
    "prix m2 Luxembourg",
    "tendance immobilier Luxembourg",
    "marche immobilier Luxembourg 2026",
    "prix communes Luxembourg",
  ],
  openGraph: {
    title: "Indice prix immobilier Luxembourg — Mars 2026",
    description:
      "Prix moyen au m² par commune, tendances et evolution du marche immobilier luxembourgeois. Mise a jour mensuelle.",
    url: "https://tevaxia.lu/indices",
    siteName: "tevaxia.lu",
    locale: "fr_LU",
    type: "article",
  },
  alternates: localizedAlternates("/indices", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
