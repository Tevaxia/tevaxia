import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Groupe hôtelier",
  ...NOINDEX_METADATA,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Groupe hôtelier</h1>
      {children}
    </>
  );
}
