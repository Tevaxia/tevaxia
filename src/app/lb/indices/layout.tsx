import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Immobiliepräisindex zu Lëtzebuerg no Gemeng | Tevaxia",description:"National Eurostat-Serie a kommunal Transaktiounsmëttel vum Observatoire de l’Habitat. Den Ënnerscheed tëscht annoncéierten a registréierte Präisser ass weder en Zäittrend, en verhandelbare Rabatt nach eng Mooss fir d’Gesondheet vum Maart.",alternates:localizedAlternates("/indices","lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
