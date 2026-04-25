"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { createContact } from "@/lib/crm";
import {
  buildImportResult, detectColumnMapping,
  type CsvImportResult,
} from "@/lib/crm/import-csv";
import { errMsg } from "@/lib/errors";

export default function ContactsImportPage() {
  const t = useTranslations("proaCrmImport");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [result, setResult] = useState<CsvImportResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [defaultKind, setDefaultKind] = useState<"prospect" | "lead" | "acquereur">("prospect");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setResult(null);
    try {
      const content = await file.text();
      const parsed = buildImportResult(content);
      setResult(parsed);
      setMapping(detectColumnMapping(parsed.headers));
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleDoImport = async () => {
    if (!result) return;
    if (!confirm(t("confirmImport", { n: result.valid }))) return;
    setImporting(true);
    setImported(0);
    let done = 0;
    let failed = 0;
    for (const row of result.rows) {
      if (row.errors.length > 0) continue;
      try {
        const p = row.parsed;
        await createContact({
          kind: p.kind || defaultKind,
          is_company: p.is_company,
          first_name: p.first_name,
          last_name: p.last_name,
          company_name: p.company_name,
          email: p.email,
          phone: p.phone,
          address: p.address,
          postal_code: p.postal_code,
          city: p.city,
          country: p.country,
          budget_min: p.budget_min,
          budget_max: p.budget_max,
          target_surface_min: p.target_surface_min,
          target_surface_max: p.target_surface_max,
          target_zones: p.target_zones,
          tags: p.tags,
          notes: p.notes,
        });
        done++;
        setImported(done);
      } catch {
        failed++;
      }
    }
    setImporting(false);
    alert(t("importDone", { ok: done, ko: failed }));
    router.push(`${lp}/pro-agences/crm/contacts`);
  };

  if (authLoading) return <div className="mx-auto max-w-4xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href={`${lp}/connexion`} className="text-navy underline">{t("login")}</Link></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link href={`${lp}/pro-agences/crm/contacts`} className="text-xs text-muted hover:text-navy">{t("backContacts")}</Link>

      <h1 className="mt-3 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitle")}
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {!result && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-navy/20 bg-navy/5 p-12 text-center">
          <div className="text-4xl mb-3">📂</div>
          <h2 className="text-lg font-bold text-navy">{t("uploadTitle")}</h2>
          <p className="mt-2 text-xs text-muted">
            {t("uploadHint")}
          </p>
          <input type="file" ref={fileInputRef} accept=".csv,text/csv"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }}
            className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-navy px-6 py-3 text-sm font-semibold text-white hover:bg-navy-light">
            {t("btnChoose")}
          </button>
          <div className="mt-6 text-[11px] text-muted">
            <strong>{t("columnsRecognized")}</strong> {t("columnsList")}
          </div>
        </div>
      )}

      {result && !importing && (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Stat label={t("statTotal")} value={result.total} />
            <Stat label={t("statValid")} value={result.valid} tone="emerald" />
            <Stat label={t("statInvalid")} value={result.invalid} tone="rose" />
            <Stat label={t("statDelimiter")} value={result.delimiter} />
          </div>

          <div className="mt-5 rounded-xl border border-card-border bg-card p-4">
            <label className="text-xs">
              <span className="text-muted">{t("defaultKindLabel")}</span>
              <select value={defaultKind}
                onChange={(e) => setDefaultKind(e.target.value as "prospect" | "lead" | "acquereur")}
                className="ml-2 rounded border border-input-border bg-input-bg px-2 py-1 text-xs">
                <option value="prospect">{t("kindProspect")}</option>
                <option value="lead">{t("kindLead")}</option>
                <option value="acquereur">{t("kindAcquereur")}</option>
              </select>
            </label>
          </div>

          <div className="mt-4 rounded-xl border border-card-border bg-card p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">
              {t("mappingTitle")}
            </h3>
            <div className="flex flex-wrap gap-2 text-[11px]">
              {Object.entries(mapping).map(([target, source]) => (
                <span key={target} className="rounded-full bg-background px-2 py-0.5">
                  <span className="font-mono text-navy">{target}</span>
                  {" ← "}
                  <span className="font-mono text-muted">{source}</span>
                </span>
              ))}
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-card-border bg-card overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-2 py-2 text-left">{t("colNum")}</th>
                  <th className="px-2 py-2 text-left">{t("colName")}</th>
                  <th className="px-2 py-2 text-left">{t("colEmail")}</th>
                  <th className="px-2 py-2 text-left">{t("colPhone")}</th>
                  <th className="px-2 py-2 text-left">{t("colBudget")}</th>
                  <th className="px-2 py-2 text-left">{t("colZones")}</th>
                  <th className="px-2 py-2 text-left">{t("colErrors")}</th>
                </tr>
              </thead>
              <tbody>
                {result.rows.slice(0, 50).map((row, i) => (
                  <tr key={i} className={row.errors.length > 0 ? "bg-rose-50/40" : ""}>
                    <td className="px-2 py-1 font-mono text-[10px]">{i + 1}</td>
                    <td className="px-2 py-1">
                      {row.parsed.is_company
                        ? row.parsed.company_name
                        : [row.parsed.first_name, row.parsed.last_name].filter(Boolean).join(" ")}
                    </td>
                    <td className="px-2 py-1 text-[10px]">{row.parsed.email ?? t("dash")}</td>
                    <td className="px-2 py-1 text-[10px]">{row.parsed.phone ?? t("dash")}</td>
                    <td className="px-2 py-1 text-[10px]">
                      {row.parsed.budget_min || row.parsed.budget_max
                        ? `${row.parsed.budget_min ?? "?"}-${row.parsed.budget_max ?? "?"}`
                        : t("dash")}
                    </td>
                    <td className="px-2 py-1 text-[10px]">
                      {row.parsed.target_zones.join(", ") || t("dash")}
                    </td>
                    <td className="px-2 py-1 text-[10px] text-rose-700">
                      {row.errors.join("; ") || "✓"}
                    </td>
                  </tr>
                ))}
                {result.rows.length > 50 && (
                  <tr><td colSpan={7} className="px-2 py-2 text-center text-[10px] text-muted">
                    {t("moreLines", { n: result.rows.length - 50 })}
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex gap-2">
            <button onClick={() => setResult(null)}
              className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-slate hover:bg-background">
              {t("btnChangeFile")}
            </button>
            {result.valid > 0 && (
              <button onClick={handleDoImport}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {t("btnImport", { n: result.valid })}
              </button>
            )}
          </div>
        </>
      )}

      {importing && result && (
        <div className="mt-6 rounded-xl border border-navy/20 bg-navy/5 p-8 text-center">
          <div className="text-3xl mb-3">⏳</div>
          <h2 className="text-lg font-bold text-navy">{t("importingTitle")}</h2>
          <div className="mt-3 text-sm text-muted">
            {t("importingProgress", { ok: imported, total: result.valid })}
          </div>
          <div className="mt-4 h-2 w-full rounded-full bg-background overflow-hidden max-w-sm mx-auto">
            <div className="h-full bg-emerald-500 transition-all"
              style={{ width: `${(imported / Math.max(1, result.valid)) * 100}%` }} />
          </div>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("rgpdTitle")}</strong> {t("rgpdBody")}
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone?: "emerald" | "rose" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "rose" ? "bg-rose-50 border-rose-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "rose" ? "text-rose-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
