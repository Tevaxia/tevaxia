import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Immobilienpreisindex in Luxemburg nach Gemeinde",description:"Nationale Eurostat-Reihe und kommunale Transaktionsmittelwerte des Observatoire de l’Habitat. Veröffentlichte Beobachtungen, keine Prognose.",alternates:localizedAlternates("/indices","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
