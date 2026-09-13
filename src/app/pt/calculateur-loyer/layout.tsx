import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/calculateur-loyer", "calculLoyer.title", "calculLoyer.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
