"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { parseInvoiceText, type ExtractedInvoice } from "@/lib/syndic-ocr-parser";
import { formatEUR } from "@/lib/calculations";
import { track, captureError } from "@/lib/analytics";

type Stage = "idle" | "extracting_pdf" | "ocr_running" | "parsing" | "done" | "error";

export default function OcrFacturesPage() {
  const t = useTranslations("syndicOcr");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams();
  const coownershipId = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();
  const [stage, setStage] = useState<Stage>("idle");
  const [progress, setProgress] = useState(0);
  const [rawText, setRawText] = useState("");
  const [extracted, setExtracted] = useState<ExtractedInvoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [method, setMethod] = useState<"pdf_text" | "tesseract_ocr" | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const doc = await loadingTask.promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((it) => ("str" in it ? (it as { str: string }).str : ""))
        .join(" ");
      text += pageText + "\n\n";
      setProgress(Math.round((i / doc.numPages) * 100));
    }
    return text;
  };

  const extractWithTesseract = async (file: File): Promise<string> => {
    const Tesseract = (await import("tesseract.js")).default;
    if (file.type.startsWith("image/")) {
      const { data } = await Tesseract.recognize(file, "fra+eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      return data.text;
    }
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      "pdfjs-dist/build/pdf.worker.min.mjs",
      import.meta.url,
    ).toString();
    const arrayBuffer = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    let text = "";
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) continue;
      // @ts-expect-error — pdfjs-dist render API
      await page.render({ canvasContext: ctx, viewport }).promise;
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) continue;
      const { data } = await Tesseract.recognize(blob, "fra+eng", {
        logger: (m: { status: string; progress: number }) => {
          if (m.status === "recognizing text") {
            const pageProg = (m.progress / doc.numPages) * 100;
            const basePage = ((i - 1) / doc.numPages) * 100;
            setProgress(Math.round(basePage + pageProg));
          }
        },
      });
      text += data.text + "\n\n";
    }
    return text;
  };

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setExtracted(null);
    setRawText("");
    setProgress(0);
    setMethod(null);

    try {
      let text = "";

      if (file.type === "application/pdf") {
        setStage("extracting_pdf");
        text = await extractPdfText(file);
        if (text.trim().length < 50) {
          setStage("ocr_running");
          setMethod("tesseract_ocr");
          setProgress(0);
          text = await extractWithTesseract(file);
        } else {
          setMethod("pdf_text");
        }
      } else if (file.type.startsWith("image/")) {
        setStage("ocr_running");
        setMethod("tesseract_ocr");
        text = await extractWithTesseract(file);
      } else {
        throw new Error(t("formatError"));
      }

      setStage("parsing");
      setRawText(text);
      const result = parseInvoiceText(text);
      setExtracted(result);
      setStage("done");
      track("ocr_extracted", {
        method,
        confidence: result.confidence,
        fields_detected: result.detected_fields.length,
        file_type: file.type || "unknown",
        file_size_kb: Math.round(file.size / 1024),
      });
    } catch (e) {
      captureError(e, { module: "syndic_ocr", action: "extract", coownership_id: coownershipId });
      setError((e as Error).message);
      setStage("error");
    }
  }, [coownershipId, method, t]);

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("login")}</Link></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitlePrefix")}<strong>{t("pageSubtitlePdfjs")}</strong>{t("pageSubtitleMiddle")}<strong>{t("pageSubtitleTesseract")}</strong>{t("pageSubtitleSuffix")}
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      {/* Upload */}
      {stage === "idle" && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-12 text-center">
          <div className="text-5xl mb-3">📄</div>
          <h2 className="text-lg font-bold text-navy">{t("uploadTitle")}</h2>
          <p className="mt-2 text-xs text-muted">
            {t("uploadHint")}
          </p>
          <input type="file" ref={fileInputRef}
            accept="application/pdf,image/jpeg,image/png,image/jpg"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            {t("btnChoose")}
          </button>
          <div className="mt-4 text-[11px] text-muted">
            {t("uploadFormats")}
          </div>
        </div>
      )}

      {/* Progress */}
      {(stage === "extracting_pdf" || stage === "ocr_running" || stage === "parsing") && (
        <div className="mt-6 rounded-xl border border-navy/20 bg-navy/5 p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-navy">
            {stage === "extracting_pdf" && t("stageExtractPdf")}
            {stage === "ocr_running" && t("stageOcr")}
            {stage === "parsing" && t("stageParsing")}
          </h2>
          <div className="mt-4 mx-auto max-w-md">
            <div className="h-3 w-full rounded-full bg-background overflow-hidden">
              <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted">{progress}%</div>
          </div>
          {method === "tesseract_ocr" && (
            <div className="mt-3 text-[11px] text-muted">
              {t("tesseractNote")}
            </div>
          )}
        </div>
      )}

      {/* Résultats */}
      {stage === "done" && extracted && (
        <>
          <div className="mt-6 flex items-center gap-3">
            <button onClick={() => { setStage("idle"); setExtracted(null); setRawText(""); }}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate">
              {t("btnNewFile")}
            </button>
            <span className="text-sm text-muted">
              {t("methodLabelPrefix")}<strong>{method === "pdf_text" ? t("methodPdfText") : t("methodTesseract")}</strong>
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              extracted.confidence >= 70 ? "bg-emerald-100 text-emerald-900" :
              extracted.confidence >= 40 ? "bg-amber-100 text-amber-900" :
              "bg-rose-100 text-rose-900"
            }`}>
              {t("confidenceBadge", { n: extracted.confidence })}
            </span>
          </div>

          <section className="mt-5 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              {t("dataTitle", { n: extracted.detected_fields.length })}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("fieldSupplier")} value={extracted.supplier_name} notDetected={t("notDetected")} />
              <Field label={t("fieldVat")} value={extracted.supplier_vat} mono notDetected={t("notDetected")} />
              <Field label={t("fieldIban")} value={extracted.supplier_iban} mono notDetected={t("notDetected")} />
              <Field label={t("fieldBic")} value={extracted.supplier_bic} mono notDetected={t("notDetected")} />
              <Field label={t("fieldInvoiceNumber")} value={extracted.invoice_number} mono notDetected={t("notDetected")} />
              <Field label={t("fieldInvoiceDate")} value={extracted.invoice_date} mono notDetected={t("notDetected")} />
              <Field label={t("fieldDueDate")} value={extracted.due_date} mono notDetected={t("notDetected")} />
              <Field label={t("fieldPaymentRef")} value={extracted.payment_reference} mono notDetected={t("notDetected")} />
              <Field label={t("fieldAmountHt")}
                value={extracted.amount_ht !== null ? formatEUR(extracted.amount_ht) : null} mono notDetected={t("notDetected")} />
              <Field label={t("fieldAmountTva")}
                value={extracted.amount_tva !== null ? formatEUR(extracted.amount_tva) : null} mono notDetected={t("notDetected")} />
              <Field label={t("fieldTvaRate")}
                value={extracted.tva_rate !== null ? `${extracted.tva_rate}%` : null} mono notDetected={t("notDetected")} />
              <Field label={t("fieldAmountTtc")}
                value={extracted.amount_ttc !== null ? formatEUR(extracted.amount_ttc) : null}
                mono highlight notDetected={t("notDetected")} />
            </div>

            {extracted.confidence < 70 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                {t("lowConfidence")}
              </div>
            )}

            {/* Boutons actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              {extracted.supplier_iban && extracted.amount_ttc && (
                <Link href={`${lp}/syndic/coproprietes/${coownershipId}/sepa-virements`}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                  {t("btnCreateSepa")}
                </Link>
              )}
              <button onClick={async () => {
                const json = JSON.stringify(extracted, null, 2);
                await navigator.clipboard.writeText(json);
                alert(t("jsonCopied"));
              }}
                className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">
                {t("btnCopyJson")}
              </button>
            </div>
          </section>

          {/* Raw text collapsible */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted font-semibold">
              {t("rawTextLabel", { n: rawText.length })}
            </summary>
            <pre className="mt-2 rounded-lg border border-card-border bg-background p-3 text-[10px] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
              {rawText}
            </pre>
          </details>
        </>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("howTitle")}</strong>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li>{t("howItem1")}</li>
          <li>{t("howItem2")}</li>
          <li>{t("howItem3")}</li>
          <li>{t("howItem4")}</li>
          <li>{t("howItem5")}</li>
          <li>{t("howItem6")}</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value, mono, highlight, notDetected }: {
  label: string; value: string | null; mono?: boolean; highlight?: boolean; notDetected: string;
}) {
  return (
    <div className={`rounded-lg border ${highlight ? "border-navy bg-navy/5" : "border-card-border/50 bg-background"} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-lg font-bold text-navy" : "text-slate"} ${value === null ? "text-muted italic" : ""}`}>
        {value ?? notDetected}
      </div>
    </div>
  );
}
