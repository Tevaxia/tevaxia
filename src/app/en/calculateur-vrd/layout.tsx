import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"Roads and Utilities Budget in Luxembourg (VRD)",description:"Price road and utility works for a project in Luxembourg from your documented quantities and VAT-inclusive prices. Nine lots, no assumed rates.",alternates:localizedAlternates('/calculateur-vrd',"en")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
