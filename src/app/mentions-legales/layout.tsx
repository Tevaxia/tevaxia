import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales",
  description:
    "Mentions légales du site tevaxia.lu — outils immobiliers Luxembourg.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
