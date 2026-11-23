import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ zu Lëtzebuerg: Klasséierungsschwelle préiwen",description:"Gitt d’Erfëllungsgrade vun Ärem komplette LENOZ-Dossier an, fir déi publizéiert Schwelle vum Ministère ze préiwen. Dës Säit ersetzt net d’Bewäertung vun de Kritären duerch den Expert.",alternates:localizedAlternates("/energy/lenoz","lb")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
