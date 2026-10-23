import { expect, it } from "vitest";
import { pickNamespaces } from "@/i18n/pick-namespaces";
import messages from "@/messages/fr.json";

it("keeps the offline shell's initial translations small instead of falling back to the full catalog", () => {
  const picked = pickNamespaces(messages, "/offline");
  expect(picked.nav).toBe(messages.nav);
  expect(picked.common).toBe(messages.common);
  expect(Object.keys(picked).length).toBeLessThan(20);
  expect(JSON.stringify(picked).length).toBeLessThan(JSON.stringify(messages).length / 4);
});

it("includes interactive number messages in surface conversion's initial payload", () => {
  expect(pickNamespaces(messages, "/en/convertisseur-surfaces").numberInput).toBe(messages.numberInput);
});

it("includes calendar instructions in its initial payload", () => {
  expect(pickNamespaces(messages, "/de/profil/calendrier").calendarSync).toBe(messages.calendarSync);
});
