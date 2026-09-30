import { describe, expect, it } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { generateInspectionDocxBlob } from "../inspection-docx";
import fr from "@/messages/fr.json";
import en from "@/messages/en.json";
import de from "@/messages/de.json";
import pt from "@/messages/pt.json";
import lb from "@/messages/lb.json";

describe("inspection Word export", () => {
  for (const [locale, messages] of Object.entries({ fr, en, de, pt, lb })) {
    it(`${locale}: includes the translated scope and association referral in the actual document`, async () => {
      const t = messages.inspectionTegova;
      const blob = await generateInspectionDocxBlob({
        data: { id: "QA", address: "", inspector: "", date: "2026-09-30", startTime: "", endTime: "", items: {}, generalNotes: "" },
        checklist: [],
        translations: {
          title: t.exportHeader, subtitle: t.exportSubtitle, reference: t.exportReference,
          address: t.exportAdresse, inspector: t.exportInspecteur, date: t.exportDate,
          timeRange: t.exportTimeRange, progress: { ok: t.exportStatusOk, nc: t.exportStatusNc, na: t.exportStatusNa, pending: t.exportStatusPending },
          generalNotes: t.exportNotesGenerales, signatureInspector: t.exportSignatureInspector,
          signatureClient: t.exportSignatureClient, footer: t.exportFooter, sectionTitles: {}, itemLabels: {},
        },
      });
      const files = unzipSync(new Uint8Array(await blob.arrayBuffer()));
      const body = strFromU8(files["word/document.xml"]);
      expect(body).toContain(t.exportHeader);
      expect(body).toContain(t.exportSubtitle);
      expect(body).toContain(t.exportFooter);
      expect(body).toContain("https://www.lpvi.lu/");
      expect(strFromU8(files["docProps/core.xml"])).toContain(t.exportHeader);
    });
  }
});
