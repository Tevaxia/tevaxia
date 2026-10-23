// @vitest-environment jsdom
import { act } from "react";
import { createRoot, hydrateRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import LanguageSwitcher from "../LanguageSwitcher";

vi.mock("next/navigation", () => ({
  usePathname: () => window.location.pathname,
  useSearchParams: () => new URLSearchParams(window.location.search),
}));
const tree = () => <NextIntlClientProvider locale="en" messages={{ nav: { language: "Language" } }} timeZone="UTC"><LanguageSwitcher /></NextIntlClientProvider>;
let container: HTMLDivElement;
let root: Root | undefined;
beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(() => {
  window.history.replaceState({}, "", "/en/estimation?c=Luxembourg&s=80#resultats");
  container = document.createElement("div");
  document.body.appendChild(container);
});
afterEach(async () => {
  await act(async () => { root?.unmount(); });
  root = undefined;
  container.remove();
});

it("keeps the query and fragment when selecting another language", async () => {
  await act(async () => { root = createRoot(container); root.render(tree()); });
  expect(container.querySelector('a[lang="de"]')?.getAttribute("href")).toBe("/de/estimation?c=Luxembourg&s=80#resultats");
  expect(container.querySelector('a[lang="fr"]')?.getAttribute("href")).toBe("/estimation?c=Luxembourg&s=80#resultats");
});

it("retains freshly changed hash/query even when history.replaceState did not trigger a render", async () => {
  await act(async () => { root = createRoot(container); root.render(tree()); });
  window.history.replaceState({}, "", "/en/verify?data=a%2Bb#private-signature");
  const link = container.querySelector<HTMLAnchorElement>('a[lang="de"]')!;
  await act(async () => { link.dispatchEvent(new Event("pointerdown", { bubbles: true })); });
  expect(link.pathname + link.search + link.hash).toBe("/de/verify?data=a%2Bb#private-signature");
});

it("hydrates with a stable server snapshot and then adds the browser fragment", async () => {
  const recovered = vi.fn();
  container.innerHTML = renderToString(tree());
  const originalLink = container.querySelector('a[lang="de"]');
  expect(originalLink?.getAttribute("href")).toBe("/de/estimation?c=Luxembourg&s=80");
  await act(async () => { root = hydrateRoot(container, tree(), { onRecoverableError: recovered }); });
  expect(container.querySelector('a[lang="de"]')).toBe(originalLink);
  expect(originalLink?.getAttribute("href")).toBe("/de/estimation?c=Luxembourg&s=80#resultats");
  expect(recovered).not.toHaveBeenCalled();
});
