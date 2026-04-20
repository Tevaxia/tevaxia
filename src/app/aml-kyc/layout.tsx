import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Outils AML / KYC immobilier Luxembourg",
  description: "Checklist AML/KYC pour les transactions immobilières au Luxembourg. Obligations LCB-FT, identification client, déclaration de soupçon, personnes politiquement exposées.",
  alternates: localizedAlternates("/aml-kyc", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
