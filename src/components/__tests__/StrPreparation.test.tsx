// @vitest-environment jsdom
import { act, type ReactElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import EuRegistryPage from "@/app/str/compliance-eu/page";

const mocks = vi.hoisted(() => ({ pdf: vi.fn(), blob: vi.fn() }));
vi.mock("@react-pdf/renderer", () => {
  const Content = ({ children }: { children: ReactNode }) => <>{children}</>;
  return { Document: Content, Page: Content, Text: Content, View: Content, StyleSheet: { create: (styles: unknown) => styles }, pdf: mocks.pdf };
});
vi.mock("next-intl", () => ({ useLocale: () => "en", useTranslations: () => (key: string) => key }));

let container: HTMLDivElement;
let root: Root;
beforeAll(() => { vi.stubGlobal("IS_REACT_ACT_ENVIRONMENT", true); });
afterAll(() => { vi.unstubAllGlobals(); });
beforeEach(async () => {
  mocks.pdf.mockReset().mockReturnValue({ toBlob: mocks.blob });
  // Stop before the file download; the document passed to the renderer is inspected below.
  mocks.blob.mockReset().mockRejectedValue(new Error("Test renderer unavailable"));
  container = document.createElement("div"); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(<EuRegistryPage />); });
});
afterEach(async () => { await act(async () => { root.unmount(); }); container.remove(); });

async function fill(selector: string, value: string) {
  const input = container.querySelector<HTMLInputElement>(selector)!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

it("does not invent an official-looking registration number", () => {
  expect(container.textContent).not.toMatch(/LU-[A-Z0-9]+-/);
  expect(container.querySelector('a[href="/en/str"]')).not.toBeNull();
});

it("warns at exactly 90 operator-wide nights, not only above the threshold", async () => {
  await fill("#operator-nights", "89");
  expect(container.querySelector('[role="status"]')).toBeNull();
  await fill("#operator-nights", "90");
  expect(container.querySelector('[role="status"]')?.textContent).toContain("warnLicense");
  expect(container.querySelector('label[for="operator-nights"]')?.textContent).toBe("fields.nightsPlanned");
});

it("exports an internal preparation document without a fabricated certificate or signature pledge", async () => {
  await fill('[placeholder="fields.hostName"]', "Test Host");
  await fill('[placeholder="fields.propertyAddress"]', "Test property");
  await fill("#operator-nights", "90");
  const download = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("downloadPdf"))!;
  await act(async () => { download.click(); });
  expect(mocks.pdf).toHaveBeenCalledTimes(1);
  const html = renderToString(mocks.pdf.mock.calls[0][0] as ReactElement);
  expect(html).toContain("reviewBody");
  expect(html).toContain("pdfFooter");
  expect(html).toContain("warnLicense");
  expect(html).toContain("propertyTypes.apartment");
  expect(html).not.toMatch(/LU-[A-Z0-9]+-/);
  expect(html).not.toMatch(/Je certifie|Je m.engage|Date et signature|À soumettre à votre commune/);
  expect(container.querySelector('[role="alert"]')?.textContent).toBe("pdfFailed");
});

it("disables export for a negative operator-night count", async () => {
  await fill('[placeholder="fields.hostName"]', "Test Host");
  await fill('[placeholder="fields.propertyAddress"]', "Test property");
  await fill("#operator-nights", "-1");
  const download = Array.from(container.querySelectorAll("button")).find(button => button.textContent?.includes("downloadPdf"))!;
  expect(download.disabled).toBe(true);
});
