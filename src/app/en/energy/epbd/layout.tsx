import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("en", "/energy/epbd", "epbdAudit.title", "epbdAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
