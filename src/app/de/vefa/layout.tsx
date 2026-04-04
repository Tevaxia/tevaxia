import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxembourg VEFA Calculator — Off-Plan Payment Schedule, 3% VAT, Completion Guarantee",
  description:
    "Calculate your off-plan (VEFA) property purchase in Luxembourg: milestone-based payment schedule, 3% reduced VAT for primary residence (max EUR 50,000 benefit), land registration duties, completion guarantee, notary fees.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
