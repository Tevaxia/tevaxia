import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/estimation", "estimation.title", "estimation.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
