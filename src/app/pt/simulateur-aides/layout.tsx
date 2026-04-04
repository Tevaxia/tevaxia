import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxembourg Housing Aid Simulator — Bellegen Akt, Klimabonus",
  description:
    "Simulate all housing aids in Luxembourg: Bellegen Akt, accession bonus, interest subsidy, State guarantee, Klimabonus, municipal aids. 5 cumulative aid layers.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
