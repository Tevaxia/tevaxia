import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("lb", "/energy/impact", "energyImpactAudit.title", "energyImpactAudit.description");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
