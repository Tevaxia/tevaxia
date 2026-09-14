import { editorialPageMetadata } from "@/lib/editorial-seo";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Relances locatives</h1>
      {children}
    </>
  );
}

export const generateMetadata = () => editorialPageMetadata("/gestion-locative/relances", true);
