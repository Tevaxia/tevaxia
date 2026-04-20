import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Bail commercial Luxembourg — IPC, pas-de-porte, coût total | tevaxia.lu",
  description:
    "Calculateur de bail commercial LU : indexation IPC/STATEC, révision triennale, pas-de-porte, coût total locataire + bailleur. Conforme loi du 3 février 2018 sur le bail commercial.",
  openGraph: {
    title: "Bail commercial Luxembourg",
    description:
      "Indexation IPC, pas-de-porte, coût total. Loi 03/02/2018.",
    type: "website",
  },
  alternates: localizedAlternates("/bail-commercial", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
