import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/aml-kyc", "amlKyc.title", "amlKyc.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
