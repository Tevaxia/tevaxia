import type { Metadata } from "next";
import { localizedAlternates } from "@/lib/seo";
export const metadata: Metadata = {title:"LENOZ in Luxembourg: Check Classification Thresholds",description:"Enter the achievement levels from your LENOZ file to check the thresholds published by the ministry. Does not replace the criteria assessment.",alternates:localizedAlternates("/energy/lenoz","en")};
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
