// @vitest-environment jsdom
import { act, useState } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import SliderField from "../SliderField";
import messages from "@/messages/en.json";

let container: HTMLDivElement;
let root: Root;
const onChange = vi.fn();

function Field() {
  const [value, setValue] = useState(8500);
  return <NextIntlClientProvider locale="en" messages={{ numberInput: messages.numberInput }} timeZone="UTC">
    <SliderField label="Price per m²" value={value} onChange={value => { onChange(value); setValue(value); }} min={4000} max={15000} step={100} suffix="€" />
  </NextIntlClientProvider>;
}

beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(async () => {
  onChange.mockClear();
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<Field />); });
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

async function enter(text: string) {
  await act(async () => { container.querySelector("button")!.click(); });
  const input = container.querySelector<HTMLInputElement>('input[type="text"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, text);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await act(async () => { input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true })); });
  return input;
}

it("commits 5,000 as 5000 once and exposes the localized slider value", async () => {
  await enter("5,000");
  expect(onChange).toHaveBeenCalledExactlyOnceWith(5000);
  expect(container.querySelector<HTMLInputElement>('input[type="range"]')!.value).toBe("5000");
  expect(container.querySelector('[aria-valuetext="5,000 €"]')).not.toBeNull();
  expect(container.querySelector('input[type="text"]')).toBeNull();
});

it.each(["3,000", "5,050", "5,00"])("keeps the original amount and explains invalid input %s", async value => {
  const input = await enter(value);
  expect(onChange).not.toHaveBeenCalled();
  expect(input.value).toBe(value);
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(container.querySelector('[role="alert"]')?.textContent).toBeTruthy();
  expect(container.querySelector<HTMLInputElement>('input[type="range"]')!.value).toBe("8500");
});

it("Escape cancels an invalid edit without changing the calculation", async () => {
  const input = await enter("3,000");
  await act(async () => { input.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
  expect(onChange).not.toHaveBeenCalled();
  expect(container.querySelector('input[type="text"]')).toBeNull();
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
