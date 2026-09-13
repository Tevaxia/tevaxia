import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Política de privacidade — Tevaxia",
  description: "Informações sobre o tratamento de dados pessoais, cookies e os seus direitos de privacidade na Tevaxia.",
  alternates: localizedAlternates("/confidentialite", "pt"),
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
