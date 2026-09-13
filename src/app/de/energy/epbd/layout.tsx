import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/energy/epbd", "epbdAudit.title", "epbdAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
