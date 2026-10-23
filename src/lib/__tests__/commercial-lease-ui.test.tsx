// @vitest-environment jsdom
import { readFileSync } from "node:fs";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import BailCommercial from "@/app/bail-commercial/page";
const router = vi.hoisted(() => ({ pathname: "/bail-commercial" }));
vi.mock("next/navigation", () => ({ usePathname: () => router.pathname }));

let container: HTMLDivElement, root: Root;
const onError = vi.fn();
beforeEach(() => {
  vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); onError.mockClear();
  container = document.createElement("div"); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); vi.unstubAllGlobals(); });
async function render(locale = "en") {
  router.pathname = `${locale === "fr" ? "" : `/${locale}`}/bail-commercial`;
  const messages = JSON.parse(readFileSync(`src/messages/${locale}.json`, "utf8"));
  await act(async () => root.render(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC" onError={onError}><BailCommercial /></NextIntlClientProvider>));
  return messages;
}
it.each(["fr", "en", "de", "pt", "lb"])("renders the revised commercial lease in %s without missing translations", async locale => {
  const messages = await render(locale);
  expect(onError).not.toHaveBeenCalled();
  expect(container.textContent).toContain(messages.bailCommercialPage.noKeyMoney);
  expect(container.querySelector('input[max="6"]')).not.toBeNull();
  expect(container.querySelectorAll('input[type="checkbox"]:checked')).toHaveLength(0);
});
it("rejects a seven-month guarantee in the actual form and only shows breaks after an explicit choice", async () => {
  const messages = await render();
  const guarantee = container.querySelector<HTMLInputElement>('input[max="6"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(guarantee, "7");
    guarantee.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(container.querySelector('[role="alert"]')?.textContent).toBe(messages.bailCommercialPage.invalidInputs);
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(guarantee, "6");
    guarantee.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(container.textContent).not.toContain(messages.bailCommercialPage.periodesTriennales);
  const label = [...container.querySelectorAll("label")].find(label => label.textContent === messages.bailCommercialPage.breakConfirmed)!;
  await act(async () => label.querySelector<HTMLInputElement>("input")!.click());
  expect(container.textContent).toContain(messages.bailCommercialPage.periodesTriennales);
});
