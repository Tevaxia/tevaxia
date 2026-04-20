import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Impact CPE sur la valeur immobilière",
  description: "Quantifiez le green premium et le brown discount par classe énergie (A-I) au Luxembourg. Tableau comparatif, méthodologie et sources.",
  alternates: localizedAlternates("/energy/impact", "fr"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
