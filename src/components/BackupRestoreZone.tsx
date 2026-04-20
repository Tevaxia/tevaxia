"use client";

import { useState, type ChangeEvent, type DragEvent } from "react";
import { useTranslations } from "next-intl";
import { parseBackupZip, applyBackup, canRestore, type ParsedBackup, type RestoreResult } from "@/lib/backup/restore";

type State =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "preview"; parsed: ParsedBackup }
  | { kind: "applying"; parsed: ParsedBackup }
  | { kind: "done"; parsed: ParsedBackup; result: RestoreResult }
  | { kind: "error"; message: string };

export default function BackupRestoreZone() {
  const t = useTranslations("backup");
  const [state, setState] = useState<State>({ kind: "idle" });
  const [skipExisting, setSkipExisting] = useState(true);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = async (file: File) => {
    setState({ kind: "parsing" });
    try {
      const parsed = await parseBackupZip(file);
      setState({ kind: "preview", parsed });
    } catch (e) {
      setState({ kind: "error", message: e instanceof Error ? e.message : String(e) });
    }
  };

  const onFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleFile(f);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const onApply = async () => {
    if (state.kind !== "preview") return;
    setState({ kind: "applying", parsed: state.parsed });
    const result = await applyBackup(state.parsed, { skipExisting });
    setState({ kind: "done", parsed: state.parsed, result });
  };

  const reset = () => setState({ kind: "idle" });

  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <h2 className="text-sm font-semibold text-navy">{t("restoreTitle")}</h2>
      <p className="mt-1 text-xs text-muted">{t("restoreDesc")}</p>

      {state.kind === "idle" && (
        <label
          htmlFor="restore-file"
          onDragEnter={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={() => setDragActive(false)}
          onDrop={onDrop}
          className={`mt-4 block rounded-lg border-2 border-dashed p-6 text-center text-xs cursor-pointer transition-colors ${
            dragActive ? "border-navy bg-navy/5" : "border-card-border hover:border-navy/50"
          }`}
        >
          <input id="restore-file" type="file" accept=".zip" onChange={onFileInput} className="sr-only" />
          <div className="text-slate font-medium">{t("restoreDrop")}</div>
          <div className="mt-1 text-muted">{t("restoreDropHint")}</div>
        </label>
      )}

      {state.kind === "parsing" && (
        <p className="mt-4 text-xs text-muted">{t("restoreParsing")}</p>
      )}

      {state.kind === "preview" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg border border-card-border bg-background p-3 text-xs">
            <div className="font-medium text-navy">
              Module : <span className="font-mono">{state.parsed.manifest.module}</span>
            </div>
            <div className="mt-0.5 text-muted">
              Exporté le {new Date(state.parsed.manifest.exportedAt).toLocaleString("fr-LU")}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5 text-slate">
              {Object.entries(state.parsed.manifest.counts).map(([k, v]) => (
                <span key={k}><span className="text-muted">{k}:</span> <span className="font-mono">{v}</span></span>
              ))}
              {state.parsed.pdfCount > 0 && (
                <span><span className="text-muted">pdfs:</span> <span className="font-mono">{state.parsed.pdfCount}</span></span>
              )}
            </div>
          </div>

          {!canRestore(state.parsed.manifest.module) && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              {t("restoreNotSupported")}
            </div>
          )}

          {canRestore(state.parsed.manifest.module) && (
            <>
              <label className="flex items-center gap-2 text-xs text-slate">
                <input
                  type="checkbox"
                  checked={skipExisting}
                  onChange={(e) => setSkipExisting(e.target.checked)}
                  className="rounded"
                />
                {t("restoreSkipExisting")}
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onApply}
                  className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light"
                >
                  {t("restoreApply")}
                </button>
                <button
                  type="button"
                  onClick={reset}
                  className="rounded-lg border border-card-border bg-white px-4 py-2 text-xs font-medium text-navy hover:bg-slate-50"
                >
                  {t("restoreCancel")}
                </button>
              </div>
            </>
          )}

          {!canRestore(state.parsed.manifest.module) && (
            <button type="button" onClick={reset} className="rounded-lg border border-card-border bg-white px-4 py-2 text-xs font-medium text-navy hover:bg-slate-50">
              {t("restoreCancel")}
            </button>
          )}
        </div>
      )}

      {state.kind === "applying" && (
        <p className="mt-4 text-xs text-muted">{t("restoreApplying")}</p>
      )}

      {state.kind === "done" && (
        <div className="mt-4 space-y-2">
          <div className={`rounded-lg border p-3 text-xs ${state.result.applied ? "border-emerald-200 bg-emerald-50 text-emerald-900" : "border-rose-200 bg-rose-50 text-rose-900"}`}>
            <div className="font-medium">
              {state.result.applied ? t("restoreDone") : t("restoreFailed")}
            </div>
            {Object.keys(state.result.imported).length > 0 && (
              <div className="mt-1">
                {t("restoreImported")}: {Object.entries(state.result.imported).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </div>
            )}
            {Object.keys(state.result.skipped).length > 0 && (
              <div className="mt-0.5">
                {t("restoreSkippedLabel")}: {Object.entries(state.result.skipped).map(([k, v]) => `${k}: ${v}`).join(" · ")}
              </div>
            )}
            {state.result.errors.length > 0 && (
              <ul className="mt-1 list-disc pl-5">
                {state.result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            )}
          </div>
          <button type="button" onClick={reset} className="rounded-lg border border-card-border bg-white px-4 py-2 text-xs font-medium text-navy hover:bg-slate-50">
            {t("restoreAnother")}
          </button>
        </div>
      )}

      {state.kind === "error" && (
        <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
          {state.message}
          <button type="button" onClick={reset} className="ml-2 underline">
            {t("restoreRetry")}
          </button>
        </div>
      )}
    </section>
  );
}
