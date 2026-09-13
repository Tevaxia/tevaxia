import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/energy/renovation", "renovationAudit.title", "renovationAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
