"use client";

import { NextIntlClientProvider, useMessages } from "next-intl";
import { startTransition, useEffect, useState } from "react";
import { loadMessages, type Messages } from "@/i18n/load-messages";
import { captureError } from "@/lib/analytics";

/**
 * Loads the COMPLETE message bundle for the active locale on the client, once,
 * after the first paint, then re-provides it so client-side navigation always
 * has every namespace available.
 *
 * Why this exists: the per-route namespace optimization lives in the root
 * layout, which never re-renders on in-app navigation. Without this, navigating
 * (e.g.) home -> /vefa kept the home namespace set and showed raw keys
 * (vefa.title, …). See src/app/layout.tsx.
 *
 * Keep the same provider from SSR onwards, initially using the inherited
 * per-route messages. Inserting a provider only after the import resolves
 * remounts the entire page, losing form state and tearing down its boundaries.
 * The extra bundle is fetched lazily and cached across subsequent navigation.
 */
export default function FullMessagesProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const inheritedMessages = useMessages();
  const [loaded, setLoaded] = useState<{ locale: string; messages: Messages } | null>(null);

  useEffect(() => {
    let active = true;
    loadMessages(locale).then(
      (messages) => {
        if (active) startTransition(() => setLoaded({ locale, messages }));
      },
      () => {
        // Keep the current page usable; never log the import's URL or payload.
        if (active) captureError(new Error("Locale message bundle failed to load"));
      },
    );
    return () => {
      active = false;
    };
  }, [locale]);

  return (
    <NextIntlClientProvider
      locale={locale}
      messages={loaded?.locale === locale ? loaded.messages : inheritedMessages}
    >
      {children}
    </NextIntlClientProvider>
  );
}
