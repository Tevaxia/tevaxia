import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Tâches CRM",
  ...NOINDEX_METADATA,
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Tâches CRM</h1>
      {children}
    </>
  );
}
