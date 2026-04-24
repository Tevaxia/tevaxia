"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getCoownership, type Coownership } from "@/lib/coownerships";
import {
  listProjects, createProject, updateProject,
  listQuotes, addQuote, selectQuote,
  listInvoices, addInvoice,
  CATEGORY_LABELS, STATUS_LABELS,
  type WorksProject, type WorksQuote, type WorksInvoice, type WorksCategory, type WorksStatus,
} from "@/lib/works-projects";
import { formatEUR } from "@/lib/calculations";
import PdfExtractButton from "@/components/PdfExtractButton";

const STATUS_COLORS: Record<WorksStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  rfq: "bg-amber-100 text-amber-800",
  quoted: "bg-blue-100 text-blue-800",
  voted: "bg-purple-100 text-purple-800",
  in_progress: "bg-emerald-100 text-emerald-800",
  completed: "bg-green-200 text-green-900",
  cancelled: "bg-rose-100 text-rose-800",
};

export default function TravauxPage() {
  const t = useTranslations("syndicTravaux");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user } = useAuth();

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [projects, setProjects] = useState<WorksProject[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<WorksQuote[]>([]);
  const [invoices, setInvoices] = useState<WorksInvoice[]>([]);

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProj, setNewProj] = useState<{ title: string; description: string; category: WorksCategory; budget: number }>({
    title: "", description: "", category: "entretien", budget: 0,
  });

  const [showNewQuote, setShowNewQuote] = useState(false);
  const [newQuote, setNewQuote] = useState({ supplier_name: "", amount_ht: 0, amount_tva: 0, delivery_weeks: 0, warranty_years: 2, notes: "" });

  const refresh = useCallback(async () => {
    if (!id || !user) return;
    const [c, ps] = await Promise.all([getCoownership(id), listProjects(id)]);
    setCoown(c);
    setProjects(ps);
    if (activeId && ps.find((p) => p.id === activeId)) {
      const [qs, is] = await Promise.all([listQuotes(activeId), listInvoices(activeId)]);
      setQuotes(qs);
      setInvoices(is);
    } else if (ps.length > 0 && !activeId) {
      setActiveId(ps[0].id);
    }
  }, [id, user, activeId]);

  useEffect(() => { void refresh(); }, [refresh]);

  const active = projects.find((p) => p.id === activeId);

  const handleCreateProject = async () => {
    if (!newProj.title.trim()) return;
    const proj = await createProject({
      coownership_id: id,
      title: newProj.title,
      description: newProj.description,
      category: newProj.category,
      budget_estimate: newProj.budget,
      status: "draft",
    });
    setNewProj({ title: "", description: "", category: "entretien", budget: 0 });
    setShowNewProject(false);
    setActiveId(proj.id);
    await refresh();
  };

  const handleAddQuote = async () => {
    if (!activeId || !newQuote.supplier_name) return;
    const ttc = newQuote.amount_ht + newQuote.amount_tva;
    await addQuote({
      project_id: activeId,
      supplier_name: newQuote.supplier_name,
      supplier_contact: null,
      amount_ht: newQuote.amount_ht,
      amount_tva: newQuote.amount_tva,
      amount_ttc: ttc,
      delivery_weeks: newQuote.delivery_weeks,
      warranty_years: newQuote.warranty_years,
      notes: newQuote.notes || null,
      is_selected: false,
      received_at: new Date().toISOString().slice(0, 10),
    });
    setNewQuote({ supplier_name: "", amount_ht: 0, amount_tva: 0, delivery_weeks: 0, warranty_years: 2, notes: "" });
    setShowNewQuote(false);
    await refresh();
  };

  const handleSelectQuote = async (quoteId: string) => {
    if (!activeId) return;
    await selectQuote(quoteId, activeId);
    await refresh();
  };

  const handleStatusChange = async (projectId: string, status: WorksStatus) => {
    await updateProject(projectId, { status });
    await refresh();
  };

  const handleOcrInvoice = async (extracted: Record<string, unknown>) => {
    if (!activeId) return;
    await addInvoice({
      project_id: activeId,
      supplier_name: String(extracted.fournisseur ?? t("ocrFallbackSupplier")),
      invoice_number: String(extracted.numeroFacture ?? ""),
      invoice_date: String(extracted.dateFacture ?? new Date().toISOString().slice(0, 10)),
      due_date: (extracted.dateEcheance as string) || null,
      amount_ht: Number(extracted.montantHT) || 0,
      amount_tva: Number(extracted.montantTVA) || 0,
      amount_ttc: Number(extracted.montantTTC) || 0,
      paid_at: null,
      payment_ref: null,
      iban: (extracted.iban as string) || null,
      is_final: false,
      extracted_data: extracted,
    });
    await refresh();
  };

  if (!coown) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes/${id}`} className="text-xs text-muted hover:text-navy">{t("backCoown", { name: coown.name })}</Link>
        <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle")}</h1>
        <p className="mt-1 text-sm text-muted">{t("pageSubtitle")}</p>

        <div className="mt-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-navy">{t("projectsHeader", { n: projects.length })}</h2>
          <button onClick={() => setShowNewProject(!showNewProject)}
            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700">
            {showNewProject ? t("btnCancel") : t("btnNewProject")}
          </button>
        </div>

        {showNewProject && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder={t("formTitlePlaceholder")}
                value={newProj.title} onChange={(e) => setNewProj({ ...newProj, title: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <select value={newProj.category}
                onChange={(e) => setNewProj({ ...newProj, category: e.target.value as WorksCategory })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm">
                {(Object.keys(CATEGORY_LABELS) as WorksCategory[]).map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
              <textarea placeholder={t("formDescriptionPlaceholder")}
                value={newProj.description} onChange={(e) => setNewProj({ ...newProj, description: e.target.value })}
                className="sm:col-span-2 rounded-lg border border-input-border bg-white px-3 py-2 text-sm" rows={2} />
              <input type="number" placeholder={t("formBudgetPlaceholder")}
                value={newProj.budget || ""} onChange={(e) => setNewProj({ ...newProj, budget: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleCreateProject} disabled={!newProj.title.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                {t("btnCreate")}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_2fr]">
          {/* Liste projets */}
          <div className="space-y-2">
            {projects.length === 0 && (
              <div className="rounded-xl border border-dashed border-card-border p-6 text-center text-sm text-muted">
                {t("emptyProjects")}
              </div>
            )}
            {projects.map((p) => (
              <button key={p.id} onClick={() => setActiveId(p.id)}
                className={`w-full text-left rounded-lg border p-3 ${activeId === p.id ? "border-navy bg-navy/5" : "border-card-border bg-card hover:bg-slate-50"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-navy truncate">{p.title}</div>
                    <div className="text-xs text-muted">{CATEGORY_LABELS[p.category]}</div>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                </div>
                {p.budget_estimate !== null && (
                  <div className="mt-1 text-xs text-muted">{t("projBudgetLabel")} <span className="font-mono text-navy">{formatEUR(p.budget_estimate)}</span></div>
                )}
              </button>
            ))}
          </div>

          {/* Détail projet actif */}
          {active ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-navy">{active.title}</h3>
                    {active.description && <p className="mt-1 text-sm text-muted">{active.description}</p>}
                  </div>
                  <select value={active.status} onChange={(e) => handleStatusChange(active.id, e.target.value as WorksStatus)}
                    className="rounded-lg border border-input-border bg-input-bg px-2 py-1 text-xs">
                    {(Object.keys(STATUS_LABELS) as WorksStatus[]).map((s) => (
                      <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                    ))}
                  </select>
                </div>
                <div className="mt-3 grid gap-2 sm:grid-cols-3 text-xs">
                  <div><span className="text-muted">{t("colCategory")}</span><div className="font-semibold">{CATEGORY_LABELS[active.category]}</div></div>
                  <div><span className="text-muted">{t("colBudgetEstimated")}</span><div className="font-mono font-semibold">{active.budget_estimate ? formatEUR(active.budget_estimate) : t("dash")}</div></div>
                  <div><span className="text-muted">{t("colVotedAmount")}</span><div className="font-mono font-semibold">{active.voted_amount ? formatEUR(active.voted_amount) : t("dash")}</div></div>
                </div>
              </div>

              {/* Devis */}
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-navy">{t("quotesTitle", { n: quotes.length })}</h4>
                  <button onClick={() => setShowNewQuote(!showNewQuote)}
                    className="rounded-lg bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">
                    {showNewQuote ? t("btnCancel") : t("btnQuote")}
                  </button>
                </div>

                {showNewQuote && (
                  <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <input type="text" placeholder={t("quoteSupplierPlaceholder")} value={newQuote.supplier_name}
                        onChange={(e) => setNewQuote({ ...newQuote, supplier_name: e.target.value })}
                        className="rounded border border-input-border bg-white px-2 py-1 text-sm" />
                      <input type="number" placeholder={t("quoteHtPlaceholder")} value={newQuote.amount_ht || ""}
                        onChange={(e) => setNewQuote({ ...newQuote, amount_ht: Number(e.target.value) })}
                        className="rounded border border-input-border bg-white px-2 py-1 text-sm" />
                      <input type="number" placeholder={t("quoteTvaPlaceholder")} value={newQuote.amount_tva || ""}
                        onChange={(e) => setNewQuote({ ...newQuote, amount_tva: Number(e.target.value) })}
                        className="rounded border border-input-border bg-white px-2 py-1 text-sm" />
                      <input type="number" placeholder={t("quoteDelivPlaceholder")} value={newQuote.delivery_weeks || ""}
                        onChange={(e) => setNewQuote({ ...newQuote, delivery_weeks: Number(e.target.value) })}
                        className="rounded border border-input-border bg-white px-2 py-1 text-sm" />
                      <input type="number" placeholder={t("quoteWarrantyPlaceholder")} value={newQuote.warranty_years}
                        onChange={(e) => setNewQuote({ ...newQuote, warranty_years: Number(e.target.value) })}
                        className="rounded border border-input-border bg-white px-2 py-1 text-sm" />
                    </div>
                    <button onClick={handleAddQuote} disabled={!newQuote.supplier_name}
                      className="mt-2 rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700 disabled:opacity-40">
                      {t("btnAddQuote")}
                    </button>
                  </div>
                )}

                {quotes.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {quotes.map((q) => (
                      <div key={q.id} className={`rounded-lg border p-3 text-sm ${q.is_selected ? "border-emerald-400 bg-emerald-50" : "border-card-border bg-background"}`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-navy">{q.supplier_name} {q.is_selected && <span className="text-emerald-700 text-xs">{t("quoteSelected")}</span>}</div>
                            <div className="text-xs text-muted">
                              {t("quoteBreakdown", { ht: formatEUR(q.amount_ht), tva: formatEUR(q.amount_tva), ttc: formatEUR(q.amount_ttc) })}
                              {q.delivery_weeks ? ` · ${t("quoteDeliv", { n: q.delivery_weeks })}` : ""}
                              {q.warranty_years ? ` · ${t("quoteWarranty", { n: q.warranty_years })}` : ""}
                            </div>
                          </div>
                          {!q.is_selected && (
                            <button onClick={() => handleSelectQuote(q.id)}
                              className="rounded bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700">
                              {t("btnSelectQuote")}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Factures */}
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-navy">{t("invoicesTitle", { n: invoices.length })}</h4>
                  <PdfExtractButton schema="facture_immo" onExtracted={handleOcrInvoice} label={t("ocrLabel")} />
                </div>
                {invoices.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {invoices.map((inv) => (
                      <div key={inv.id} className={`rounded-lg border p-3 text-sm ${inv.paid_at ? "border-emerald-200 bg-emerald-50/50" : "border-card-border bg-background"}`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-navy">{inv.supplier_name} · {inv.invoice_number ?? t("dash")}</div>
                            <div className="text-xs text-muted">{inv.invoice_date} · {formatEUR(inv.amount_ttc)} TTC</div>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${inv.paid_at ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                            {inv.paid_at ? t("invoicePaid") : t("invoiceToPay")}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-card-border p-8 text-center text-sm text-muted">
              {t("noActiveProject")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
