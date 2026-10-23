// @vitest-environment jsdom
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import Header from "../Header";
import messages from "@/messages/en.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/estimation" }));
vi.mock("../AuthProvider", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("../LanguageSwitcher", () => ({ default: () => null }));

let container: HTMLDivElement;
let root: Root;
beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(async () => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<NextIntlClientProvider locale="en" messages={{ nav: messages.nav }} timeZone="UTC"><Header /></NextIntlClientProvider>); });
});
afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); });

it("exposes the skip link and expands the declared desktop disclosure", async () => {
  expect(container.querySelector('a[href="#main-content"]')?.textContent).toBe(messages.nav.skipToContent);
  const trigger = container.querySelector<HTMLButtonElement>("#nav-trigger-particuliers")!;
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  await act(async () => { trigger.click(); });
  expect(trigger.getAttribute("aria-expanded")).toBe("true");
  const panel = container.querySelector("#nav-panel-particuliers")!;
  expect(panel.getAttribute("aria-labelledby")).toBe(trigger.id);
  expect(panel.querySelector('a[href="/en/estimation"]')).not.toBeNull();
});

it("Escape closes the desktop menu and returns focus to its trigger", async () => {
  const trigger = container.querySelector<HTMLButtonElement>("#nav-trigger-particuliers")!;
  await act(async () => { trigger.click(); });
  const link = container.querySelector<HTMLAnchorElement>("#nav-panel-particuliers a")!;
  await act(async () => { link.focus(); link.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
  expect(container.querySelector("#nav-panel-particuliers")).toBeNull();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});

it("Escape closes the mobile menu and restores focus", async () => {
  const trigger = container.querySelector<HTMLButtonElement>('[aria-controls="mobile-navigation"]')!;
  await act(async () => { trigger.click(); });
  const link = container.querySelector<HTMLAnchorElement>("#mobile-navigation a")!;
  await act(async () => { link.focus(); link.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
  expect(container.querySelector("#mobile-navigation")).toBeNull();
  expect(trigger.getAttribute("aria-expanded")).toBe("false");
  expect(document.activeElement).toBe(trigger);
});
