"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listGuests, createGuest, updateGuest, deleteGuest } from "@/lib/pms/guests";
import type { PmsProperty, PmsGuest } from "@/lib/pms/types";
import { errMsg } from "@/lib/pms/errors";
import { formatEUR } from "@/lib/calculations";

export default function GuestsPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const t = useTranslations("pms.guests");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [guests, setGuests] = useState<PmsGuest[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    first_name: "", last_name: "", email: "", phone: "",
    document_type: "id_card", document_number: "", nationality: "LU",
    language: "fr", marketing_opt_in: false,
  });

  const reload = useCallback(async () => {
    const [p, gs] = await Promise.all([
      getProperty(propertyId),
      listGuests(propertyId, search),
    ]);
    setProperty(p);
    setGuests(gs);
    setLoading(false);
  }, [propertyId, search]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const handleAdd = async () => {
    if (!form.first_name || !form.last_name) { setError(t("errRequired")); return; }
    try {
      await createGuest({
        property_id: propertyId,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email || null,
        phone: form.phone || null,
        document_type: form.document_type || null,
        document_number: form.document_number || null,
        nationality: form.nationality || null,
        language: form.language,
        marketing_opt_in: form.marketing_opt_in,
        marketing_opt_in_at: form.marketing_opt_in ? new Date().toISOString() : null,
      });
      setForm({ first_name: "", last_name: "", email: "", phone: "", document_type: "id_card", document_number: "", nationality: "LU", language: "fr", marketing_opt_in: false });
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const toggleMarketing = async (g: PmsGuest) => {
    try {
      await updateGuest(g.id, {
        marketing_opt_in: !g.marketing_opt_in,
        marketing_opt_in_at: !g.marketing_opt_in ? new Date().toISOString() : null,
      });
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  const handleDelete = async (g: PmsGuest) => {
    if (!confirm(t("confirmErase", { first: g.first_name, last: g.last_name }))) return;
    try {
      await deleteGuest(g.id);
      await reload();
    } catch (e) { setError(errMsg(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("intro")}</p>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("addTitle")}</h2>
        <div className="grid gap-2 sm:grid-cols-4 text-xs">
          <input placeholder={t("firstName")} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <input placeholder={t("lastName")} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <input placeholder={t("emailPh")} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <input placeholder={t("phonePh")} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <select value={form.document_type} onChange={(e) => setForm({ ...form, document_type: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5">
            <option value="id_card">{t("docTypeId")}</option>
            <option value="passport">{t("docTypePassport")}</option>
            <option value="driving_licence">{t("docTypeLicense")}</option>
          </select>
          <input placeholder={t("docNumberPh")} value={form.document_number} onChange={(e) => setForm({ ...form, document_number: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <input placeholder={t("nationalityPh")} maxLength={2} value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value.toUpperCase() })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5" />
          <button type="button" onClick={handleAdd}
            className="rounded-md bg-navy px-3 py-1.5 font-semibold text-white hover:bg-navy-light">+ {tc("add")}</button>
          <label className="flex items-center gap-2 sm:col-span-4 text-[11px] mt-1">
            <input type="checkbox" checked={form.marketing_opt_in} onChange={(e) => setForm({ ...form, marketing_opt_in: e.target.checked })} />
            {t("marketingConsent")}
          </label>
        </div>
      </section>

      <div className="mt-5 flex items-center gap-2">
        <input
          placeholder={t("searchPh")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-md rounded-md border border-card-border bg-background px-3 py-1.5 text-xs"
        />
        <span className="text-[11px] text-muted">{t("resultCount", { n: guests.length })}</span>
      </div>

      <div className="mt-4 rounded-xl border border-card-border bg-card p-3">
        {guests.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">{t("empty")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colName")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colContact")}</th>
                <th className="py-2 px-2 text-center font-medium text-muted">{t("colNationality")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colStays")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colNights")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colSpent")}</th>
                <th className="py-2 px-2 text-center font-medium text-muted">{t("colMarketing")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{tc("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {guests.map((g) => (
                <tr key={g.id} className="border-b border-card-border/40 hover:bg-card/30">
                  <td className="py-2 px-2">
                    <div className="font-semibold text-navy">{g.last_name}, {g.first_name}</div>
                    {g.document_number && <div className="text-[9px] text-muted font-mono">{g.document_type} {g.document_number}</div>}
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-[11px]">{g.email ?? "—"}</div>
                    <div className="text-[10px] text-muted">{g.phone ?? ""}</div>
                  </td>
                  <td className="py-2 px-2 text-center font-mono">{g.nationality ?? "—"}</td>
                  <td className="py-2 px-2 text-right font-mono">{g.total_stays}</td>
                  <td className="py-2 px-2 text-right font-mono">{g.total_nights}</td>
                  <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(g.total_spent || 0))}</td>
                  <td className="py-2 px-2 text-center">
                    <button type="button" onClick={() => toggleMarketing(g)}
                      className={`rounded-full px-2 py-0.5 text-[10px] ${g.marketing_opt_in ? "bg-emerald-100 text-emerald-900" : "bg-slate-100 text-slate-600"}`}>
                      {g.marketing_opt_in ? t("optIn") : t("optOut")}
                    </button>
                  </td>
                  <td className="py-2 px-2 text-right">
                    <button type="button" onClick={() => handleDelete(g)}
                      className="text-rose-700 hover:underline text-[11px]">{t("erasePersonalData")}</button>
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
