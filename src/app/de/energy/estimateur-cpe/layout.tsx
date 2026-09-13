import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/energy/estimateur-cpe", "cpePreparationAudit.title", "cpePreparationAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
