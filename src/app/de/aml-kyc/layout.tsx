import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Real Estate AML / KYC Tools Luxembourg",
  description: "AML/KYC checklist for real estate transactions in Luxembourg. AML/CTF obligations, client identification, suspicious activity reporting, politically exposed persons.",
  alternates: localizedAlternates("/aml-kyc", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
