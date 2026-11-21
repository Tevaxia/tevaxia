import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Chauffage au Luxembourg : comparer besoins, devis, coûts",description:"Comparez deux scénarios de chauffage à partir de besoins de chaleur, performances saisonnières, tarifs et devis renseignés. Valeurs initiales illustratives.",alternates:localizedAlternates("/energy/hvac","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
