import type { Metadata } from "next";
import { NOINDEX_METADATA } from "@/lib/seo";
import CrmTopNav from "@/components/crm/CrmTopNav";

export const metadata: Metadata = {
  title: "CRM agence immobilière",
  ...NOINDEX_METADATA,
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">CRM agence immobilière</h1>
      <CrmTopNav />
      {children}
    </>
  );
}
