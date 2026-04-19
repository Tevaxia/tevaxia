"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { parseInvoiceText, type ExtractedInvoice } from "@/lib/syndic-ocr-parser";
import { formatEUR } from "@/lib/calculations";
import { track, captureError } from "@/lib/analytics";

type Stage = "idle" | "extracting_pdf" | "ocr_running" | "parsing" | "done" | "error";

export default function OcrFacturesPage() {
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
    // Dynamic import pour éviter bloat SSR
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
    // Pour les images directes
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
    // Pour les PDFs scannés : on passe d'abord par pdf.js pour extraire les images
    // puis on les OCRise page par page
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
        // Si le PDF est scanné (peu de texte extrait), fallback Tesseract
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
        throw new Error("Format non supporté. Utilisez PDF ou image (JPG/PNG).");
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
  }, []);

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">OCR factures fournisseurs</h1>
      <p className="mt-1 text-sm text-muted">
        Extraction automatique des informations clés d&apos;une facture (montant, TVA,
        IBAN, n° facture, date, échéance) via <strong>PDF.js</strong> (factures
        digitales) ou <strong>Tesseract.js</strong> (factures scannées). 100%
        gratuit, 100% client-side, aucune donnée envoyée à un service externe.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-900">{error}</div>}

      {/* Upload */}
      {stage === "idle" && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-12 text-center">
          <div className="text-5xl mb-3">📄</div>
          <h2 className="text-lg font-bold text-navy">Uploadez une facture</h2>
          <p className="mt-2 text-xs text-muted">
            PDF digital (préféré, instantané) ou PDF scanné / image (OCR Tesseract,
            plus long).
          </p>
          <input type="file" ref={fileInputRef}
            accept="application/pdf,image/jpeg,image/png,image/jpg"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            Choisir un fichier
          </button>
          <div className="mt-4 text-[11px] text-muted">
            Formats : PDF · JPG · PNG · Limite 20 MB
          </div>
        </div>
      )}

      {/* Progress */}
      {(stage === "extracting_pdf" || stage === "ocr_running" || stage === "parsing") && (
        <div className="mt-6 rounded-xl border border-navy/20 bg-navy/5 p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-navy">
            {stage === "extracting_pdf" && "Extraction du texte PDF…"}
            {stage === "ocr_running" && "OCR Tesseract en cours (30s-2min selon taille)…"}
            {stage === "parsing" && "Analyse des champs…"}
          </h2>
          <div className="mt-4 mx-auto max-w-md">
            <div className="h-3 w-full rounded-full bg-background overflow-hidden">
              <div className="h-full bg-navy transition-all" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-2 text-xs text-muted">{progress}%</div>
          </div>
          {method === "tesseract_ocr" && (
            <div className="mt-3 text-[11px] text-muted">
              💡 Tesseract.js charge ~20MB de données OCR la 1re fois (cache ensuite).
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
              ← Nouveau fichier
            </button>
            <span className="text-sm text-muted">
              Méthode : <strong>{method === "pdf_text" ? "PDF.js (texte digital)" : "Tesseract.js (OCR)"}</strong>
            </span>
            <span className={`rounded-full px-3 py-1 text-xs font-bold ${
              extracted.confidence >= 70 ? "bg-emerald-100 text-emerald-900" :
              extracted.confidence >= 40 ? "bg-amber-100 text-amber-900" :
              "bg-rose-100 text-rose-900"
            }`}>
              Confiance {extracted.confidence}%
            </span>
          </div>

          <section className="mt-5 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
              Données extraites ({extracted.detected_fields.length} champs trouvés)
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Fournisseur" value={extracted.supplier_name} />
              <Field label="N° TVA" value={extracted.supplier_vat} mono />
              <Field label="IBAN" value={extracted.supplier_iban} mono />
              <Field label="BIC" value={extracted.supplier_bic} mono />
              <Field label="N° facture" value={extracted.invoice_number} mono />
              <Field label="Date facture" value={extracted.invoice_date} mono />
              <Field label="Date échéance" value={extracted.due_date} mono />
              <Field label="Référence paiement" value={extracted.payment_reference} mono />
              <Field label="Montant HT"
                value={extracted.amount_ht !== null ? formatEUR(extracted.amount_ht) : null} mono />
              <Field label="Montant TVA"
                value={extracted.amount_tva !== null ? formatEUR(extracted.amount_tva) : null} mono />
              <Field label="Taux TVA"
                value={extracted.tva_rate !== null ? `${extracted.tva_rate}%` : null} mono />
              <Field label="Montant TTC"
                value={extracted.amount_ttc !== null ? formatEUR(extracted.amount_ttc) : null}
                mono highlight />
            </div>

            {extracted.confidence < 70 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
                ⚠️ Confiance faible. Vérifiez manuellement toutes les valeurs avant saisie
                en comptabilité.
              </div>
            )}

            {/* Boutons actions */}
            <div className="mt-5 flex flex-wrap gap-2">
              {extracted.supplier_iban && extracted.amount_ttc && (
                <Link href={`/syndic/coproprietes/${coownershipId}/sepa-virements`}
                  className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                  → Créer virement SEPA
                </Link>
              )}
              <button onClick={async () => {
                const json = JSON.stringify(extracted, null, 2);
                await navigator.clipboard.writeText(json);
                alert("Données JSON copiées dans le presse-papier");
              }}
                className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">
                📋 Copier JSON
              </button>
            </div>
          </section>

          {/* Raw text collapsible */}
          <details className="mt-4">
            <summary className="cursor-pointer text-xs text-muted font-semibold">
              Texte brut extrait ({rawText.length} caractères)
            </summary>
            <pre className="mt-2 rounded-lg border border-card-border bg-background p-3 text-[10px] whitespace-pre-wrap max-h-96 overflow-y-auto font-mono">
              {rawText}
            </pre>
          </details>
        </>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Comment ça marche :</strong>
        <ul className="mt-1 ml-4 list-disc space-y-1">
          <li>PDF.js essaie d&apos;abord d&apos;extraire le texte natif (digital, instantané).</li>
          <li>Si le PDF est scanné (moins de 50 caractères trouvés), Tesseract.js OCR démarre.</li>
          <li>Tesseract télécharge ~20MB de données FRA+ENG la 1re fois puis cache localement.</li>
          <li>Parser heuristique identifie montants / TVA / IBAN / dates via regex LU/EU.</li>
          <li>100% client-side, aucune donnée envoyée à un service externe.</li>
          <li>Confiance ≥ 70% : automatisable · &lt; 70% : validation manuelle requise.</li>
        </ul>
      </div>
    </div>
  );
}

function Field({ label, value, mono, highlight }: {
  label: string; value: string | null; mono?: boolean; highlight?: boolean;
}) {
  return (
    <div className={`rounded-lg border ${highlight ? "border-navy bg-navy/5" : "border-card-border/50 bg-background"} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-sm ${mono ? "font-mono" : ""} ${highlight ? "text-lg font-bold text-navy" : "text-slate"} ${value === null ? "text-muted italic" : ""}`}>
        {value ?? "— non détecté"}
      </div>
    </div>
  );
}
