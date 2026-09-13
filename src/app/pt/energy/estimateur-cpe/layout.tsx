import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/energy/estimateur-cpe", "cpePreparationAudit.title", "cpePreparationAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
