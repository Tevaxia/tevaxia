import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Prévisionnel STR Luxembourg — Holt-Winters occupation + ADR",
  description:
    "Modèle Holt-Winters avec saisonnalité annuelle appliqué à vos données mensuelles Airbnb/Booking. Prévision 6-24 mois d'occupation, ADR, revenu avec intervalles de confiance 95 %. Import CSV PMS, export complet.",
  openGraph: {
    title: "Prévisionnel STR Luxembourg 12 mois — Holt-Winters",
    description:
      "Projection 6-24 mois occupation/ADR/revenu avec IC 95 %. Import CSV PMS.",
    type: "website",
  },
  alternates: localizedAlternates("/str/forecast", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
