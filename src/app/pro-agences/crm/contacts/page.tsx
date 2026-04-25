"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import {
  listContacts, createContact, deleteContact, type CrmContact,
  contactDisplayName, type CrmContactKind,
} from "@/lib/crm";
import { errMsg } from "@/lib/errors";
import { formatEUR } from "@/lib/calculations";

export default function ContactsPage() {
  const t = useTranslations("proaCrmContacts");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const { user, loading: authLoading } = useAuth();
  const [contacts, setContacts] = useState<CrmContact[]>([]);
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState<CrmContactKind | "all">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const KIND_LABEL: Record<CrmContactKind, string> = {
    prospect: t("kindProspect"),
    lead: t("kindLead"),
    acquereur: t("kindAcquereur"),
    vendeur: t("kindVendeur"),
    bailleur: t("kindBailleur"),
    locataire: t("kindLocataire"),
    partenaire: t("kindPartenaire"),
    autre: t("kindAutre"),
  };

  const [form, setForm] = useState({
    kind: "prospect" as CrmContactKind,
    is_company: false,
    first_name: "", last_name: "", company_name: "",
    email: "", phone: "",
    budget_min: "", budget_max: "",
    tags: "",
  });

  const reload = useCallback(async () => {
    const list = await listContacts({
      search: search || undefined,
      kind: filterKind === "all" ? undefined : filterKind,
    });
    setContacts(list);
    setLoading(false);
  }, [search, filterKind]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleCreate = async () => {
    if (form.is_company) {
      if (!form.company_name.trim()) { setError(t("errCompanyName")); return; }
    } else {
      if (!form.first_name.trim() && !form.last_name.trim()) { setError(t("errPersonName")); return; }
    }
    try {
      await createContact({
        kind: form.kind,
        is_company: form.is_company,
        first_name: form.is_company ? null : (form.first_name.trim() || null),
        last_name: form.is_company ? null : (form.last_name.trim() || null),
        company_name: form.is_company ? form.company_name.trim() : null,
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        tags: form.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      });
      setForm({ kind: "prospect", is_company: false, first_name: "", last_name: "", company_name: "", email: "", phone: "", budget_min: "", budget_max: "", tags: "" });
      setShowForm(false);
      setError(null);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleDelete = async (c: CrmContact) => {
    if (!confirm(t("confirmDelete", { name: contactDisplayName(c) }))) return;
    try {
      await deleteContact(c.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href={`${lp}/connexion`} className="text-navy underline">{t("loginPrompt")}</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      <Link href={`${lp}/pro-agences/crm`} className="text-xs text-muted hover:text-navy">{t("backCrm")}</Link>
      <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              if (contacts.length === 0) return;
              const header = [
                t("csvHeaderCategory"), t("csvHeaderType"), t("csvHeaderFirstName"), t("csvHeaderLastName"), t("csvHeaderCompany"),
                t("csvHeaderEmail"), t("csvHeaderPhone"), t("csvHeaderAddress"), t("csvHeaderZip"), t("csvHeaderCity"), t("csvHeaderCountry"),
                t("csvHeaderBudgetMin"), t("csvHeaderBudgetMax"),
                t("csvHeaderSurfaceMin"), t("csvHeaderSurfaceMax"), t("csvHeaderZones"), t("csvHeaderTags"), t("csvHeaderNotes"),
                t("csvHeaderMarketing"), t("csvHeaderCreated"), t("csvHeaderUpdated"),
              ];
              const rows = contacts.map((c) => [
                KIND_LABEL[c.kind] ?? c.kind,
                c.is_company ? t("csvCompany") : t("csvIndividual"),
                c.first_name ?? "", c.last_name ?? "", c.company_name ?? "",
                c.email ?? "", c.phone ?? "",
                c.address ?? "", c.postal_code ?? "", c.city ?? "", c.country ?? "",
                c.budget_min ?? "", c.budget_max ?? "",
                c.target_surface_min ?? "", c.target_surface_max ?? "",
                (c.target_zones ?? []).join(";"), (c.tags ?? []).join(";"),
                (c.notes ?? "").replace(/[\r\n]+/g, " "),
                c.marketing_opt_in ? t("csvYes") : t("csvNo"),
                c.created_at, c.updated_at,
              ]);
              const esc = (s: string | number) => `"${String(s).replace(/"/g, '""')}"`;
              const csv = "﻿" +
                [header.map(esc).join(";")]
                  .concat(rows.map((r) => r.map(esc).join(";")))
                  .join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `contacts-export-${new Date().toISOString().slice(0, 10)}.csv`;
              a.click();
              URL.revokeObjectURL(url);
            }}
            disabled={contacts.length === 0}
            className="rounded-md border border-navy bg-white px-3 py-1.5 text-xs font-semibold text-navy hover:bg-navy/5 disabled:opacity-50"
            title={t("btnExportTitle")}
          >
            {t("btnExportCsv")}
          </button>
          <Link
            href={`${lp}/pro-agences/crm/contacts/import`}
            className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy"
          >
            {t("btnImportCsv")}
          </Link>
          <Link
            href={`${lp}/pro-agences/crm/templates`}
            className="rounded-md border border-card-border bg-background px-3 py-1.5 text-xs font-semibold text-slate hover:border-navy"
          >
            {t("btnTemplates")}
          </Link>
          <button
            type="button"
            onClick={() => setShowForm(!showForm)}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
          >
            {showForm ? t("btnClose") : t("btnNewContact")}
          </button>
        </div>
      </div>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {showForm && (
        <section className="mt-4 rounded-xl border border-card-border bg-card p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted">{t("fieldKind")}</span>
              <select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as CrmContactKind })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm">
                {(Object.keys(KIND_LABEL) as CrmContactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
              </select>
            </label>
            <label className="text-xs flex items-end gap-2">
              <input type="checkbox" checked={form.is_company} onChange={(e) => setForm({ ...form, is_company: e.target.checked })} />
              <span>{t("fieldCompany")}</span>
            </label>
            {form.is_company ? (
              <label className="text-xs sm:col-span-2">
                <span className="text-muted">{t("fieldCompanyName")}</span>
                <input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
              </label>
            ) : (
              <>
                <label className="text-xs">
                  <span className="text-muted">{t("fieldFirstName")}</span>
                  <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
                </label>
                <label className="text-xs">
                  <span className="text-muted">{t("fieldLastName")}</span>
                  <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
                </label>
              </>
            )}
            <label className="text-xs">
              <span className="text-muted">{t("fieldEmail")}</span>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">{t("fieldPhone")}</span>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">{t("fieldBudgetMin")}</span>
              <input type="number" value={form.budget_min} onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs">
              <span className="text-muted">{t("fieldBudgetMax")}</span>
              <input type="number" value={form.budget_max} onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
            <label className="text-xs sm:col-span-2">
              <span className="text-muted">{t("fieldTags")}</span>
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder={t("tagsPlaceholder")}
                className="mt-1 w-full rounded-md border border-card-border bg-background px-2 py-1.5 text-sm" />
            </label>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="rounded-md border border-card-border px-3 py-1.5 text-xs text-slate hover:border-navy">{t("btnCancel")}</button>
            <button type="button" onClick={handleCreate}
              className="rounded-md bg-navy px-4 py-1.5 text-xs font-semibold text-white hover:bg-navy-light">{t("btnCreate")}</button>
          </div>
        </section>
      )}

      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <input
          placeholder={t("searchPlaceholder")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] max-w-md rounded-md border border-card-border bg-background px-3 py-1.5 text-xs"
        />
        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value as CrmContactKind | "all")}
          className="rounded-md border border-card-border bg-background px-2 py-1.5 text-xs"
        >
          <option value="all">{t("filterAllKinds")}</option>
          {(Object.keys(KIND_LABEL) as CrmContactKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
        </select>
        <span className="text-[11px] text-muted">{t("countSuffix", { n: contacts.length })}</span>
      </div>

      <div className="mt-4 rounded-xl border border-card-border bg-card p-3">
        {contacts.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">{t("emptyList")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colName")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colCategory")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colContact")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colBudget")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colTags")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-b border-card-border/40 hover:bg-card/30">
                  <td className="py-2 px-2">
                    <Link href={`${lp}/pro-agences/crm/contacts/${c.id}`} className="font-semibold text-navy hover:underline">
                      {contactDisplayName(c)}
                    </Link>
                    {c.is_company && <span className="ml-2 text-[9px] text-muted">{t("badgeCompany")}</span>}
                  </td>
                  <td className="py-2 px-2 text-[10px]">
                    <span className="rounded-full bg-slate-100 text-slate-700 px-2 py-0.5 uppercase tracking-wider">{KIND_LABEL[c.kind]}</span>
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-[11px]">{c.email ?? t("dash")}</div>
                    <div className="text-[10px] text-muted">{c.phone ?? ""}</div>
                  </td>
                  <td className="py-2 px-2 text-right font-mono">
                    {(c.budget_min || c.budget_max)
                      ? `${c.budget_min ? formatEUR(Number(c.budget_min)) : t("dash")} → ${c.budget_max ? formatEUR(Number(c.budget_max)) : t("dash")}`
                      : t("dash")}
                  </td>
                  <td className="py-2 px-2">
                    {c.tags?.slice(0, 3).map((tag) => (
                      <span key={tag} className="mr-1 rounded-full bg-amber-50 text-amber-900 px-1.5 py-0.5 text-[9px] ring-1 ring-amber-100">{tag}</span>
                    ))}
                  </td>
                  <td className="py-2 px-2 text-right text-[11px]">
                    <Link href={`${lp}/pro-agences/crm/contacts/${c.id}`} className="text-navy hover:underline mr-2">{t("btnOpen")}</Link>
                    <button type="button" onClick={() => handleDelete(c)} className="text-rose-700 hover:underline">{t("btnDelete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
