import type { Metadata } from "next";
import { InspectionClient } from "./client";

export const metadata: Metadata = {
  title: "Inspection terrain TEGOVA EVS 2025",
  description:
    "Application d'inspection terrain conforme aux standards TEGOVA EVS 2025. Checklist, relevé photos, état descriptif et rapport exportable.",
};

export default function InspectionPage() {
  return <InspectionClient />;
}
