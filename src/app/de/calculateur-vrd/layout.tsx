import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Erschließungskosten in Luxemburg: Straßen und Leitungen",description:"Kalkulieren Sie Straßen- und Leitungsarbeiten eines Projekts in Luxemburg mit Ihren belegten Mengen und Bruttopreisen. Neun Lose, keine unterstellten Tarife.",alternates:localizedAlternates('/calculateur-vrd',"de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
