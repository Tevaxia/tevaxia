import { editorialPageMetadata } from "@/lib/editorial-seo";

// Portefeuille locatif = auth-gated, pas de valeur SEO publique.

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}

export const generateMetadata = () => editorialPageMetadata("/gestion-locative/portefeuille", true);
