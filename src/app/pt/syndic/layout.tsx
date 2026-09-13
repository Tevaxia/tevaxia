import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/syndic", "syndic.title", "syndic.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
