import { editorialPageMetadata } from "@/lib/editorial-seo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Actions prioritaires</h1>
      {children}
    </>
  );
}

export const generateMetadata = () => editorialPageMetadata("/actions-prioritaires", true);
