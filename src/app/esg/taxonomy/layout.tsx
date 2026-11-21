import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Taxonomie UE 7.7 au Luxembourg : préparer le contrôle",description:"Acquisition et propriété de bâtiments : vérifiez les seuils de la Taxonomie UE 7.7 et rassemblez les justificatifs pour la revue de votre dossier.",alternates:localizedAlternates("/esg/taxonomy","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
