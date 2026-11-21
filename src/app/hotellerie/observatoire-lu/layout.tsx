import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Fréquentation hôtelière au Luxembourg — Eurostat | Tevaxia",description:"Fréquentation hôtelière au Luxembourg : séries mensuelles officielles Eurostat (NACE I55.1), résidents et non-résidents. Données nationales uniquement.",alternates:localizedAlternates("/hotellerie/observatoire-lu","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
