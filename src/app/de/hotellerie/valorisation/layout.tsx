import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Hotelbewertung in Luxemburg: Methode | Tevaxia",description:"Direkte Kapitalisierung belegter Erträge und Transaktionsvergleich je Zimmer mit expliziten Belegen und Gewichten.",alternates:localizedAlternates("/hotellerie/valorisation","de")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
