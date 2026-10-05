export type Messages = Record<string, unknown>;

// Keep each locale in its own cached client chunk, outside the initial HTML.
export async function loadMessages(locale: string): Promise<Messages> {
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
