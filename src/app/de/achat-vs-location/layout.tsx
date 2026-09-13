import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/achat-vs-location", "achatLocation.title", "achatLocation.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
