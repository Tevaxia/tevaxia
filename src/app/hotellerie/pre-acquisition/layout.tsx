import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Pré-acquisition d'un hôtel : analyse de trésorerie | Tevaxia",description:"Analyse de trésorerie d’un projet d’acquisition hôtelière. Aucun prix de marché, multiple ou score d’achat n’est présumé : chaque montant est à justifier.",alternates:localizedAlternates("/hotellerie/pre-acquisition","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
