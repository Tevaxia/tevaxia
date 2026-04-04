import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Luxembourg Property Acquisition Fees — Registration Duties, Bellegen Akt, VAT",
  description:
    "Calculate property acquisition fees in Luxembourg: 7% registration duties, Bellegen Akt tax credit of 40,000 EUR, 3% VAT for off-plan (VEFA), notary fees, mortgage costs.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
