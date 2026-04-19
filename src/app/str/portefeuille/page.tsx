"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/lib/supabase";
import { formatEUR, formatPct } from "@/lib/calculations";
import AiAnalysisCard from "@/components/AiAnalysisCard";

interface StrProperty {
  id: string;
  user_id: string;
  name: string;
  address: string | null;
  commune: string | null;
  surface: number;
  capacity: number;
  property_type: "apartment" | "house" | "room" | "studio" | "villa";
  avg_adr: number;
  avg_occupancy_pct: number;
  annual_revenue: number | null;
  annual_costs: number | null;
  eu_registry_number: string | null;
  license_status: "not_required" | "pending" | "obtained" | "expired";
  primary_ota: string | null;
  notes: string | null;
}

const LICENSE_COLORS: Record<StrProperty["license_status"], string> = {
  not_required: "bg-slate-100 text-slate-700",
  pending: "bg-amber-100 text-amber-800",
  obtained: "bg-emerald-100 text-emerald-800",
  expired: "bg-rose-100 text-rose-800",
};

export default function StrPortefeuillePage() {
  const t = useTranslations("strPortefeuille");
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const { user } = useAuth();
  const [properties, setProperties] = useState<StrProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newProp, setNewProp] = useState<Partial<StrProperty>>({
    name: "", commune: "Luxembourg", surface: 50, capacity: 2,
    property_type: "apartment", avg_adr: 100, avg_occupancy_pct: 60,
    license_status: "not_required", primary_ota: "Airbnb",
  });

  const PROPERTY_TYPE_LABELS: Record<StrProperty["property_type"], string> = {
    apartment: t("types.apartment"),
    house: t("types.house"),
    room: t("types.room"),
    studio: t("types.studio"),
    villa: t("types.villa"),
  };

  const LICENSE_LABELS: Record<StrProperty["license_status"], string> = {
    not_required: t("license.notRequired"),
    pending: t("license.pending"),
    obtained: t("license.obtained"),
    expired: t("license.expired"),
  };

  const refresh = async () => {
    if (!user || !supabase) return;
    const { data } = await supabase.from("str_properties").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    setProperties((data ?? []) as StrProperty[]);
    setLoading(false);
  };

  useEffect(() => { void refresh(); }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAdd = async () => {
    if (!user || !supabase || !newProp.name) return;
    const adr = newProp.avg_adr ?? 0;
    const occ = (newProp.avg_occupancy_pct ?? 0) / 100;
    const estimatedRevenue = Math.round(adr * 365 * occ);
    await supabase.from("str_properties").insert({
      ...newProp,
      user_id: user.id,
      annual_revenue: estimatedRevenue,
    });
    setShowNew(false);
    setNewProp({ name: "", commune: "Luxembourg", surface: 50, capacity: 2, property_type: "apartment", avg_adr: 100, avg_occupancy_pct: 60, license_status: "not_required", primary_ota: "Airbnb" });
    await refresh();
  };

  const handleDelete = async (id: string) => {
    if (!supabase || !confirm(t("confirmDelete"))) return;
    await supabase.from("str_properties").delete().eq("id", id);
    await refresh();
  };

  const stats = useMemo(() => {
    const total = properties.reduce((s, p) => s + (p.annual_revenue ?? 0), 0);
    const avgAdr = properties.length > 0 ? properties.reduce((s, p) => s + p.avg_adr, 0) / properties.length : 0;
    const avgOcc = properties.length > 0 ? properties.reduce((s, p) => s + p.avg_occupancy_pct, 0) / properties.length / 100 : 0;
    const licensesPending = properties.filter((p) => p.license_status === "pending").length;
    const licensesObtained = properties.filter((p) => p.license_status === "obtained").length;
    const euRegistered = properties.filter((p) => p.eu_registry_number).length;
    return { total, avgAdr, avgOcc, licensesPending, licensesObtained, euRegistered };
  }, [properties]);

  if (!user) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("signIn")}</div>;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/str`} className="text-xs text-muted hover:text-navy">&larr; {t("back")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("kpi.nbProps")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{properties.length}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("kpi.annualRevenue")}</div>
            <div className="mt-1 text-2xl font-bold text-emerald-700">{formatEUR(stats.total)}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("kpi.avgAdr")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{stats.avgAdr.toFixed(0)} €</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs text-muted">{t("kpi.avgOccupancy")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{formatPct(stats.avgOcc)}</div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="text-sm text-muted">
            {t("licenses.summary", {
              obtained: stats.licensesObtained,
              pending: stats.licensesPending,
              eu: stats.euRegistered,
              total: properties.length,
            })}
          </div>
          <button onClick={() => setShowNew(!showNew)}
            className="rounded-lg bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700">
            {showNew ? t("cancel") : t("addProperty")}
          </button>
        </div>

        {showNew && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="grid gap-3 sm:grid-cols-3">
              <input type="text" placeholder={t("form.name")} value={newProp.name} onChange={(e) => setNewProp({ ...newProp, name: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="text" placeholder={t("form.commune")} value={newProp.commune ?? ""} onChange={(e) => setNewProp({ ...newProp, commune: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <select value={newProp.property_type} onChange={(e) => setNewProp({ ...newProp, property_type: e.target.value as StrProperty["property_type"] })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm">
                {Object.entries(PROPERTY_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder={t("form.surface")} value={newProp.surface || ""}
                onChange={(e) => setNewProp({ ...newProp, surface: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder={t("form.capacity")} value={newProp.capacity || ""}
                onChange={(e) => setNewProp({ ...newProp, capacity: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder={t("form.adr")} value={newProp.avg_adr || ""}
                onChange={(e) => setNewProp({ ...newProp, avg_adr: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <input type="number" placeholder={t("form.occupancy")} value={newProp.avg_occupancy_pct || ""}
                onChange={(e) => setNewProp({ ...newProp, avg_occupancy_pct: Number(e.target.value) })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
              <select value={newProp.license_status} onChange={(e) => setNewProp({ ...newProp, license_status: e.target.value as StrProperty["license_status"] })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm">
                {Object.entries(LICENSE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="text" placeholder={t("form.primaryOta")} value={newProp.primary_ota ?? ""} onChange={(e) => setNewProp({ ...newProp, primary_ota: e.target.value })}
                className="rounded-lg border border-input-border bg-white px-3 py-2 text-sm" />
            </div>
            <button onClick={handleAdd} disabled={!newProp.name}
              className="mt-3 rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-40">
              {t("form.addBtn")}
            </button>
          </div>
        )}

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("table.name")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("table.type")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("table.commune")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.surface")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.adr")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.occ")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.revenue")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("table.license")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {properties.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-muted">{t("empty")}</td></tr>
              ) : properties.map((p) => (
                <tr key={p.id} className="border-b border-card-border/50 hover:bg-background">
                  <td className="px-4 py-2 font-medium text-navy">{p.name}</td>
                  <td className="px-4 py-2 text-xs">{PROPERTY_TYPE_LABELS[p.property_type]}</td>
                  <td className="px-4 py-2 text-xs">{p.commune}</td>
                  <td className="px-4 py-2 text-right font-mono">{p.surface} m²</td>
                  <td className="px-4 py-2 text-right font-mono">{p.avg_adr} €</td>
                  <td className="px-4 py-2 text-right font-mono">{p.avg_occupancy_pct}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(p.annual_revenue ?? 0)}</td>
                  <td className="px-4 py-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${LICENSE_COLORS[p.license_status]}`}>
                      {LICENSE_LABELS[p.license_status]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => handleDelete(p.id)}
                      className="text-muted hover:text-rose-600 text-xs">{t("delete")}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {properties.length > 0 && (
          <div className="mt-6">
            <AiAnalysisCard
              context={[
                `Portefeuille STR ${properties.length} biens au Luxembourg`,
                `Revenu annuel total estimé: ${formatEUR(stats.total)}`,
                `ADR moyen: ${stats.avgAdr.toFixed(0)}€ · Occupation moyenne: ${formatPct(stats.avgOcc)}`,
                `Licences obtenues: ${stats.licensesObtained}/${properties.length}`,
                `Enregistrement EU 2024/1028: ${stats.euRegistered}/${properties.length}`,
                ``,
                `Détail: ${properties.slice(0, 10).map((p) => `${p.name} (${p.commune}, ${p.surface}m², ADR ${p.avg_adr}€, occ ${p.avg_occupancy_pct}%)`).join(" / ")}`,
              ].join("\n")}
              prompt="Analyse ce portefeuille STR au Luxembourg. Diagnostic performance, compliance, risques de concentration, scaling, KPIs SaaS conciergerie pro LU."
            />
          </div>
        )}
      </div>
    </div>
  );
}
