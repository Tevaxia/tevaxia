import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Índice de preços imobiliários no Luxemburgo por município",description:"Série nacional do Eurostat e médias de transações por município do Observatório da Habitação. Observações publicadas, sem previsão.",alternates:localizedAlternates("/indices","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
