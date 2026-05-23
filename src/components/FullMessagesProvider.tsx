"use client";

import { NextIntlClientProvider } from "next-intl";
import { useEffect, useState } from "react";

type Messages = Record<string, unknown>;

// Dynamic import keeps each locale in its own chunk (only the active one loads),
// and because the JSON is imported from a client module it ships as a single
// cached JS chunk — NOT re-inlined into every page's HTML.
async function loadMessages(locale: string): Promise<Messages> {
  switch (locale) {
    case "en":
      return (await import("@/messages/en.json")).default as Messages;
    case "de":
      return (await import("@/messages/de.json")).default as Messages;
    case "pt":
      return (await import("@/messages/pt.json")).default as Messages;
    case "lb":
      return (await import("@/messages/lb.json")).default as Messages;
    default:
      return (await import("@/messages/fr.json")).default as Messages;
  }
}

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
 * Until the bundle resolves we render children unchanged, so they fall back to
 * the per-route messages the server already inlined — the directly loaded page
 * is therefore always correct with zero flash. The extra bundle is fetched
 * lazily (non render-blocking) and cached across every subsequent navigation.
 */
export default function FullMessagesProvider({
  locale,
  children,
}: {
  locale: string;
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<Messages | null>(null);

  useEffect(() => {
    let active = true;
    loadMessages(locale).then((m) => {
      if (active) setMessages(m);
    });
    return () => {
      active = false;
    };
  }, [locale]);

  if (!messages) return <>{children}</>;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
