import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Comparatif hôtelier : ADR, occupation, RevPAR | Tevaxia",description:"Comparez des observations hôtelières documentées sur une période commune de 1 à 366 jours. Aucune donnée STR ou Horwath n’est préremplie.",alternates:localizedAlternates("/hotellerie/compset","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
