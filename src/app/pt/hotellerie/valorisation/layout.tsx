import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata:Metadata={title:"Avaliação de um hotel no Luxemburgo: método | Tevaxia",description:"Capitalização direta de rendimento justificado e comparação de transações por quarto, com referências e pesos explícitos.",alternates:localizedAlternates("/hotellerie/valorisation","pt")};
export default function Layout({children}:{children:React.ReactNode}){return children;}
