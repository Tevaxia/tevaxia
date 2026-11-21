import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Baukosten in Luxemburg: dokumentiertes Budget",description:"Erstellen Sie ein Baubudget in Luxemburg aus Ihren Angeboten und Annahmen. Bruttopreise in Euro; kein Tarif und kein Honorar wird unterstellt.",alternates:localizedAlternates('/estimateur-construction',"de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
