import { describe, expect, it, vi } from "vitest";
import { LOCALES, buildLocaleUrl } from "@/lib/seo";
import { buildEditorialMetadata, EDITORIAL_SEO, type EditorialPagePath } from "@/lib/editorial-seo";

vi.mock("next-intl/server", () => ({ getLocale: async () => "fr" }));

describe("editorial page metadata", () => {
  const paths = Object.keys(EDITORIAL_SEO.fr) as EditorialPagePath[];

  it("provides distinct, complete copy in every language without UI placeholders", () => {
    const titles: string[] = [];
    const descriptions: string[] = [];
    for (const locale of LOCALES) {
      expect(Object.keys(EDITORIAL_SEO[locale])).toEqual(paths);
      for (const path of paths) {
        const copy = EDITORIAL_SEO[locale][path];
        expect(copy.title.length, `${locale}${path}`).toBeGreaterThan(12);
        // Editorial guardrails, not search-engine character limits.
        expect(copy.title.length, `${locale}${path}`).toBeLessThanOrEqual(80);
        expect(copy.description.length, `${locale}${path}`).toBeGreaterThan(50);
        expect(copy.description.length, `${locale}${path}`).toBeLessThanOrEqual(220);
        expect(copy.title + copy.description).not.toMatch(/[{}<>]/);
        titles.push(copy.title);
        descriptions.push(copy.description);
      }
    }
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
  });

  it("uses the exact localized route for canonical and sharing metadata", () => {
    for (const locale of LOCALES) {
      for (const path of paths) {
        const metadata = buildEditorialMetadata(locale, path);
        const copy = EDITORIAL_SEO[locale][path];
        expect(metadata.alternates?.canonical).toBe(buildLocaleUrl(path, locale));
        expect(metadata.alternates?.languages?.[locale]).toBe(buildLocaleUrl(path, locale));
        expect(metadata.openGraph).toMatchObject({ ...copy, url: buildLocaleUrl(path, locale) });
        expect(metadata.twitter).toMatchObject(copy);
      }
    }
  });

  it("preserves noindex for existing private or utility pages", () => {
    expect(buildEditorialMetadata("fr", "/tableau-bord", true).robots).toEqual({ index: false, follow: true });
    expect(buildEditorialMetadata("en", "/gestion-locative").robots).toBeUndefined();
  });

  it("keeps the public status page indexable despite its utility layout", async () => {
    const { generateMetadata } = await import("@/app/status/page");
    expect((await generateMetadata()).robots).toEqual({ index: true, follow: true });
  });
});
