import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Transactions hôtelières publiées en Europe | Tevaxia",description:"Sélection limitée d’opérations hôtelières tirées de communiqués des parties, vérifiés le 9 septembre 2026. Chaque montant garde son périmètre publié.",alternates:localizedAlternates("/hotellerie/transactions","fr")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
