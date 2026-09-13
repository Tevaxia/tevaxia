import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/energy/renovation", "renovationAudit.title", "renovationAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
