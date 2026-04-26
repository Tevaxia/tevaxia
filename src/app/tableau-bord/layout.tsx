import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tableau de bord",
  ...NOINDEX_METADATA,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Tableau de bord</h1>
      {children}
    </>
  );
}
