import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "Features — tevaxia.lu",
  description: "Discover all tevaxia.lu features: instant valuation, EVS valuation, DCF, portfolio. Free during the launch phase.",
  alternates: localizedAlternates("/pricing", "en"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
