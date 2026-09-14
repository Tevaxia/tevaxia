import { editorialPageMetadata } from "@/lib/editorial-seo";
export default function Layout({ children }: { children: React.ReactNode }) { return children; }

export const generateMetadata = () => editorialPageMetadata("/str/rentabilite");
