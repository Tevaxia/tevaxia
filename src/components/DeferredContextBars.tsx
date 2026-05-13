"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";

// ModuleContextBar uses useSearchParams() and returns null unless the
// current path is a module sub-route or carries ?from=<module>. On the
// home and most other pages, the 4 bars are silent. Loading them via
// next/dynamic with ssr: false keeps their JS out of the initial bundle
// and only ships it after hydration.
const ModuleContextBar = dynamic(() => import("@/components/ModuleContextBar"), { ssr: false });

export default function DeferredContextBars() {
  return (
    <Suspense fallback={null}>
      <ModuleContextBar moduleKey="syndic" />
      <ModuleContextBar moduleKey="pms" />
      <ModuleContextBar moduleKey="crm" />
      <ModuleContextBar moduleKey="hotellerie" />
    </Suspense>
  );
}
