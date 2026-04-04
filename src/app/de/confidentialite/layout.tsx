import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — GDPR",
  description:
    "Privacy policy and personal data protection for tevaxia.lu. Compliant with the GDPR and Luxembourg law of 1 August 2018.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
