import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Real Estate Banking Tools Luxembourg — LTV, Borrowing Capacity, DSCR",
  description:
    "Banking tools for real estate lending in Luxembourg: loan-to-value ratio (LTV), borrowing capacity, amortisation schedules, debt service coverage ratio (DSCR).",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
