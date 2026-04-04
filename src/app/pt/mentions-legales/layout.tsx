import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Legal Notice",
  description:
    "Legal notice for tevaxia.lu — Luxembourg real estate tools.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
