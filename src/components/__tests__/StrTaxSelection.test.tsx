// @vitest-environment jsdom
import { act, type ReactElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { NextIntlClientProvider } from "next-intl";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import StrArbitrage from "@/app/str/arbitrage/page";
import StrRentabilite from "@/app/str/rentabilite/page";
import messages from "@/messages/en.json";

vi.mock("@/components/AuthProvider", () => ({ useAuth: () => ({ user: null }) }));
vi.mock("@/components/AiAnalysisCard", () => ({ default: () => null }));
vi.mock("@/components/SaveButton", () => ({ default: () => null }));
vi.mock("@/lib/storage", () => ({ sauvegarderEvaluation: vi.fn() }));

let container: HTMLDivElement;
let root: Root;
beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
  container.remove();
});

async function render(page: ReactElement) {
  await act(async () => {
    root.render(<NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">{page}</NextIntlClientProvider>);
  });
}

function field(label: string) {
  const element = Array.from(container.querySelectorAll("label")).find(node => node.textContent === label)!;
  return document.getElementById(element.htmlFor) as HTMLInputElement | HTMLSelectElement;
}

async function fill(label: string, value: string) {
  const input = field(label);
  await act(async () => {
    if (input instanceof HTMLSelectElement) {
      input.value = value;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
}

function rowAmount(label: string) {
  const span = Array.from(container.querySelectorAll("span")).find(node => node.textContent === label)!;
  return Number(span.nextElementSibling!.textContent!.replace(/[^\d-]/g, ""));
}

it("shows 30% by default and applies that rate to the arbitrage cash balance", async () => {
  await render(<StrArbitrage />);
  const rate = field(messages.strArbitrage.property.marginalRate) as HTMLSelectElement;
  expect(rate.value).toBe("0.3");
  expect(rate.selectedOptions[0].textContent).toContain("30");
  await fill(messages.strArbitrage.lt.monthlyRent, "2000");
  await fill(messages.strArbitrage.lt.deductible, "6000");
  expect(rowAmount(messages.strArbitrage.detail.taxEstimated)).toBe(-5400);
  expect(rowAmount(messages.strArbitrage.detail.annualNet)).toBe(12600);
  await fill(messages.strArbitrage.property.marginalRate, "0.11");
  expect(rowAmount(messages.strArbitrage.detail.taxEstimated)).toBe(-1980);
  expect(rowAmount(messages.strArbitrage.detail.annualNet)).toBe(16020);
  await fill(messages.strArbitrage.property.marginalRate, "0.3");
  expect(rate.selectedOptions[0].textContent).toContain("30");
  expect(rowAmount(messages.strArbitrage.detail.annualNet)).toBe(12600);
});

it("keeps the profitability selection, displayed rate and calculated tax aligned for every offered rate", async () => {
  await render(<StrRentabilite />);
  const rate = field(messages.strRentabilite.form.marginalRate) as HTMLSelectElement;
  expect(rate.value).toBe("0.3");
  expect(rate.selectedOptions[0].textContent).toContain("30");
  const beforeTax = rowAmount(messages.strRentabilite.result.netBeforeTax);
  for (const value of ["0.3", "0.11", "0.22", "0.39", "0.4578", "0.3"]) {
    await fill(messages.strRentabilite.form.marginalRate, value);
    expect(rate.value).toBe(value);
    const taxLabel = messages.strRentabilite.result.taxEstimated.replace("{pct}", (Number(value) * 100).toFixed(0));
    const expectedTax = Math.round(beforeTax * Number(value));
    expect(rowAmount(taxLabel)).toBe(-expectedTax);
    expect(rowAmount(messages.strRentabilite.result.netAfterTax)).toBe(beforeTax - expectedTax);
  }
});
