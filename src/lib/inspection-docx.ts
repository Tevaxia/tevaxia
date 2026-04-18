import type { InspectionReportInput } from "@/components/InspectionPdf";

/**
 * Génère un rapport d'inspection au format DOCX (éditable Word / LibreOffice).
 * L'hôtelier/évaluateur peut retoucher avant envoi au client ou cabinet.
 */
export async function generateInspectionDocxBlob(input: InspectionReportInput): Promise<Blob> {
  const { data, checklist, translations: t } = input;
  const docx = await import("docx");
  const {
    Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
    Table, TableRow, TableCell, WidthType, BorderStyle, ShadingType,
  } = docx;

  const counts = { ok: 0, nc: 0, na: 0, pending: 0 };
  for (const section of checklist) {
    for (const item of section.items) {
      const status = data.items[item.id]?.status ?? "pending";
      counts[status]++;
    }
  }

  const STATUS_TEXT: Record<string, string> = { ok: "OK", nc: "NC", na: "N/A", pending: "—" };
  const STATUS_COLOR: Record<string, string> = { ok: "D1FAE5", nc: "FEE2E2", na: "E5E7EB", pending: "FEF3C7" };

  const noneBorder = { style: BorderStyle.NONE, size: 0, color: "auto" } as const;
  const borderTop = { style: BorderStyle.SINGLE, size: 8, color: "1E3A5F" } as const;

  const metaRow = (label: string, value: string) =>
    new TableRow({
      children: [
        new TableCell({
          width: { size: 25, type: WidthType.PERCENTAGE },
          borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
          children: [new Paragraph({ children: [new TextRun({ text: label, bold: true, size: 18, color: "6B7280" })] })],
        }),
        new TableCell({
          width: { size: 75, type: WidthType.PERCENTAGE },
          borders: { top: noneBorder, bottom: noneBorder, left: noneBorder, right: noneBorder },
          children: [new Paragraph({ children: [new TextRun({ text: value, size: 20, color: "1E3A5F" })] })],
        }),
      ],
    });

  const progressCell = (label: string, count: number, fill: string, color: string) =>
    new TableCell({
      width: { size: 25, type: WidthType.PERCENTAGE },
      shading: { type: ShadingType.CLEAR, color: "auto", fill },
      children: [
        new Paragraph({
          children: [new TextRun({ text: String(count), bold: true, size: 32, color })],
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: label, size: 14, color, allCaps: true })],
          alignment: AlignmentType.CENTER,
        }),
      ],
    });

  const signatureCell = (label: string, value: string) =>
    new TableCell({
      width: { size: 50, type: WidthType.PERCENTAGE },
      borders: { top: borderTop, bottom: noneBorder, left: noneBorder, right: noneBorder },
      children: [
        new Paragraph({ children: [new TextRun({ text: label, size: 14, color: "6B7280", allCaps: true })] }),
        new Paragraph({
          children: [new TextRun({ text: value, bold: true, size: 20, color: "1E3A5F" })],
          spacing: { before: 100 },
        }),
      ],
    });

  const children: Array<InstanceType<typeof Paragraph> | InstanceType<typeof Table>> = [];

  children.push(
    new Paragraph({
      text: t.title,
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
    }),
    new Paragraph({
      children: [new TextRun({ text: t.subtitle, italics: true, size: 18, color: "6B7280" })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    }),
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        metaRow(t.reference, data.id),
        metaRow(t.address, data.address || "—"),
        metaRow(t.inspector, data.inspector || "—"),
        metaRow(t.date, `${data.date} · ${data.startTime || "—"} → ${data.endTime || "—"}`),
      ],
    }),
    new Paragraph({ text: "" }),
  );

  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            progressCell(t.progress.ok, counts.ok, "D1FAE5", "065F46"),
            progressCell(t.progress.nc, counts.nc, "FEE2E2", "991B1B"),
            progressCell(t.progress.na, counts.na, "E5E7EB", "374151"),
            progressCell(t.progress.pending, counts.pending, "FEF3C7", "92400E"),
          ],
        }),
      ],
    }),
    new Paragraph({ text: "", spacing: { after: 300 } }),
  );

  for (const section of checklist) {
    children.push(
      new Paragraph({
        text: t.sectionTitles[section.titleKey] ?? section.titleKey,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 200, after: 100 },
      }),
    );

    const rows: InstanceType<typeof TableRow>[] = section.items.map((item) => {
      const d = data.items[item.id];
      const status = d?.status ?? "pending";
      return new TableRow({
        children: [
          new TableCell({
            width: { size: 15, type: WidthType.PERCENTAGE },
            shading: { type: ShadingType.CLEAR, color: "auto", fill: STATUS_COLOR[status] },
            children: [new Paragraph({
              children: [new TextRun({ text: STATUS_TEXT[status], bold: true, size: 18 })],
              alignment: AlignmentType.CENTER,
            })],
          }),
          new TableCell({
            width: { size: 85, type: WidthType.PERCENTAGE },
            children: [
              new Paragraph({
                children: [new TextRun({ text: t.itemLabels[item.labelKey] ?? item.labelKey, size: 20 })],
              }),
              ...(d?.note
                ? [new Paragraph({
                    children: [new TextRun({ text: d.note, italics: true, color: "6B7280", size: 18 })],
                    indent: { left: 200 },
                  })]
                : []),
            ],
          }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      }),
    );
  }

  if (data.generalNotes) {
    children.push(
      new Paragraph({
        text: t.generalNotes,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 400, after: 100 },
      }),
      new Paragraph({
        children: [new TextRun({ text: data.generalNotes, size: 20 })],
        spacing: { after: 300 },
      }),
    );
  }

  children.push(
    new Paragraph({ text: "", spacing: { before: 400 } }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            signatureCell(t.signatureInspector, data.inspector || "—"),
            signatureCell(t.signatureClient, " "),
          ],
        }),
      ],
    }),
  );

  const doc = new Document({
    creator: "tevaxia.lu",
    title: `Rapport d'inspection ${data.id}`,
    description: t.subtitle,
    sections: [{ children }],
  });

  return await Packer.toBlob(doc);
}
