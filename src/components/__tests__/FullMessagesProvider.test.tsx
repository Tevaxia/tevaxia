// @vitest-environment jsdom
import { act, useEffect, useState } from "react";
import { hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider, useTranslations } from "next-intl";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import FullMessagesProvider from "../FullMessagesProvider";
import type { Messages } from "@/i18n/load-messages";

const mocks = vi.hoisted(() => ({ loadMessages: vi.fn(), captureError: vi.fn() }));
vi.mock("@/i18n/load-messages", () => ({ loadMessages: mocks.loadMessages }));
vi.mock("@/lib/analytics", () => ({ captureError: mocks.captureError }));

function deferred() {
  let resolve!: (messages: Messages) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<Messages>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

let container: HTMLDivElement;
let root: Root | undefined;
const mounted = vi.fn();
const unmounted = vi.fn();
const recovered = vi.fn();
const messages = (title: string) => ({ form: { title } });

function Form() {
  const t = useTranslations("form");
  const [draft, setDraft] = useState("");
  useEffect(() => { mounted(); return () => { unmounted(); }; }, []);
  return <>
    <h1>{t("title")}</h1>
    <input aria-label="Draft" value={draft} onInput={event => setDraft(event.currentTarget.value)} />
    <output>{draft}</output>
  </>;
}

function tree(locale = "fr", title = "Initial") {
  return <NextIntlClientProvider locale={locale} messages={messages(title)} timeZone="UTC">
    <FullMessagesProvider locale={locale}><Form /></FullMessagesProvider>
  </NextIntlClientProvider>;
}

async function hydrate() {
  container.innerHTML = renderToString(tree());
  const serverInput = container.querySelector("input");
  await act(async () => { root = hydrateRoot(container, tree(), { onRecoverableError: recovered }); });
  expect(container.querySelector("input")).toBe(serverInput);
  return serverInput!;
}

async function typeDraft(input: HTMLInputElement) {
  input.focus();
  await act(async () => {
    input.value = "Unfinished draft";
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(container.querySelector("output")?.textContent).toBe("Unfinished draft");
}

beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(() => {
  vi.clearAllMocks();
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = undefined;
  container.remove();
});

it("preserves the hydrated DOM, form state and focus when the full bundle arrives", async () => {
  const full = deferred();
  mocks.loadMessages.mockReturnValue(full.promise);
  const input = await hydrate();
  await typeDraft(input);
  await act(async () => { full.resolve(messages("Complete")); });

  expect(container.querySelector("h1")?.textContent).toBe("Complete");
  expect(container.querySelector("input")).toBe(input);
  expect(input.value).toBe("Unfinished draft");
  expect(container.querySelector("output")?.textContent).toBe("Unfinished draft");
  expect(document.activeElement).toBe(input);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(unmounted).not.toHaveBeenCalled();
  expect(recovered).not.toHaveBeenCalled();
});

it("keeps inherited translations and the draft if the chunk fails, reporting only a fixed error", async () => {
  const full = deferred();
  mocks.loadMessages.mockReturnValue(full.promise);
  const input = await hydrate();
  await typeDraft(input);
  await act(async () => { full.reject(new Error("https://private.example/SECRET?token=SECRET")); });

  expect(container.querySelector("h1")?.textContent).toBe("Initial");
  expect(container.querySelector("input")).toBe(input);
  expect(input.value).toBe("Unfinished draft");
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(mocks.captureError).toHaveBeenCalledTimes(1);
  const reported = mocks.captureError.mock.calls[0][0] as Error;
  expect(reported.message).toBe("Locale message bundle failed to load");
  expect(reported.cause).toBeUndefined();
  expect(recovered).not.toHaveBeenCalled();
});

it("ignores a previous locale's late response", async () => {
  const french = deferred(), german = deferred();
  mocks.loadMessages.mockImplementation((locale: string) => locale === "fr" ? french.promise : german.promise);
  await hydrate();
  await act(async () => { root!.render(tree("de", "Deutsch initial")); });
  await act(async () => { german.resolve(messages("Deutsch complete")); });
  await act(async () => { french.resolve(messages("Français obsolete")); });
  expect(container.querySelector("h1")?.textContent).toBe("Deutsch complete");
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(recovered).not.toHaveBeenCalled();
});

it("uses the new locale's inherited messages while its full bundle is pending", async () => {
  const french = deferred(), german = deferred();
  mocks.loadMessages.mockImplementation((locale: string) => locale === "fr" ? french.promise : german.promise);
  await hydrate();
  await act(async () => { french.resolve(messages("Français complete")); });
  await act(async () => { root!.render(tree("de", "Deutsch initial")); });
  expect(container.querySelector("h1")?.textContent).toBe("Deutsch initial");
  await act(async () => { german.resolve(messages("Deutsch complete")); });
  expect(container.querySelector("h1")?.textContent).toBe("Deutsch complete");
  expect(mounted).toHaveBeenCalledTimes(1);
});
