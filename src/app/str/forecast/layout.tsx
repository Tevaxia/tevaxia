import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Projection mensuelle des revenus Airbnb | Tevaxia",description:"Projetez mois par mois les revenus d’une location courte durée à partir de votre historique : Holt-Winters dès 24 mois, moyenne constante de 6 à 23 mois.",alternates:localizedAlternates("/str/forecast","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
