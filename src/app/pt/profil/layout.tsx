import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "My Profile — Report Settings",
  description: "Customise your valuation reports: name, company, qualifications, legal notices.",
  alternates: localizedAlternates("/profil", "pt"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
