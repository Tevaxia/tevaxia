import { editorialPageMetadata } from "@/lib/editorial-seo";

import { TransparenceClient } from "./client";

export default function TransparencePage() {
  return <TransparenceClient />;
}

export const generateMetadata = () => editorialPageMetadata("/transparence");
