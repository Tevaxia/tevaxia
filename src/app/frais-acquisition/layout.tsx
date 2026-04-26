import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Frais d'acquisition Luxembourg — Droits, Bëllegen Akt, TVA",
  description:
    "Calculez les frais d'acquisition immobilière au Luxembourg : droits d'enregistrement 7%, crédit Bëllegen Akt 40 000€, TVA 3% VEFA, émoluments notariaux, hypothèque.",
  alternates: localizedAlternates("/frais-acquisition", "fr"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
