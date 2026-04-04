import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "My Profile — Report Settings",
  description: "Customise your valuation reports: name, company, qualifications, legal notices.",
};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
