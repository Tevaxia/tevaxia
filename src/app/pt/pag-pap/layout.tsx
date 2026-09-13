import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/pag-pap", "pagPap.title", "pagPap.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
