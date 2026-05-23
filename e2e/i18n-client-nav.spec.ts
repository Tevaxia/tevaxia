import { test, expect } from "@playwright/test";

// Regression: in-app (client-side) navigation must not leave pages showing raw
// i18n keys. The root layout inlines only the landing route's namespaces and
// never re-renders on navigation, so without FullMessagesProvider (which loads
// the full locale bundle on the client) navigating home -> /vefa showed 151 raw
// keys (vefa.title, …). See src/components/FullMessagesProvider.tsx.
const cases = [
  { from: "/", to: "/vefa", ns: "vefa" },
  { from: "/", to: "/valorisation", ns: "valorisation" },
  { from: "/vefa", to: "/frais-acquisition", ns: "fraisAcquisition" },
];

for (const c of cases) {
  test(`client-nav ${c.from} -> ${c.to} keeps ${c.ns} translated`, async ({ page }) => {
    const re = new RegExp(`\\b${c.ns}\\.[a-zA-Z]+`, "g");

    // Baseline: a direct load is always correct (layout sees the right x-url).
    await page.goto(c.to, { waitUntil: "networkidle" });
    expect((await page.locator("body").innerText()).match(re) || []).toHaveLength(0);

    // Land elsewhere, let the client bundle load, then navigate via a real link.
    await page.goto(c.from, { waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    await page.evaluate((to) => {
      const link = document.querySelector(`a[href="${to}"]`) as HTMLAnchorElement | null;
      if (!link) throw new Error("no in-app link to " + to);
      link.style.display = "block";
      link.click();
    }, c.to);
    await page.waitForURL(`**${c.to}`, { timeout: 5000 });
    await page.waitForTimeout(800);

    const raw = (await page.locator("body").innerText()).match(re) || [];
    expect(raw, `client-nav ${c.from} -> ${c.to}`).toHaveLength(0);
  });
}
