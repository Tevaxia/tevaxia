import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"Heating in Luxembourg: Compare Needs, Quotes and Costs",description:"Compare two heating scenarios from entered heat needs, seasonal performance, tariffs and quotes. Initial values are illustrative.",alternates:localizedAlternates("/energy/hvac","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
