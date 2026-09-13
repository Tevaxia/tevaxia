import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("lb", "/outils-bancaires", "outilsBancaires.title", "outilsBancaires.subtitle");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
