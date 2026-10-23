// @vitest-environment jsdom
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { expect, it, vi } from "vitest";
import SEOContent from "../SEOContent";
import ConvertisseurSurfaces from "@/app/convertisseur-surfaces/page";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";
import lb from "@/messages/lb.json";

vi.mock("next/navigation", () => ({ usePathname: () => "/en/convertisseur-surfaces" }));
vi.mock("../PdfButton", () => ({ PdfButton: () => null }));

it.each(Object.entries({ fr, en, de, pt, lb }))("renders the actual %s surface guide HTML without ICU errors or raw keys", (locale, messages) => {
  const onError = vi.fn();
  const sections = ["comprendre", "normes", "ponderation", "circulaire"].map(key => ({ titleKey: key + "Title", contentKey: key + "Content" }));
  const html = renderToString(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC" onError={onError}>
    <SEOContent ns="convertisseurSurfaces" sections={sections} faq={[]} relatedLinks={[]} />
  </NextIntlClientProvider>);
  const container = document.createElement("div");
  container.innerHTML = html;
  expect(container.querySelectorAll("article > section")).toHaveLength(4);
  expect(container.querySelectorAll("article .prose p").length).toBeGreaterThanOrEqual(4);
  expect(container.querySelectorAll("article .prose strong").length).toBeGreaterThan(0);
  expect(container.textContent).not.toContain("convertisseurSurfaces.seo.");
  expect(onError).not.toHaveBeenCalled();
});

it.each([["en", en], ["fr", fr]] as const)("uses %s number formats in the surface result panels", (locale, messages) => {
  const onError = vi.fn();
  const html = renderToString(<NextIntlClientProvider locale={locale} messages={messages} timeZone="UTC" onError={onError}><ConvertisseurSurfaces /></NextIntlClientProvider>);
  const container = document.createElement("div");
  container.innerHTML = html;
  expect(container.textContent).toContain(new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(2500) + " m²");
  expect(container.textContent).not.toContain("convertisseurSurfaces.seo.");
  expect(onError).not.toHaveBeenCalled();
});
