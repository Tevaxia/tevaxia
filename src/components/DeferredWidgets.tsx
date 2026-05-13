"use client";

import dynamic from "next/dynamic";

// AiChatWidget + BackupReminderToast both return null until the user
// is signed in, so the JS has no value for anonymous visitors. We load
// them via next/dynamic with ssr: false, which means: separate chunk +
// no SSR + only fetched after hydration. Bundle savings on the home
// page (no auth) and SEO-only crawlers.
const AiChatWidget = dynamic(() => import("@/components/AiChatWidget"), { ssr: false });
const BackupReminderToast = dynamic(() => import("@/components/BackupReminderToast"), { ssr: false });

export default function DeferredWidgets() {
  return (
    <>
      <AiChatWidget />
      <BackupReminderToast />
    </>
  );
}
