import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Communauté d'énergie au Luxembourg : simulateur | Tevaxia",
  description: "Partage électrique au Luxembourg : bilan distinct des consommateurs, du producteur et du collectif, sur hypothèses saisies. Sources ILR et limites explicites.",
  alternates: localizedAlternates("/energy/communaute", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
