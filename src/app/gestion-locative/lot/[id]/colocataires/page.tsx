"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getLot, type RentalLot } from "@/lib/gestion-locative";
import {
  listCotenantsForLot,
  createCotenant,
  updateCotenant,
  deleteCotenant,
  autoBalanceShares,
  type Cotenant,
  type CotenantStatus,
} from "@/lib/cotenants";
import { formatEUR } from "@/lib/calculations";
import { isSupabaseConfigured } from "@/lib/supabase";
import { errMsg } from "@/lib/errors";

const STATUS_COLOR: Record<CotenantStatus, string> = {
  active: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  left: "bg-slate-100 text-slate-600",
};

export default function CotenantsPage() {
  const locale = useLocale();
  const t = useTranslations("glColoc");
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const lp = locale === "fr" ? "" : `/${locale}`;
  const params = useParams();
  const id = String(params?.id ?? "");
  const { user, loading: authLoading } = useAuth();

  const STATUS_LABELS: Record<CotenantStatus, string> = {
    active: t("statusActive"),
    pending: t("statusPending"),
    left: t("statusLeft"),
  };

  const [lot, setLot] = useState<RentalLot | null>(null);
  const [cotenants, setCotenants] = useState<Cotenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    share_pct: 0,
    deposit_amount: 0,
    bail_start: "",
    bail_end: "",
    status: "active" as CotenantStatus,
  });

  const refresh = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const l = getLot(id);
      setLot(l);
      if (isSupabaseConfigured && user) {
        const list = await listCotenantsForLot(id);
        setCotenants(list);
      }
    } catch (e) {
      setError(errMsg(e, t("errGeneric")));
    } finally {
      setLoading(false);
    }
  }, [id, user, t]);

  useEffect(() => {
    if (id && user) void refresh();
  }, [id, user, refresh]);

  const handleCreate = async () => {
    if (!form.name.trim()) {
      setError(t("errNameRequired"));
      return;
    }
    try {
      await createCotenant({
        lot_id: id,
        name: form.name,
        email: form.email || undefined,
        phone: form.phone || undefined,
        share_pct: form.share_pct,
        deposit_amount: form.deposit_amount,
        bail_start: form.bail_start || undefined,
        bail_end: form.bail_end || undefined,
        status: form.status,
      });
      setForm({ name: "", email: "", phone: "", share_pct: 0, deposit_amount: 0, bail_start: "", bail_end: "", status: "active" });
      setShowForm(false);
      setError(null);
      await refresh();
    } catch (e) {
      setError(errMsg(e, t("errCreate")));
    }
  };

  const handleUpdateShare = async (cot: Cotenant, newPct: number) => {
    await updateCotenant(cot.id, { share_pct: newPct });
    await refresh();
  };

  const handleDelete = async (cotId: string) => {
    if (!confirm(t("confirmDelete"))) return;
    await deleteCotenant(cotId);
    await refresh();
  };

  const handleAutoBalance = async () => {
    const balanced = autoBalanceShares(cotenants);
    for (const c of cotenants) {
      const newPct = balanced[c.id];
      if (newPct !== c.share_pct) {
        await updateCotenant(c.id, { share_pct: newPct });
      }
    }
    await refresh();
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          {t("supabaseRequired")}
        </div>
      </div>
    );
  }

  if (authLoading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center">
      <Link href={`${lp}/connexion`} className="text-navy underline">{t("signIn")}</Link> {t("signInPrompt")}
    </div>
  );
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!lot) return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">
      {t("lotNotFound")} <Link href={`${lp}/gestion-locative/portefeuille`} className="text-navy underline">{t("backLink")}</Link>
    </div>
  );

  const totalShare = cotenants
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + Number(c.share_pct), 0);
  const totalDeposit = cotenants.reduce((s, c) => s + Number(c.deposit_amount), 0);
  const loyerTotal = lot.loyerMensuelActuel + lot.chargesMensuelles;
  const shareValid = Math.abs(totalShare - 100) < 0.01;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href={`${lp}/gestion-locative/lot/${id}`} className="text-xs text-muted hover:text-navy">
        {t("backLot", { lotName: lot.name })}
      </Link>
      <h1 className="mt-2 text-2xl font-bold text-navy">{t("pageTitle", { lotName: lot.name })}</h1>
      <p className="mt-1 text-sm text-muted">
        {t("pageSubtitle", { rent: formatEUR(loyerTotal) })}
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">{error}</div>}

      <div className="mt-6 grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">{t("kpiActive")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">
            {cotenants.filter((c) => c.status === "active").length}
          </div>
        </div>
        <div className={`rounded-xl border p-4 text-center ${shareValid ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
          <div className="text-xs text-muted">{t("kpiTotalShare")}</div>
          <div className={`mt-1 text-2xl font-bold ${shareValid ? "text-emerald-900" : "text-amber-900"}`}>
            {totalShare.toFixed(1)} %
          </div>
          {!shareValid && <div className="text-[10px] text-amber-700">{t("kpiShareWarn")}</div>}
        </div>
        <div className="rounded-xl border border-card-border bg-card p-4 text-center">
          <div className="text-xs text-muted">{t("kpiDeposit")}</div>
          <div className="mt-1 text-2xl font-bold text-navy">{formatEUR(totalDeposit)}</div>
          <div className="text-[10px] text-muted">{t("kpiDepositHint")}</div>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
        >
          {showForm ? t("btnCancel") : t("btnAddCoc")}
        </button>
        {cotenants.length > 0 && !shareValid && (
          <button
            onClick={handleAutoBalance}
            className="rounded-lg border border-navy bg-white px-3 py-2 text-xs font-semibold text-navy hover:bg-navy/5"
          >
            {t("btnAutoBalance")}
          </button>
        )}
      </div>

      {showForm && (
        <div className="mt-4 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formName")}</div>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formEmail")}</div>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formPhone")}</div>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formShare")}</div>
              <input
                type="number"
                value={form.share_pct}
                onChange={(e) => setForm((f) => ({ ...f, share_pct: Number(e.target.value) }))}
                min={0}
                max={100}
                step={0.5}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formDeposit")}</div>
              <input
                type="number"
                value={form.deposit_amount}
                onChange={(e) => setForm((f) => ({ ...f, deposit_amount: Number(e.target.value) }))}
                min={0}
                step={50}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formLeaseStart")}</div>
              <input
                type="date"
                value={form.bail_start}
                onChange={(e) => setForm((f) => ({ ...f, bail_start: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formLeaseEnd")}</div>
              <input
                type="date"
                value={form.bail_end}
                onChange={(e) => setForm((f) => ({ ...f, bail_end: e.target.value }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("formStatus")}</div>
              <select
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as CotenantStatus }))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm"
              >
                <option value="active">{t("statusActive")}</option>
                <option value="pending">{t("statusPending")}</option>
                <option value="left">{t("statusLeft")}</option>
              </select>
            </label>
          </div>
          <button
            onClick={handleCreate}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light"
          >
            {t("btnCreate")}
          </button>
        </div>
      )}

      {cotenants.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyState")}
        </div>
      ) : (
        <div className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background/60">
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("thName")}</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("thContact")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">{t("thSharePct")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">{t("thNomRent")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy">{t("thDeposit")}</th>
                <th className="px-4 py-3 text-left font-semibold text-navy">{t("thLease")}</th>
                <th className="px-4 py-3 text-center font-semibold text-navy">{t("thStatus")}</th>
                <th className="px-4 py-3 text-right font-semibold text-navy"></th>
              </tr>
            </thead>
            <tbody>
              {cotenants.map((c) => {
                const loyerNominatif = loyerTotal * (Number(c.share_pct) / 100);
                return (
                  <tr key={c.id} className="border-b border-card-border/40 hover:bg-background/40">
                    <td className="px-4 py-3 font-medium">{c.name}</td>
                    <td className="px-4 py-3 text-xs text-muted">
                      {c.email && <div>{c.email}</div>}
                      {c.phone && <div>{c.phone}</div>}
                      {!c.email && !c.phone && <span className="italic">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        value={c.share_pct}
                        onChange={(e) => handleUpdateShare(c, Number(e.target.value))}
                        min={0}
                        max={100}
                        step={0.5}
                        className="w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-xs text-right font-mono"
                      />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm font-semibold text-navy">
                      {formatEUR(loyerNominatif)}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-xs">{formatEUR(Number(c.deposit_amount))}</td>
                    <td className="px-4 py-3 text-xs text-muted font-mono">
                      {c.bail_start ? new Date(c.bail_start).toLocaleDateString(dateLocale, { month: "short", year: "2-digit" }) : "—"}
                      {" → "}
                      {c.bail_end ? new Date(c.bail_end).toLocaleDateString(dateLocale, { month: "short", year: "2-digit" }) : "∞"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLOR[c.status]}`}>
                        {STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} className="text-xs text-rose-700 hover:underline">
                        {t("btnDelete")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
        <strong>{t("legalStrong")}</strong> {t("legalBody")}
      </div>
    </div>
  );
}
