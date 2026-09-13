import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/estimation", "estimation.title", "estimation.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
