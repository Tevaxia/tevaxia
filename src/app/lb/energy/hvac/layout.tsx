import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Heizung zu Lëtzebuerg: Besoin, Offeren a Käschte vergläichen",description:"Vergläicht zwee Szenarie mat aginnene Wärmebesoinen, saisonaler Leeschtung, Präisser an Devisen. Déi initial Wäerter erklären d’Method; si si weder Miesswäerter vun Ärem Bien nach kommerziell Offeren.",alternates:localizedAlternates("/energy/hvac","lb")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
