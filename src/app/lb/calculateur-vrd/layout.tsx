import type {Metadata} from 'next';
import {localizedAlternates} from '@/lib/seo';
export const metadata:Metadata={title:"VRD-Budget zu Lëtzebuerg: Stroossen a Reseauen",description:"Berechent Stroossen- a Reseauaarbechte mat dokumentéierte Quantitéiten a Präisser mat TVA. Déi néng virgeschloe Lousen hëllefe bei der Glidderung, ouni integréiert Batiprix-, CTG- oder Creos-Tariffer. Gefäll, Buedem an Transportdistanze mussen an Ären Devisë berücksichtegt sinn; kee Koeffizient gëtt automatesch dobäigesat.",alternates:localizedAlternates('/calculateur-vrd',"lb")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
