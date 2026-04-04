import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Developer Feasibility Study Luxembourg — Residual Land Value",
  description:
    "Calculate the maximum land charge using the residual method. Sale price, construction costs, fees, developer margin. Tailored to the Luxembourg market.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
