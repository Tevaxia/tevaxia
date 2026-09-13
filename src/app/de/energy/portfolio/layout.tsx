import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/energy/portfolio", "energy.portfolio.title", "energyPortfolioAudit.intro", true);

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
