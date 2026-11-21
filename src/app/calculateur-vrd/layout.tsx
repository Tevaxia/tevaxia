import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Budget VRD au Luxembourg : voirie et réseaux divers",description:"Chiffrez les travaux de voirie et réseaux d’un projet au Luxembourg à partir de vos quantités et prix TTC documentés. Neuf lots, aucun tarif présumé.",alternates:localizedAlternates('/calculateur-vrd',"fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
