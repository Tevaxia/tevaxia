import { translatedPageMetadata } from "@/lib/seo-metadata";

export const generateMetadata = () => translatedPageMetadata("lb", "/simulateur-aides", "aidesAudit.title", "aidesAudit.intro");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
