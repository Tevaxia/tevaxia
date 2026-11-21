import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Préparer une étude énergétique au Luxembourg | Tevaxia",description:"20 questions pour préparer un rendez-vous avec un professionnel de l’énergie au Luxembourg. Le questionnaire ne calcule pas la performance du bâtiment.",openGraph:{title:"Préparer une étude énergétique au Luxembourg | Tevaxia",description:"20 questions pour préparer un rendez-vous avec un professionnel de l’énergie au Luxembourg. Le questionnaire ne calcule pas la performance du bâtiment.",type:"website"},alternates:localizedAlternates("/energy/audit","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
