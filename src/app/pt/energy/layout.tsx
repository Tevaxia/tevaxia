import type { Metadata } from "next";
import EnergyHeader from "@/components/energy/EnergyHeader";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: {
    default: "Tevaxia Energy — Energy Simulators Luxembourg Real Estate",
    template: "%s | Tevaxia Energy",
  },
  description:
    "Energy performance simulators for Luxembourg real estate. Energy class impact on value, renovation ROI, energy communities.",
};

export default function EnEnergyLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <EnergyHeader />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
