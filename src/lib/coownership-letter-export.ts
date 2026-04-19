// ============================================================
// SYNDIC — export lettres en DOCX, PDF, Google Docs
// ============================================================

import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from "docx";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface RenderedLetter {
  subject: string;
  body: string;
}

/**
 * Génère un .docx (OOXML Word) téléchargeable.
 * Compatible Word, LibreOffice, Pages, Google Docs (import).
 */
export async function exportToDocx(letter: RenderedLetter): Promise<Blob> {
  const bodyParagraphs = letter.body.split(/\n/).map((line) =>
    new Paragraph({
      children: [new TextRun({ text: line, font: "Calibri", size: 22 })], // 11pt
      spacing: { after: 120 },
    })
  );

  const doc = new Document({
    creator: "tevaxia.lu",
    title: letter.subject,
    styles: {
      default: {
        document: {
          run: { font: "Calibri", size: 22 },
        },
      },
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.LEFT,
          spacing: { after: 240 },
          children: [new TextRun({
            text: letter.subject,
            bold: true,
            size: 28, // 14pt
            font: "Calibri",
          })],
        }),
        ...bodyParagraphs,
      ],
    }],
  });

  return await Packer.toBlob(doc);
}

/**
 * Génère un PDF A4 simple via pdf-lib.
 */
export async function exportToPdf(letter: RenderedLetter): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const navy = rgb(0.04, 0.16, 0.34);
  const black = rgb(0, 0, 0);

  const pageSize: [number, number] = [595, 842];
  const M = 55;
  const maxWidth = pageSize[0] - 2 * M;
  const lineHeight = 14;
  const fontSize = 10.5;

  const wrapText = (text: string, f: typeof font, size: number, width: number): string[] => {
    const out: string[] = [];
    for (const paragraph of text.split(/\n/)) {
      if (paragraph === "") { out.push(""); continue; }
      const words = paragraph.split(/\s+/);
      let line = "";
      for (const w of words) {
        const test = line ? `${line} ${w}` : w;
        if (f.widthOfTextAtSize(test, size) > width) {
          if (line) out.push(line);
          line = w;
        } else {
          line = test;
        }
      }
      if (line) out.push(line);
    }
    return out;
  };

  let page = pdf.addPage(pageSize);
  let y = 800;

  // Title
  page.drawText(letter.subject.slice(0, 120), { x: M, y, size: 14, font: bold, color: navy });
  y -= 30;

  // Body
  const lines = wrapText(letter.body, font, fontSize, maxWidth);
  for (const line of lines) {
    if (y < 60) {
      page = pdf.addPage(pageSize);
      y = 800;
    }
    page.drawText(line, { x: M, y, size: fontSize, font, color: black });
    y -= lineHeight;
  }

  // Footer
  const pageCount = pdf.getPageCount();
  for (let i = 0; i < pageCount; i++) {
    const p = pdf.getPage(i);
    p.drawText(`Généré par tevaxia.lu — page ${i + 1} / ${pageCount}`, {
      x: M, y: 30, size: 8, font, color: rgb(0.45, 0.50, 0.56),
    });
  }

  return await pdf.save();
}

/** Déclenche un téléchargement navigateur pour un Blob. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadBytes(bytes: Uint8Array, filename: string, mime: string): void {
  downloadBlob(new Blob([bytes as BlobPart], { type: mime }), filename);
}

/** Nom de fichier propre à partir d'un titre. */
export function safeFilename(s: string, max = 80): string {
  return s.replace(/[^\w\-. ]/g, "_").replace(/\s+/g, "_").slice(0, max);
}
