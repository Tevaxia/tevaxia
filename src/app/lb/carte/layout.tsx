import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("lb", "/carte", "carte.title", "carte.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
