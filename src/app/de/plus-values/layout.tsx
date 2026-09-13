import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("de", "/plus-values", "plusValuesAudit.title", "plusValuesAudit.scope");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
