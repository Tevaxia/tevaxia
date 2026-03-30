import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — RGPD",
  description:
    "Politique de confidentialité et protection des données personnelles de tevaxia.lu. Conforme RGPD et loi luxembourgeoise du 1er août 2018.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
