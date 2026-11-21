import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Custos de construção no Luxemburgo: orçamento documentado",description:"Construa um orçamento de construção no Luxemburgo a partir dos seus orçamentos e hipóteses. Preços com IVA em euros; nenhuma tarifa é presumida.",alternates:localizedAlternates('/estimateur-construction',"pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
