"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import {
  getCoownership, updateCoownership,
  listUnits, createUnit, updateUnit, deleteUnit,
  sumTantiemes, tantiemesValidation,
  type Coownership, type CoownershipUnit, type UnitType, type Occupancy,
} from "@/lib/coownerships";

export default function CoownershipDetailPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("syndicDetail");
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const UNIT_TYPE_LABEL: Record<UnitType, string> = {
    apartment: t("unitApartment"),
    commercial: t("unitCommercial"),
    office: t("unitOffice"),
    parking: t("unitParking"),
    cellar: t("unitCellar"),
    other: t("unitOther"),
  };

  const OCCUPANCY_LABEL: Record<Occupancy, string> = {
    owner_occupied: t("occOwner"),
    rented: t("occRented"),
    vacant: t("occVacant"),
    seasonal: t("occSeasonal"),
  };

  const [coown, setCoown] = useState<Coownership | null>(null);
  const [units, setUnits] = useState<CoownershipUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editGeneral, setEditGeneral] = useState(false);
  const [generalDraft, setGeneralDraft] = useState<Partial<Coownership>>({});

  const [showAddUnit, setShowAddUnit] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState<string | null>(null);
  const emptyUnit: Partial<CoownershipUnit> = {
    lot_number: "",
    unit_type: "apartment",
    floor: null,
    surface_m2: null,
    nb_rooms: null,
    tantiemes: 0,
    owner_name: "",
    owner_email: "",
    occupancy: "owner_occupied",
  };
  const [unitDraft, setUnitDraft] = useState<Partial<CoownershipUnit>>(emptyUnit);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, u] = await Promise.all([getCoownership(id), listUnits(id)]);
      setCoown(c);
      setUnits(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : t("error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user) void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user]);

  const saveGeneral = async () => {
    if (!coown) return;
    try {
      const updated = await updateCoownership(coown.id, generalDraft);
      setCoown(updated);
      setEditGeneral(false);
      setGeneralDraft({});
    } catch (e) { setError(e instanceof Error ? e.message : t("error")); }
  };

  const handleAddUnit = async () => {
    if (!coown || !unitDraft.lot_number) return;
    try {
      await createUnit({
        coownership_id: coown.id,
        lot_number: unitDraft.lot_number!,
        unit_type: (unitDraft.unit_type ?? "apartment") as UnitType,
        floor: unitDraft.floor ?? null,
        surface_m2: unitDraft.surface_m2 ?? null,
        nb_rooms: unitDraft.nb_rooms ?? null,
        tantiemes: unitDraft.tantiemes ?? 0,
        owner_name: unitDraft.owner_name ?? null,
        owner_email: unitDraft.owner_email ?? null,
        owner_phone: unitDraft.owner_phone ?? null,
        owner_address: unitDraft.owner_address ?? null,
        acquisition_date: unitDraft.acquisition_date ?? null,
        occupancy: (unitDraft.occupancy ?? "owner_occupied") as Occupancy,
        tenant_name: unitDraft.tenant_name ?? null,
        notes: unitDraft.notes ?? null,
      });
      setUnitDraft(emptyUnit);
      setShowAddUnit(false);
      void refresh();
    } catch (e) { setError(e instanceof Error ? e.message : t("error")); }
  };

  const handleUpdateUnit = async () => {
    if (!editingUnitId) return;
    try {
      await updateUnit(editingUnitId, unitDraft);
      setEditingUnitId(null);
      setUnitDraft(emptyUnit);
      void refresh();
    } catch (e) { setError(e instanceof Error ? e.message : t("error")); }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm(t("confirmDeleteUnit"))) return;
    try { await deleteUnit(unitId); void refresh(); }
    catch (e) { setError(e instanceof Error ? e.message : t("error")); }
  };

  if (!user) return null;
  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!coown) return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <p className="text-sm text-muted">{t("notFound")}</p>
      <Link href={`${lp}/syndic/coproprietes`} className="mt-4 inline-flex text-sm text-navy underline">{t("backToList")}</Link>
    </div>
  );

  const usedTant = sumTantiemes(units);
  const tv = tantiemesValidation(coown.total_tantiemes, usedTant);

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/syndic/coproprietes`} className="text-xs text-muted hover:text-navy">{t("backCopros")}</Link>

        {/* Header + edition */}
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">{coown.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {coown.address && <>{coown.address}<br /></>}
              {coown.commune ?? ""}
            </p>
          </div>
          <button onClick={() => { setEditGeneral(!editGeneral); setGeneralDraft(coown); }}
            className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-medium text-navy hover:bg-slate-50">
            {editGeneral ? t("cancel") : t("editInfo")}
          </button>
        </div>

        {editGeneral && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="text" placeholder={t("placeholderAddress")} value={generalDraft.address ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, address: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" placeholder={t("placeholderCommune")} value={generalDraft.commune ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, commune: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("placeholderYear")} value={generalDraft.year_built ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, year_built: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("placeholderFloors")} value={generalDraft.nb_floors ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, nb_floors: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="date" placeholder={t("placeholderLastAg")} value={generalDraft.last_ag_date ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, last_ag_date: e.target.value || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="date" placeholder={t("placeholderNextAg")} value={generalDraft.next_ag_date ?? ""}
                onChange={(e) => setGeneralDraft((p) => ({ ...p, next_ag_date: e.target.value || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <label className="flex items-center gap-2 text-sm sm:col-span-2">
                <input type="checkbox" checked={generalDraft.has_elevator ?? false}
                  onChange={(e) => setGeneralDraft((p) => ({ ...p, has_elevator: e.target.checked }))}
                  className="h-4 w-4" />
                {t("elevator")}
              </label>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={saveGeneral}
                className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
                {t("save")}
              </button>
            </div>
          </div>
        )}

        {/* KPI */}
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiLots")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{units.length}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiTotalTantiemes")}</div>
            <div className="mt-1 text-2xl font-bold text-navy">{coown.total_tantiemes.toLocaleString("fr-LU")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiAssigned")}</div>
            <div className={`mt-1 text-2xl font-bold ${tv.valid ? "text-emerald-700" : tv.diff > 0 ? "text-amber-700" : "text-rose-700"}`}>
              {usedTant.toLocaleString("fr-LU")}
            </div>
            <div className="mt-0.5 text-xs text-muted">{tv.usagePct.toFixed(1)} % · {t("kpiUsagePct")} {tv.diff > 0 ? "+" : ""}{tv.diff}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted font-semibold">{t("kpiStatus")}</div>
            <div className={`mt-1 text-sm font-bold ${tv.valid ? "text-emerald-700" : "text-amber-700"}`}>
              {tv.valid ? t("statusBalanced") : tv.diff > 0 ? t("statusMissing") : t("statusExcess")}
            </div>
          </div>
        </div>

        {/* Main actions */}
        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/appels`}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75M21 6v9.75c0 .621-.504 1.125-1.125 1.125H21M3 21h18M12 12.75a3 3 0 100-6 3 3 0 000 6z" />
            </svg>
            {t("fundsCallsButton")}
          </Link>
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/assemblees`}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
            </svg>
            {t("assembliesButton")}
          </Link>
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/comptabilite`}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            {t("accountingButton")}
          </Link>
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/fonds-travaux`}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-2.25 0-3-1-3-2.25S10.5 7.5 12 7.5c.768 0 1.536.219 2.121.659l.879.659" />
            </svg>
            Fonds de travaux
          </Link>
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/travaux`}
            className="inline-flex items-center gap-2 rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z" />
            </svg>
            Module travaux
          </Link>
          <Link href={`${lp}/syndic/coproprietes/${coown.id}/messagerie`}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
            </svg>
            Messagerie
          </Link>
          <button onClick={async () => {
            const { createPortalToken } = await import("@/lib/coownership-portal");
            try {
              const tok = await createPortalToken({ coownership_id: coown.id, expires_in_days: 365 });
              const url = `${window.location.origin}/conseil-syndical/${tok.token}`;
              await navigator.clipboard.writeText(url);
              alert(`Lien dashboard conseil syndical copié ✓\n\n${url}`);
            } catch (err) {
              alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
            }
          }}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
            </svg>
            Dashboard conseil
          </button>
        </div>

        {/* Units list */}
        <div className="mt-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-navy">{t("lotsTitle")}</h2>
          <button onClick={() => { setShowAddUnit(!showAddUnit); setEditingUnitId(null); setUnitDraft(emptyUnit); }}
            className="rounded-lg bg-navy px-3 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {showAddUnit ? t("cancel") : t("addUnit")}
          </button>
        </div>

        {(showAddUnit || editingUnitId) && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <h3 className="text-sm font-semibold text-navy mb-3">
              {editingUnitId ? t("editUnit") : t("newUnit")}
            </h3>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="text" placeholder={t("placeholderLotNumber")} value={unitDraft.lot_number ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, lot_number: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <select value={unitDraft.unit_type ?? "apartment"}
                onChange={(e) => setUnitDraft((p) => ({ ...p, unit_type: e.target.value as UnitType }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.keys(UNIT_TYPE_LABEL) as UnitType[]).map((ut) => (
                  <option key={ut} value={ut}>{UNIT_TYPE_LABEL[ut]}</option>
                ))}
              </select>
              <input type="number" placeholder={t("placeholderTantiemes")} value={unitDraft.tantiemes ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, tantiemes: Number(e.target.value) || 0 }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("placeholderFloor")} value={unitDraft.floor ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, floor: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("placeholderSurface")} value={unitDraft.surface_m2 ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, surface_m2: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("placeholderRooms")} value={unitDraft.nb_rooms ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, nb_rooms: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="text" placeholder={t("placeholderOwner")} value={unitDraft.owner_name ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, owner_name: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-2" />
              <input type="email" placeholder={t("placeholderOwnerEmail")} value={unitDraft.owner_email ?? ""}
                onChange={(e) => setUnitDraft((p) => ({ ...p, owner_email: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <select value={unitDraft.occupancy ?? "owner_occupied"}
                onChange={(e) => setUnitDraft((p) => ({ ...p, occupancy: e.target.value as Occupancy }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.keys(OCCUPANCY_LABEL) as Occupancy[]).map((o) => (
                  <option key={o} value={o}>{OCCUPANCY_LABEL[o]}</option>
                ))}
              </select>
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={editingUnitId ? handleUpdateUnit : handleAddUnit}
                disabled={!unitDraft.lot_number}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-40">
                {editingUnitId ? t("saveUnit") : t("addUnitButton")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        {units.length === 0 && !showAddUnit && (
          <div className="mt-4 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
            {t("noUnits")}
          </div>
        )}

        <div className="mt-4 overflow-x-auto rounded-xl border border-card-border bg-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left text-xs uppercase tracking-wider text-muted">
                <th className="px-4 py-2 font-semibold">{t("thLot")}</th>
                <th className="px-4 py-2 font-semibold">{t("thType")}</th>
                <th className="px-4 py-2 font-semibold text-right">{t("thTantiemes")}</th>
                <th className="px-4 py-2 font-semibold text-right">{t("thSurface")}</th>
                <th className="px-4 py-2 font-semibold">{t("thOwner")}</th>
                <th className="px-4 py-2 font-semibold">{t("thStatus")}</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-card-border/50">
              {units.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-4 py-2 font-medium text-navy">{u.lot_number}</td>
                  <td className="px-4 py-2 text-muted">{UNIT_TYPE_LABEL[u.unit_type]}</td>
                  <td className="px-4 py-2 text-right font-mono">{u.tantiemes.toLocaleString("fr-LU")}</td>
                  <td className="px-4 py-2 text-right">{u.surface_m2 ? `${u.surface_m2} m\u00B2` : "\u2014"}</td>
                  <td className="px-4 py-2">{u.owner_name ?? "\u2014"}</td>
                  <td className="px-4 py-2">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {OCCUPANCY_LABEL[u.occupancy]}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button onClick={() => { setEditingUnitId(u.id); setUnitDraft(u); setShowAddUnit(false); }}
                      className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50 mr-1">
                      {t("editButton")}
                    </button>
                    <button onClick={async () => {
                      const { createPortalToken, buildPortalUrl } = await import("@/lib/coownership-portal");
                      try {
                        const tok = await createPortalToken({ coownership_id: coown.id, unit_id: u.id, email: u.owner_email, expires_in_days: 365 });
                        const url = buildPortalUrl(tok.token);
                        await navigator.clipboard.writeText(url);
                        alert(`Lien portail copié ✓\n\n${url}\n\nÀ transmettre au copropriétaire par email.`);
                      } catch (err) {
                        alert("Erreur : " + (err instanceof Error ? err.message : "inconnue"));
                      }
                    }}
                      className="rounded-md bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:from-purple-700 hover:to-indigo-700 mr-1"
                      title="Générer un lien d'accès portail pour ce copropriétaire">
                      🔗 Portail
                    </button>
                    <button onClick={() => handleDeleteUnit(u.id)}
                      className="rounded-md p-1 text-muted hover:text-rose-600 hover:bg-rose-50" title={t("deleteTitle")}>
                      <svg className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>{t("roadmapNote")}</strong>
        </div>
      </div>
    </div>
  );
}
