import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { pickNamespaces } from "@/i18n/pick-namespaces";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";
import lb from "@/messages/lb.json";

const bundles = { fr, en, de, pt, lb };

describe("professional valuation guidance across locales", () => {
  for (const [locale, messages] of Object.entries(bundles)) {
    it(`${locale}: resolves guidance on landing, tool and client-navigation source pages`, () => {
      for (const route of ["/", "/inspection", "/valorisation", "/vefa", "/solutions/expert-evaluateur"]) {
        const path = locale === "fr" ? route : `/${locale}${route === "/" ? "" : route}`;
        const selected = pickNamespaces(messages, path);
        expect(selected.expertGuidance).toEqual(messages.expertGuidance);
        const t = createTranslator({ locale, messages: selected.expertGuidance as typeof fr.expertGuidance });
        for (const key of Object.keys(fr.expertGuidance) as Array<keyof typeof fr.expertGuidance>) {
          expect(t(key)).not.toBe(`expertGuidance.${key}`);
          expect(t(key)).not.toContain("{undefined}");
        }
        expect(t("contact")).toContain("LPVI");
        expect(t("destination")).toContain("info@lpvi.lu");
      }
    });

    it(`${locale}: keeps product names distinct from professional qualifications`, () => {
      const productNames = [messages.nav.valorisation, messages.home.modules.valorisation.title,
        messages.home.modules.inspection.title, messages.inspectionTegova.pageTitle,
        messages.inspectionTegova.exportHeader, messages.planDuSite.links.inspection];
      for (const name of productNames) expect(name).not.toMatch(/TEGoVA|EVS/i);
      expect(messages.inspectionTegova.exportFooter).toContain("https://www.lpvi.lu/");
      expect(messages.guide.estimation.section4P2).toContain("LPVI");
      expect(messages.guide.estimation.section4P2).not.toContain("INREV");
    });

    it(`${locale}: still interpolates the valuation narrative and rich link`, () => {
      const t = createTranslator({ locale, messages, namespace: "valorisation" });
      const intro = t("narrIntroduction", { assetType: "TYPE", surface: 80, localisation: "LIEU", evsType: "BASE" });
      for (const value of ["TYPE", "80", "LIEU", "BASE"]) expect(intro).toContain(value);
      expect(intro).not.toMatch(/\{(?:assetType|surface|localisation|evsType)\}/);
      const bank = createTranslator({ locale, messages, namespace: "outilsBancaires" });
      expect(bank.rich("prudentValueCalculate", { link: chunks => `LINK:${chunks}` })).toContain("LINK:");
    });
  }
});
