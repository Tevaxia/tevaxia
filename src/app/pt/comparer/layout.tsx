import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("pt", "/comparer", "comparer.title", "comparer.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
