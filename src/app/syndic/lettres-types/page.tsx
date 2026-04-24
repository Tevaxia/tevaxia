"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  SYNDIC_LETTER_TEMPLATES, SYNDIC_CATEGORY_LABELS, SYNDIC_CATEGORY_COLORS,
  renderSyndicTemplate,
  type SyndicLetterTemplate, type SyndicTemplateCategory,
} from "@/lib/coownership-letter-templates";
import {
  loadCustomTemplates, upsertCustomTemplate, deleteCustomTemplate,
  createCustomTemplateFromText, extractVariables,
} from "@/lib/coownership-letter-custom";
import {
  exportToDocx, exportToPdf, downloadBlob, downloadBytes, safeFilename,
} from "@/lib/coownership-letter-export";
import { track } from "@/lib/analytics";

const DEFAULT_VARS: Record<string, string> = {
  copropriete: "Résidence Les Jardins",
  adresse_copropriete: "15 rue de la Paix, Luxembourg",
  syndic_nom: "Jean Martin, Syndic",
  date_ag: "jeudi 15 mai 2026",
  heure_ag: "18h30",
  lieu_ag: "Salle commune, rez-de-chaussée",
  objet: "Rénovation façade nord",
  details: "Surface : environ 200 m². Enduit existant à reprendre.",
  montant: "45 000 EUR TTC",
  iban: "LU28 0019 4006 4475 0000",
  bic: "BCEELULL",
  beneficiaire: "Syndicat copropriété",
  reference: "COPRO-LOT12-2026T1",
};

export default function SyndicLetterTemplatesPage() {
  const locale = useLocale();
  const t = useTranslations("syndicLettres");
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [filter, setFilter] = useState<SyndicTemplateCategory | "all" | "custom">("all");
  const [selected, setSelected] = useState<SyndicLetterTemplate | null>(null);
  const [customs, setCustoms] = useState<SyndicLetterTemplate[]>([]);
  const [vars, setVars] = useState<Record<string, string>>(DEFAULT_VARS);
  const [editing, setEditing] = useState<SyndicLetterTemplate | null>(null);
  const [importing, setImporting] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    setCustoms(loadCustomTemplates());
  }, []);

  const allTemplates = useMemo(() => [...customs, ...SYNDIC_LETTER_TEMPLATES], [customs]);
  const filtered = useMemo(() => {
    if (filter === "all") return allTemplates;
    if (filter === "custom") return customs;
    return allTemplates.filter((t) => t.category === filter);
  }, [filter, allTemplates, customs]);

  const showFlash = (msg: string) => {
    setFlash(msg);
    setTimeout(() => setFlash(null), 2500);
  };

  const handleSaveEdit = (updated: SyndicLetterTemplate) => {
    // Les templates "officiels" édités deviennent des customs (fork)
    const isOfficial = SYNDIC_LETTER_TEMPLATES.some((t) => t.id === updated.id);
    const final: SyndicLetterTemplate = isOfficial
      ? { ...updated, id: `custom-${updated.id}-${Date.now().toString(36)}`, title: `${updated.title} ${t("customSuffix")}` }
      : updated;
    final.variables = extractVariables(final.body, final.subject);
    upsertCustomTemplate(final);
    setCustoms(loadCustomTemplates());
    setEditing(null);
    setSelected(final);
    track(isOfficial ? "letter_forked" : "letter_edited", {
      template_id: updated.id,
      category: updated.category,
    });
    showFlash(isOfficial ? t("flashForked") : t("flashEdited"));
  };

  const handleDeleteCustom = (id: string) => {
    if (!confirm(t("confirmDelete"))) return;
    deleteCustomTemplate(id);
    setCustoms(loadCustomTemplates());
    if (selected?.id === id) setSelected(null);
    showFlash(t("flashDeleted"));
  };

  const handleImport = (title: string, category: SyndicTemplateCategory, subject: string, body: string) => {
    const tpl = createCustomTemplateFromText({ title, category, subject, body });
    upsertCustomTemplate(tpl);
    setCustoms(loadCustomTemplates());
    setImporting(false);
    setSelected(tpl);
    setFilter("custom");
    track("letter_imported", { category, body_length: body.length });
    showFlash(t("flashImported"));
  };

  const handleImportFile = async (file: File, category: SyndicTemplateCategory) => {
    try {
      let text: string;
      const isDocx = file.name.toLowerCase().endsWith(".docx") ||
        file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      if (isDocx) {
        const mammoth = await import("mammoth/mammoth.browser");
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }
      const lines = text.split(/\r?\n/).filter((l, i, arr) => i === 0 || l.length > 0 || arr[i - 1].length > 0);
      const subjectLine = lines.find((l) => l.trim().length > 0) ?? file.name;
      const bodyLines = lines.slice(lines.indexOf(subjectLine) + 1).join("\n").trim();
      handleImport(file.name.replace(/\.[^.]+$/, ""), category, subjectLine.trim(), bodyLines || text);
    } catch (e) {
      alert(t("fileReadError", { msg: (e as Error).message }));
    }
  };

  const isCustom = (t: SyndicLetterTemplate) => t.id.startsWith("custom-");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href={`${lp}/syndic`} className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>

      <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">
            {t("pageSubtitle", { official: SYNDIC_LETTER_TEMPLATES.length, custom: customs.length })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setImporting(true)}
            className="rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy hover:text-white transition-colors">
            {t("btnImport")}
          </button>
        </div>
      </div>

      {flash && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
          {flash}
        </div>
      )}

      {/* Filters */}
      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setFilter("all")}
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            filter === "all" ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
          }`}>
          {t("filterAll", { n: allTemplates.length })}
        </button>
        {customs.length > 0 && (
          <button onClick={() => setFilter("custom")}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === "custom" ? "bg-navy text-white" : "bg-amber-100 border border-amber-300 text-amber-900"
            }`}>
            {t("filterMine", { n: customs.length })}
          </button>
        )}
        {(Object.entries(SYNDIC_CATEGORY_LABELS) as [SyndicTemplateCategory, string][]).map(([k, l]) => {
          const count = allTemplates.filter((tpl) => tpl.category === k).length;
          return (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                filter === k ? "bg-navy text-white" : SYNDIC_CATEGORY_COLORS[k]
              }`}>
              {t("filterCat", { label: l, n: count })}
            </button>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_420px]">
        {/* Liste */}
        <div className="space-y-3">
          {filtered.map((tpl) => (
            <div key={tpl.id}
              className={`rounded-xl border transition-colors ${
                selected?.id === tpl.id
                  ? "border-navy bg-navy/5 ring-1 ring-navy"
                  : "border-card-border bg-card hover:bg-background"
              }`}>
              <button onClick={() => setSelected(tpl)}
                className="w-full text-left p-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${SYNDIC_CATEGORY_COLORS[tpl.category]}`}>
                    {SYNDIC_CATEGORY_LABELS[tpl.category]}
                  </span>
                  {isCustom(tpl) && (
                    <span className="rounded-full bg-amber-100 text-amber-900 px-2 py-0.5 text-[10px] font-semibold">
                      {t("badgeCustom")}
                    </span>
                  )}
                </div>
                <h3 className="mt-1 text-sm font-bold text-navy">{tpl.title}</h3>
                {tpl.description && <p className="mt-0.5 text-xs text-muted">{tpl.description}</p>}
                <div className="mt-2 flex flex-wrap gap-1">
                  {tpl.variables.slice(0, 6).map((v) => (
                    <span key={v} className="rounded bg-background px-1.5 py-0.5 text-[9px] font-mono text-muted">
                      {`{${v}}`}
                    </span>
                  ))}
                  {tpl.variables.length > 6 && (
                    <span className="text-[9px] text-muted">+{tpl.variables.length - 6}</span>
                  )}
                </div>
              </button>
              <div className="border-t border-card-border/50 px-4 py-2 flex justify-end gap-2">
                <button onClick={() => setEditing(tpl)}
                  className="text-[11px] font-semibold text-navy hover:underline">
                  {t("btnEdit")}
                </button>
                {isCustom(tpl) && (
                  <button onClick={() => handleDeleteCustom(tpl.id)}
                    className="text-[11px] font-semibold text-rose-700 hover:underline">
                    {t("btnDelete")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Panel */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          {selected ? (
            <SyndicTemplatePreview
              template={selected}
              vars={vars}
              onChangeVar={(key, val) => setVars({ ...vars, [key]: val })}
              onEdit={() => setEditing(selected)}
              onFlash={showFlash}
            />
          ) : (
            <div className="rounded-xl border-2 border-dashed border-card-border p-8 text-center text-sm text-muted">
              {t("previewEmpty")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("usageStrong")}</strong> {t("usageBody")}
      </div>

      {/* Modal éditeur */}
      {editing && (
        <EditorModal
          template={editing}
          onSave={handleSaveEdit}
          onClose={() => setEditing(null)}
          isOfficial={SYNDIC_LETTER_TEMPLATES.some((t) => t.id === editing.id)}
        />
      )}

      {/* Modal import */}
      {importing && (
        <ImportModal
          onImport={handleImport}
          onImportFile={handleImportFile}
          onClose={() => setImporting(false)}
        />
      )}
    </div>
  );
}

function SyndicTemplatePreview({ template, vars, onChangeVar, onEdit, onFlash }: {
  template: SyndicLetterTemplate;
  vars: Record<string, string>;
  onChangeVar: (key: string, val: string) => void;
  onEdit: () => void;
  onFlash: (msg: string) => void;
}) {
  const t = useTranslations("syndicLettres");
  const rendered = renderSyndicTemplate(template, vars);
  const [email, setEmail] = useState("");
  const [exporting, setExporting] = useState(false);

  const filename = safeFilename(`${template.title}-${new Date().toISOString().slice(0, 10)}`);

  const mailtoUrl = () => {
    const addr = email || "destinataire@example.com";
    return `mailto:${addr}?subject=${encodeURIComponent(rendered.subject)}&body=${encodeURIComponent(rendered.body)}`;
  };

  const copyBody = async () => {
    try {
      await navigator.clipboard.writeText(rendered.body);
      onFlash(t("flashCopied"));
    } catch { /* silence */ }
  };

  const doExportDocx = async () => {
    setExporting(true);
    try {
      const blob = await exportToDocx(rendered);
      downloadBlob(blob, `${filename}.docx`);
      track("letter_exported", { format: "docx", template_id: template.id, category: template.category });
      onFlash(t("flashDocx"));
    } finally {
      setExporting(false);
    }
  };

  const doExportPdf = async () => {
    setExporting(true);
    try {
      const bytes = await exportToPdf(rendered);
      downloadBytes(bytes, `${filename}.pdf`, "application/pdf");
      track("letter_exported", { format: "pdf", template_id: template.id, category: template.category });
      onFlash(t("flashPdf"));
    } finally {
      setExporting(false);
    }
  };

  const doExportGoogleDrive = async () => {
    setExporting(true);
    try {
      const blob = await exportToDocx(rendered);
      downloadBlob(blob, `${filename}.docx`);
      window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener");
      track("letter_exported", { format: "google_drive", template_id: template.id, category: template.category });
      onFlash(t("flashDrive"));
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="rounded-xl border border-card-border bg-card p-5 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">
            {t("selectedLabel")}
          </div>
          <h3 className="mt-0.5 text-sm font-bold text-navy">{template.title}</h3>
        </div>
        <button onClick={onEdit}
          className="rounded-md border border-navy bg-white px-2 py-1 text-[11px] font-semibold text-navy hover:bg-navy hover:text-white">
          {t("btnEdit")}
        </button>
      </div>

      {template.variables.length > 0 && (
        <div className="border-t border-card-border pt-3">
          <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-2">
            {t("variablesLabel", { n: template.variables.length })}
          </div>
          <div className="grid grid-cols-1 gap-2">
            {template.variables.map((v) => (
              <label key={v} className="text-[10px]">
                <span className="text-muted font-mono">{`{${v}}`}</span>
                <input type="text" value={vars[v] ?? ""}
                  onChange={(e) => onChangeVar(v, e.target.value)}
                  className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1 text-xs" />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="border-t border-card-border pt-3">
        <label className="text-[10px]">
          <span className="text-muted font-semibold uppercase tracking-wider">{t("emailLabel")}</span>
          <input type="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("emailPlaceholder")}
            className="mt-0.5 w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-xs" />
        </label>
      </div>

      <div className="border-t border-card-border pt-3">
        <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">{t("previewHeader")}</div>
        <div className="rounded border border-card-border/50 bg-background p-3 text-xs">
          <div className="font-semibold text-navy mb-1">{rendered.subject}</div>
          <pre className="whitespace-pre-wrap font-sans text-slate text-[11px] leading-relaxed max-h-72 overflow-y-auto">
            {rendered.body}
          </pre>
        </div>
      </div>

      <div className="border-t border-card-border pt-3 grid grid-cols-2 gap-2">
        <a href={mailtoUrl()}
          className="rounded-lg bg-navy px-3 py-2 text-center text-xs font-semibold text-white hover:bg-navy-light">
          {t("btnEmail")}
        </a>
        <button onClick={copyBody}
          className="rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/5">
          {t("btnCopy")}
        </button>
        <button onClick={doExportDocx} disabled={exporting}
          className="rounded-lg border border-blue-400 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-900 hover:bg-blue-100 disabled:opacity-50">
          {t("btnDocx")}
        </button>
        <button onClick={doExportPdf} disabled={exporting}
          className="rounded-lg border border-rose-400 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-900 hover:bg-rose-100 disabled:opacity-50">
          {t("btnPdf")}
        </button>
        <button onClick={doExportGoogleDrive} disabled={exporting}
          className="col-span-2 rounded-lg border border-emerald-400 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-900 hover:bg-emerald-100 disabled:opacity-50">
          {t("btnDrive")}
        </button>
      </div>
    </div>
  );
}

function EditorModal({ template, onSave, onClose, isOfficial }: {
  template: SyndicLetterTemplate;
  onSave: (t: SyndicLetterTemplate) => void;
  onClose: () => void;
  isOfficial: boolean;
}) {
  const t = useTranslations("syndicLettres");
  const [title, setTitle] = useState(template.title);
  const [description, setDescription] = useState(template.description);
  const [category, setCategory] = useState(template.category);
  const [subject, setSubject] = useState(template.subject);
  const [body, setBody] = useState(template.body);

  const detectedVars = extractVariables(body, subject);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-navy">{t("editModalTitle")}</h2>
            {isOfficial && (
              <p className="mt-1 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded px-2 py-1 inline-block">
                {t("officialWarn")}
              </p>
            )}
          </div>
          <button onClick={onClose} className="text-muted hover:text-navy text-xl">✕</button>
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <div className="text-muted font-medium mb-0.5">{t("fieldTitle")}</div>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <div className="text-muted font-medium mb-0.5">{t("fieldCategory")}</div>
              <select value={category} onChange={(e) => setCategory(e.target.value as SyndicTemplateCategory)}
                className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm">
                {(Object.entries(SYNDIC_CATEGORY_LABELS) as [SyndicTemplateCategory, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="text-xs block">
            <div className="text-muted font-medium mb-0.5">{t("fieldDescription")}</div>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs block">
            <div className="text-muted font-medium mb-0.5">{t("fieldSubject")}</div>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs block">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-muted font-medium">{t("fieldBody")}</span>
              <span className="text-muted">{t("fieldBodyHint")}</span>
            </div>
            <textarea value={body} onChange={(e) => setBody(e.target.value)}
              className="w-full rounded border border-input-border bg-input-bg px-2 py-2 text-xs font-mono leading-relaxed"
              rows={16} />
          </label>
          <div className="rounded-lg border border-card-border bg-background p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted font-semibold mb-1">
              {t("detectedVariables", { n: detectedVars.length })}
            </div>
            <div className="flex flex-wrap gap-1">
              {detectedVars.length === 0 ? (
                <span className="text-[11px] text-muted italic">{t("noneDetected")}</span>
              ) : detectedVars.map((v) => (
                <span key={v} className="rounded bg-white border border-card-border px-1.5 py-0.5 text-[10px] font-mono text-navy">
                  {`{${v}}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-lg border border-card-border bg-white px-4 py-2 text-xs font-semibold text-slate hover:bg-background">
            {t("btnCancel")}
          </button>
          <button onClick={() => onSave({ ...template, title, description, category, subject, body, variables: detectedVars })}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light">
            {t("btnSave")}
          </button>
        </div>
      </div>
    </div>
  );
}

function ImportModal({ onImport, onImportFile, onClose }: {
  onImport: (title: string, category: SyndicTemplateCategory, subject: string, body: string) => void;
  onImportFile: (file: File, category: SyndicTemplateCategory) => void;
  onClose: () => void;
}) {
  const t = useTranslations("syndicLettres");
  const [title, setTitle] = useState(t("defaultCustomTitle"));
  const [category, setCategory] = useState<SyndicTemplateCategory>("amiable");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-bold text-navy">{t("importModalTitle")}</h2>
          <button onClick={onClose} className="text-muted hover:text-navy text-xl">✕</button>
        </div>

        <div className="space-y-4">
          {/* Import fichier */}
          <div className="rounded-xl border border-card-border bg-background p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">{t("importOption1")}</div>
            <p className="text-xs text-muted mb-3">
              {t("importOption1Body")}
            </p>
            <div className="flex items-center gap-2">
              <select value={category} onChange={(e) => setCategory(e.target.value as SyndicTemplateCategory)}
                className="rounded border border-input-border bg-input-bg px-2 py-1.5 text-xs">
                {(Object.entries(SYNDIC_CATEGORY_LABELS) as [SyndicTemplateCategory, string][]).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input type="file" accept=".txt,.md,.docx,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onImportFile(f, category);
                }}
                className="flex-1 text-xs text-muted file:mr-2 file:rounded file:border-0 file:bg-navy file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-navy-light" />
            </div>
          </div>

          {/* Saisie manuelle */}
          <div className="rounded-xl border border-card-border bg-background p-4">
            <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">{t("importOption2")}</div>
            <div className="space-y-2">
              <label className="text-xs block">
                <div className="text-muted mb-0.5">{t("fieldTitle")}</div>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs block">
                <div className="text-muted mb-0.5">{t("fieldSubject")}</div>
                <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("importSubjectPlaceholder")}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
              </label>
              <label className="text-xs block">
                <div className="text-muted mb-0.5">{t("importBodyHint")}</div>
                <textarea value={body} onChange={(e) => setBody(e.target.value)}
                  placeholder={t("importBodyPlaceholder")}
                  className="w-full rounded border border-input-border bg-input-bg px-2 py-2 text-xs font-mono"
                  rows={10} />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose}
            className="rounded-lg border border-card-border bg-white px-4 py-2 text-xs font-semibold text-slate hover:bg-background">
            {t("btnCancel")}
          </button>
          <button onClick={() => onImport(title, category, subject, body)}
            disabled={!title.trim() || !subject.trim() || !body.trim()}
            className="rounded-lg bg-navy px-4 py-2 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            {t("btnCreateTpl")}
          </button>
        </div>
      </div>
    </div>
  );
}
