import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Baukäschten zu Lëtzebuerg: dokumentéierte Budget",description:"Stellt e Budget aus Ären Devisen a benannten Hypotheesen op. Gitt all Präisser mat TVA an Euro an. Et gëtt keen Tarif, Honorar oder Energieopschlag ugeholl.",alternates:localizedAlternates('/estimateur-construction',"lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
