"use client";

import { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { computeTotals, validateInvoice, formatInvoiceNumber, VAT_RATES_FR, VAT_RATES_LU, type FacturXInvoice, type FacturXLine, type VatCategoryCode } from "@/lib/facturation/factur-x";
import { generateFacturXPdf } from "@/lib/facturation/factur-x-pdf";
import { saveToHistory } from "@/lib/facturation/history";
import { track } from "@/lib/analytics";

type TemplateId = "generic" | "landlord" | "syndic" | "hotel" | "lease" | "valuer";

const STORAGE_KEY = "tevaxia-facturation-draft";

function fmt2(n: number): string { return n.toFixed(2); }
function formatEUR(n: number, currency = "EUR"): string {
  if (!isFinite(n)) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);
}

function blankLine(): FacturXLine {
  return { id: "", name: "", quantity: 1, unit_code: "C62", unit_price_net: 0, vat_category: "S", vat_rate_percent: 20 };
}

function applyTemplate(tpl: TemplateId, current: FacturXInvoice): FacturXInvoice {
  const base = { ...current };
  const now = new Date();
  const due = new Date(now.getTime() + 30 * 86400000);

  switch (tpl) {
    case "landlord":
      return {
        ...base,
        lines: [{
          id: "1",
          name: `Loyer ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
          quantity: 1,
          unit_code: "MON",
          unit_price_net: 0,
          vat_category: "E",
          vat_rate_percent: 0,
        }],
        notes: ["Loyer d'habitation — exempt TVA art. 261 D CGI"],
        due_date: due.toISOString().slice(0, 10),
      };
    case "syndic":
      return {
        ...base,
        lines: [{
          id: "1",
          name: `Appel de fonds ${now.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}`,
          quantity: 1,
          unit_code: "C62",
          unit_price_net: 0,
          vat_category: "E",
          vat_rate_percent: 0,
        }],
        notes: ["Charges copropriété — tantièmes appliqués"],
      };
    case "hotel":
      return {
        ...base,
        lines: [
          { id: "1", name: "Nuitée", quantity: 1, unit_code: "DAY", unit_price_net: 0, vat_category: "S", vat_rate_percent: 3 },
          { id: "2", name: "Petit-déjeuner", quantity: 1, unit_code: "C62", unit_price_net: 0, vat_category: "S", vat_rate_percent: 17 },
        ],
        notes: ["TVA LU 3% hébergement (art. 39 L. TVA)"],
      };
    case "lease":
      return {
        ...base,
        lines: [
          { id: "1", name: "Loyer trimestriel", quantity: 1, unit_code: "3MO", unit_price_net: 0, vat_category: "S", vat_rate_percent: 20 },
          { id: "2", name: "Charges provisionnelles", quantity: 1, unit_code: "3MO", unit_price_net: 0, vat_category: "S", vat_rate_percent: 20 },
        ],
        notes: ["Bail commercial — indexation ILAT (INSEE)"],
      };
    case "valuer":
      return {
        ...base,
        lines: [{
          id: "1",
          name: "Mission d'évaluation immobilière EVS 2025",
          quantity: 1,
          unit_code: "C62",
          unit_price_net: 0,
          vat_category: "S",
          vat_rate_percent: 20,
        }],
        notes: ["Honoraires expertise TEGOVA REV/TRV"],
      };
    default:
      return base;
  }
}

function defaultInvoice(): FacturXInvoice {
  const now = new Date();
  const due = new Date(now.getTime() + 30 * 86400000);
  return {
    profile: "BASIC",
    document_type: "380",
    invoice_number: formatInvoiceNumber("F", now.getFullYear(), 1),
    issue_date: now.toISOString().slice(0, 10),
    due_date: due.toISOString().slice(0, 10),
    currency: "EUR",
    seller: { name: "", country_code: "FR" },
    buyer: { name: "", country_code: "FR" },
    lines: [blankLine()],
    notes: [],
  };
}

export default function EmissionPage() {
  const t = useTranslations("facturation.emission");
  const tHist = useTranslations("facturation.historique");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [inv, setInv] = useState<FacturXInvoice>(defaultInvoice());
  const [hydrated, setHydrated] = useState(false);
  const [template, setTemplate] = useState<TemplateId>("generic");
  const [generating, setGenerating] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setInv(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(inv)); } catch {}
  }, [inv, hydrated]);

  const totals = useMemo(() => computeTotals(inv), [inv]);
  const validation = useMemo(() => validateInvoice(inv), [inv]);

  const setSeller = <K extends keyof FacturXInvoice["seller"]>(k: K, v: FacturXInvoice["seller"][K]) => {
    setInv({ ...inv, seller: { ...inv.seller, [k]: v } });
  };
  const setBuyer = <K extends keyof FacturXInvoice["buyer"]>(k: K, v: FacturXInvoice["buyer"][K]) => {
    setInv({ ...inv, buyer: { ...inv.buyer, [k]: v } });
  };
  const setField = <K extends keyof FacturXInvoice>(k: K, v: FacturXInvoice[K]) => {
    setInv({ ...inv, [k]: v });
  };
  const updateLine = (idx: number, patch: Partial<FacturXLine>) => {
    setInv({ ...inv, lines: inv.lines.map((l, i) => i === idx ? { ...l, ...patch } : l) });
  };
  const addLine = () => setInv({ ...inv, lines: [...inv.lines, { ...blankLine(), id: String(inv.lines.length + 1) }] });
  const removeLine = (idx: number) => setInv({ ...inv, lines: inv.lines.filter((_, i) => i !== idx) });

  const applyTpl = (tpl: TemplateId) => {
    setTemplate(tpl);
    setInv(applyTemplate(tpl, inv));
  };

  const resetAll = () => {
    if (!confirm(t("resetConfirm"))) return;
    setInv(defaultInvoice());
    setTemplate("generic");
  };

  const generate = async () => {
    const errs = validateInvoice(inv);
    if (errs.length) {
      setErrors(errs.map((e) => `${e.rule}: ${e.message}`));
      setSuccess(null);
      return;
    }
    setErrors([]);
    setGenerating(true);
    try {
      const artifacts = await generateFacturXPdf(inv);
      // Download PDF
      const pdfBlob = new Blob([artifacts.pdfBytes as BlobPart], { type: "application/pdf" });
      const pdfUrl = URL.createObjectURL(pdfBlob);
      const a1 = document.createElement("a");
      a1.href = pdfUrl; a1.download = artifacts.pdfFilename;
      document.body.appendChild(a1); a1.click(); document.body.removeChild(a1);
      URL.revokeObjectURL(pdfUrl);
      // Download XML
      const xmlBlob = new Blob([artifacts.xml], { type: "application/xml" });
      const xmlUrl = URL.createObjectURL(xmlBlob);
      const a2 = document.createElement("a");
      a2.href = xmlUrl; a2.download = artifacts.xmlFilename;
      document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
      URL.revokeObjectURL(xmlUrl);
      // Sauvegarde historique (silencieux si non-auth)
      void saveToHistory(inv, template);
      track("facturation_generated", {
        template,
        currency: inv.currency,
        nb_lines: inv.lines.length,
        seller_country: inv.seller.country_code,
        buyer_country: inv.buyer.country_code,
        total_ttc: totals.grand_total,
      });
      setSuccess(t("successMsg"));
    } catch (e) {
      setErrors([(e as Error).message]);
    }
    setGenerating(false);
  };

  const vatRates = inv.seller.country_code === "LU"
    ? [VAT_RATES_LU.standard, VAT_RATES_LU.intermediate, VAT_RATES_LU.reduced, VAT_RATES_LU.super_reduced, 0]
    : [VAT_RATES_FR.standard, VAT_RATES_FR.intermediate, VAT_RATES_FR.reduced, VAT_RATES_FR.super_reduced, 0];

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href={`${lp}/facturation`} className="text-xs text-muted hover:text-navy">← {t("backLanding")}</Link>
          <h1 className="text-2xl font-bold text-navy mt-1">{t("title")}</h1>
          <p className="text-sm text-muted mt-1">{t("subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`${lp}/facturation/historique`}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            📋 {tHist("title")}
          </Link>
          <button onClick={resetAll}
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-xs font-semibold text-slate hover:bg-background">
            {t("reset")}
          </button>
        </div>
      </div>

      {/* Template selector */}
      <div className="mb-5 rounded-xl border border-card-border bg-card p-4">
        <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{t("template.label")}</div>
        <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {(["generic", "landlord", "syndic", "hotel", "lease", "valuer"] as TemplateId[]).map((tpl) => (
            <button key={tpl} onClick={() => applyTpl(tpl)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                template === tpl ? "border-navy bg-navy text-white" : "border-card-border bg-background hover:border-navy/50 text-slate"
              }`}>
              {t(`template.${tpl}`)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          {/* Invoice header */}
          <Section title={t("sections.invoice")}>
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={t("fields.invoiceNumber")} value={inv.invoice_number}
                onChange={(v) => setField("invoice_number", v)} />
              <Field label={t("fields.issueDate")} type="date" value={inv.issue_date}
                onChange={(v) => setField("issue_date", v)} />
              <Field label={t("fields.dueDate")} type="date" value={inv.due_date ?? ""}
                onChange={(v) => setField("due_date", v)} />
              <Field label={t("fields.buyerReference")} value={inv.buyer_reference ?? ""}
                onChange={(v) => setField("buyer_reference", v)} />
              <Field label={t("fields.contractReference")} value={inv.contract_reference ?? ""}
                onChange={(v) => setField("contract_reference", v)} />
              <SelectField label={t("fields.currency")} value={inv.currency}
                options={[{ v: "EUR", l: "EUR (€)" }, { v: "CHF", l: "CHF" }]}
                onChange={(v) => setField("currency", v)} />
            </div>
          </Section>

          {/* Seller */}
          <Section title={t("sections.seller")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("fields.name")} value={inv.seller.name}
                onChange={(v) => setSeller("name", v)} required />
              <Field label={t("fields.legalId")} value={inv.seller.legal_id ?? ""}
                onChange={(v) => setSeller("legal_id", v)} placeholder="SIREN / RCS" />
              <Field label={t("fields.vatId")} value={inv.seller.vat_id ?? ""}
                onChange={(v) => setSeller("vat_id", v)} placeholder="FR12345678901" />
              <SelectField label={t("fields.country")} value={inv.seller.country_code}
                options={[
                  { v: "FR", l: "France" }, { v: "LU", l: "Luxembourg" },
                  { v: "BE", l: "Belgique" }, { v: "DE", l: "Deutschland" },
                  { v: "NL", l: "Nederland" }, { v: "IT", l: "Italia" }, { v: "ES", l: "España" },
                ]}
                onChange={(v) => setSeller("country_code", v)} />
              <Field label={t("fields.address")} value={inv.seller.address_line1 ?? ""}
                onChange={(v) => setSeller("address_line1", v)} />
              <div className="grid grid-cols-[100px_1fr] gap-2">
                <Field label={t("fields.postcode")} value={inv.seller.postcode ?? ""}
                  onChange={(v) => setSeller("postcode", v)} />
                <Field label={t("fields.city")} value={inv.seller.city ?? ""}
                  onChange={(v) => setSeller("city", v)} />
              </div>
            </div>
          </Section>

          {/* Buyer */}
          <Section title={t("sections.buyer")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("fields.name")} value={inv.buyer.name}
                onChange={(v) => setBuyer("name", v)} required />
              <Field label={t("fields.vatId")} value={inv.buyer.vat_id ?? ""}
                onChange={(v) => setBuyer("vat_id", v)} />
              <Field label={t("fields.address")} value={inv.buyer.address_line1 ?? ""}
                onChange={(v) => setBuyer("address_line1", v)} />
              <div className="grid grid-cols-[100px_1fr_80px] gap-2">
                <Field label={t("fields.postcode")} value={inv.buyer.postcode ?? ""}
                  onChange={(v) => setBuyer("postcode", v)} />
                <Field label={t("fields.city")} value={inv.buyer.city ?? ""}
                  onChange={(v) => setBuyer("city", v)} />
                <SelectField label={t("fields.country")} value={inv.buyer.country_code}
                  options={[
                    { v: "FR", l: "FR" }, { v: "LU", l: "LU" },
                    { v: "BE", l: "BE" }, { v: "DE", l: "DE" },
                    { v: "NL", l: "NL" }, { v: "IT", l: "IT" }, { v: "ES", l: "ES" },
                  ]}
                  onChange={(v) => setBuyer("country_code", v)} />
              </div>
            </div>
          </Section>

          {/* Lines */}
          <Section title={t("sections.lines")}>
            <div className="space-y-3">
              {inv.lines.map((l, idx) => (
                <div key={idx} className="rounded-lg border border-card-border/50 bg-background/40 p-3">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{t("fields.line")} {idx + 1}</div>
                    {inv.lines.length > 1 && (
                      <button onClick={() => removeLine(idx)} className="text-xs text-rose-700 hover:underline">{t("removeLine")}</button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[2fr_repeat(4,1fr)]">
                    <Field label={t("fields.lineName")} value={l.name} onChange={(v) => updateLine(idx, { name: v })} />
                    <NumField label={t("fields.quantity")} value={l.quantity} step={0.01}
                      onChange={(v) => updateLine(idx, { quantity: v })} />
                    <NumField label={t("fields.unitPrice")} value={l.unit_price_net} step={0.01}
                      onChange={(v) => updateLine(idx, { unit_price_net: v })} />
                    <SelectField label={t("fields.vatRate")} value={String(l.vat_rate_percent)}
                      options={vatRates.map((r) => ({ v: String(r), l: `${r}%` }))}
                      onChange={(v) => updateLine(idx, { vat_rate_percent: Number(v) })} />
                    <SelectField label={t("fields.vatCategory")} value={l.vat_category}
                      options={[
                        { v: "S", l: "S — " + t("vat.S") },
                        { v: "E", l: "E — " + t("vat.E") },
                        { v: "Z", l: "Z — " + t("vat.Z") },
                        { v: "AE", l: "AE — " + t("vat.AE") },
                        { v: "K", l: "K — " + t("vat.K") },
                      ]}
                      onChange={(v) => updateLine(idx, { vat_category: v as VatCategoryCode })} />
                  </div>
                  <div className="mt-2">
                    <Field label={t("fields.lineDescription")} value={l.description ?? ""}
                      onChange={(v) => updateLine(idx, { description: v })} placeholder={t("fields.descriptionOpt")} />
                  </div>
                </div>
              ))}
              <button onClick={addLine}
                className="w-full rounded-lg border-2 border-dashed border-card-border py-2 text-xs font-semibold text-slate hover:border-navy hover:text-navy transition-colors">
                + {t("addLine")}
              </button>
            </div>
          </Section>

          {/* Payment */}
          <Section title={t("sections.payment")}>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="IBAN" value={inv.payment_iban ?? ""}
                onChange={(v) => setField("payment_iban", v)} placeholder="FR76..." />
              <Field label="BIC" value={inv.payment_bic ?? ""}
                onChange={(v) => setField("payment_bic", v)} />
              <Field label={t("fields.paymentReference")} value={inv.payment_reference ?? ""}
                onChange={(v) => setField("payment_reference", v)} />
              <Field label={t("fields.paymentTerms")} value={inv.payment_terms ?? ""}
                onChange={(v) => setField("payment_terms", v)} />
            </div>
          </Section>

          {/* Notes */}
          <Section title={t("sections.notes")}>
            <textarea value={(inv.notes ?? []).join("\n")}
              onChange={(e) => setField("notes", e.target.value.split("\n").filter(Boolean))}
              placeholder={t("fields.notesPlaceholder")}
              className="w-full rounded border border-input-border bg-input-bg px-2 py-2 text-sm min-h-[80px]" />
          </Section>
        </div>

        {/* Totals + actions */}
        <aside className="lg:sticky lg:top-4 lg:self-start space-y-4">
          <div className="rounded-xl border border-card-border bg-card p-5">
            <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{t("totals.title")}</div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">{t("totals.ht")}</span>
                <span className="font-mono">{formatEUR(totals.line_total, inv.currency)}</span>
              </div>
              {totals.vat_breakdown.map((v, i) => (
                <div key={i} className="flex justify-between text-xs text-muted">
                  <span>{t("totals.vat")} {v.rate_percent}%</span>
                  <span className="font-mono">{formatEUR(v.tax_amount, inv.currency)}</span>
                </div>
              ))}
              <div className="flex justify-between pt-2 border-t border-card-border">
                <span className="font-bold text-navy">{t("totals.ttc")}</span>
                <span className="font-mono font-bold text-navy">{formatEUR(totals.grand_total, inv.currency)}</span>
              </div>
            </div>
          </div>

          {validation.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <div className="font-bold mb-1">{t("validation.title")}</div>
              <ul className="list-disc pl-4 space-y-0.5">
                {validation.slice(0, 5).map((e, i) => <li key={i}>{e.message}</li>)}
                {validation.length > 5 && <li>… +{validation.length - 5}</li>}
              </ul>
            </div>
          )}

          {errors.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">
              <ul className="list-disc pl-4 space-y-0.5">
                {errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">
              ✓ {success}
            </div>
          )}

          <button onClick={generate}
            disabled={generating || validation.length > 0}
            className="w-full rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-navy-light disabled:opacity-50 transition-colors">
            {generating ? t("generating") : t("generate")} →
          </button>

          <div className="text-[11px] text-muted px-1 leading-relaxed">
            {t("hint")}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-card-border bg-card p-5">
      <div className="text-xs uppercase tracking-wider font-bold text-navy mb-3">{title}</div>
      {children}
    </section>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, required }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">
        {label}{required && <span className="text-rose-600 ml-0.5">*</span>}
      </div>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm" />
    </label>
  );
}

function NumField({ label, value, onChange, step = 1 }: {
  label: string; value: number; onChange: (v: number) => void; step?: number;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <input type="number" value={value} step={step} onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm text-right font-mono" />
    </label>
  );
}

function SelectField({ label, value, options, onChange }: {
  label: string; value: string; options: Array<{ v: string; l: string }>; onChange: (v: string) => void;
}) {
  return (
    <label className="block text-xs">
      <div className="text-muted font-medium mb-0.5">{label}</div>
      <select value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded border border-input-border bg-input-bg px-2 py-1.5 text-sm">
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </label>
  );
}
