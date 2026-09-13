import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("lb", "/aml-kyc", "amlKyc.title", "amlKyc.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) { return children; }
