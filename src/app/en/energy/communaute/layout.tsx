import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("en", "/energy/communaute", "energySharingAudit.title", "energySharingAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
