import { editorialPageMetadata } from "@/lib/editorial-seo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Performance agence</h1>
      {children}
    </>
  );
}

export const generateMetadata = () => editorialPageMetadata("/pro-agences/performance", true);
