import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {
  title: "PAG / PAP Analysis Luxembourg — Urban Planning & Buildability",
  description: "PAG zoning, PAP New District and Existing District, COS, CMU, CTV/CTL easements, permit procedures. Luxembourg urban planning guide.",
  alternates: localizedAlternates("/pag-pap", "de"),
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
