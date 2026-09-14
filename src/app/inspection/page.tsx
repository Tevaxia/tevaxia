import { editorialPageMetadata } from "@/lib/editorial-seo";

import { InspectionClient } from "./client";

export default function InspectionPage() {
  return <InspectionClient />;
}

export const generateMetadata = () => editorialPageMetadata("/inspection");
