import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Coût de construction au Luxembourg : budget documenté",description:"Construisez un budget de construction au Luxembourg à partir de vos devis et hypothèses. Prix TTC en euros ; aucun tarif ni honoraire n’est présumé.",alternates:localizedAlternates('/estimateur-construction',"fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
