import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Construction Costs in Luxembourg: Documented Budget",description:"Build a construction budget in Luxembourg from your quotes and assumptions. VAT-inclusive prices in euros; no rate or fee is assumed.",alternates:localizedAlternates('/estimateur-construction',"en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
