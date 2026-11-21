import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Trajectoires CRREM au Luxembourg : énergie et carbone",description:"Calculez des intensités énergie et carbone à partir d’un bilan documenté, puis comparez année par année votre bâtiment à une trajectoire de référence.",alternates:localizedAlternates("/esg/crrem-pathways","fr")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
