import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/portfolio", "portfolio.title", "portfolio.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
