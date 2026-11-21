import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Indice des prix immobiliers au Luxembourg par commune",description:"Série nationale Eurostat et moyennes de transactions par commune de l’Observatoire de l’Habitat. Observations publiées, sans prévision.",alternates:localizedAlternates("/indices","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
