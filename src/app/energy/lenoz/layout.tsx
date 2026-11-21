import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ au Luxembourg : vérifier les seuils de classement",description:"Renseignez les degrés de réalisation de votre dossier LENOZ pour vérifier les seuils publiés par le ministère. Ne remplace pas l’évaluation des critères.",alternates:localizedAlternates("/energy/lenoz","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
