import type {Metadata} from "next";
import {localizedAlternates} from "@/lib/seo";
export const metadata:Metadata={title:"Property Price Index in Luxembourg by Municipality",description:"Eurostat national series and municipal transaction averages from the Housing Observatory. Published observations, no forecast.",alternates:localizedAlternates("/indices","en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
