import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Orçamento de infraestruturas no Luxemburgo: vias e redes",description:"Orçamente as obras de vias e redes de um projeto no Luxemburgo com as suas quantidades e preços com IVA documentados. Nove lotes, sem tarifas presumidas.",alternates:localizedAlternates('/calculateur-vrd',"pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
