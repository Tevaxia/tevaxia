import type { Metadata } from "next";
import { SEO_BRANDING } from "@/lib/seo-branding";

const copy = SEO_BRANDING.pt;
export const metadata: Metadata = {
  title: { default: copy.title, template: "%s" },
  description: copy.description,
};

export default function LocaleLayout({ children }: { children: React.ReactNode }) { return children; }
