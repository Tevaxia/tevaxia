import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";



export const metadata: Metadata = {
  title: {
    default: "Tevaxia Energy — Energy Simulators Luxembourg Real Estate",
    template: "%s | Tevaxia Energy",
  },
  description:
    "Energy performance simulators for Luxembourg real estate. Energy class impact on value, renovation ROI, energy communities.",
  alternates: localizedAlternates("/energy", "lb"),
};

export default function EnEnergyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
