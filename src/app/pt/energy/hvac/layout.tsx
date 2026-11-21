import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Aquecimento no Luxemburgo: comparar necessidades e custos",description:"Compare dois cenários de aquecimento com as necessidades de calor, desempenhos sazonais, tarifas e orçamentos introduzidos. Valores iniciais ilustrativos.",alternates:localizedAlternates("/energy/hvac","pt")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
