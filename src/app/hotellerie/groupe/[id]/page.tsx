"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { pdf } from "@react-pdf/renderer";
import { useAuth } from "@/components/AuthProvider";
import HotelOwnerReportPdf from "@/components/HotelOwnerReportPdf";
import { getHotel, listPeriods, savePeriod, type Hotel, type HotelPeriod } from "@/lib/hotels";
import { listMyOrganizations, type Organization } from "@/lib/orgs";
import { formatEUR, formatPct } from "@/lib/calculations";
import { errMsg } from "@/lib/errors";

const QUARTER_PRESETS = [
  { label: "Q1", startM: 0, endM: 2 },
  { label: "Q2", startM: 3, endM: 5 },
  { label: "Q3", startM: 6, endM: 8 },
  { label: "Q4", startM: 9, endM: 11 },
];

export default function HotelDetailPage() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;
  const t = useTranslations("hotelDetail");
  const { user } = useAuth();
  const params = useParams();
  const id = String(params?.id ?? "");

  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [periods, setPeriods] = useState<HotelPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const thisYear = new Date().getFullYear();

  type Draft = Partial<HotelPeriod>;
  const emptyDraft: Draft = {
    period_label: `Q1 ${thisYear}`,
    period_start: `${thisYear}-01-01`,
    period_end: `${thisYear}-03-31`,
    occupancy: 0.65,
    adr: 120,
    revpar: null,
  };
  const [draft, setDraft] = useState<Draft>(emptyDraft);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const h = await getHotel(id);
      setHotel(h);
      if (h) {
        const ps = await listPeriods(h.id);
        setPeriods(ps);
        const orgs = await listMyOrganizations();
        setOrg(orgs.find((o) => o.id === h.org_id) ?? null);
      }
    } catch (e) { setError(errMsg(e, t("error"))); }
    finally { setLoading(false); }
  }, [id, t]);

  useEffect(() => {
    if (id && user) void refresh();
  }, [id, user, refresh]);

  const applyQuarterPreset = (q: typeof QUARTER_PRESETS[0], year: number) => {
    const start = new Date(Date.UTC(year, q.startM, 1));
    const end = new Date(Date.UTC(year, q.endM + 1, 0));
    setDraft((p) => ({
      ...p,
      period_label: `${q.label} ${year}`,
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
    }));
  };

  const handleSave = async () => {
    if (!hotel || !draft.period_start || !draft.period_end) return;
    try {
      const revpar = draft.adr != null && draft.occupancy != null ? draft.adr * draft.occupancy : null;
      const revenueTotal =
        (draft.revenue_rooms ?? 0) + (draft.revenue_fb ?? 0) + (draft.revenue_mice ?? 0) + (draft.revenue_other ?? 0);
      const totalCharges =
        (draft.staff_cost ?? 0) + (draft.energy_cost ?? 0) + (draft.other_opex ?? 0);
      const gop = revenueTotal - totalCharges;
      const gopMargin = revenueTotal > 0 ? gop / revenueTotal : null;
      const ffe = revenueTotal > 0 ? revenueTotal * 0.04 : 0;
      const ebitda = gop - ffe;
      const ebitdaMargin = revenueTotal > 0 ? ebitda / revenueTotal : null;

      await savePeriod({
        id: editingId ?? undefined,
        hotel_id: hotel.id,
        period_start: draft.period_start,
        period_end: draft.period_end,
        period_label: draft.period_label ?? null,
        occupancy: draft.occupancy ?? null,
        adr: draft.adr ?? null,
        revpar,
        revenue_rooms: draft.revenue_rooms ?? null,
        revenue_fb: draft.revenue_fb ?? null,
        revenue_mice: draft.revenue_mice ?? null,
        revenue_other: draft.revenue_other ?? null,
        revenue_total: revenueTotal || null,
        staff_cost: draft.staff_cost ?? null,
        energy_cost: draft.energy_cost ?? null,
        other_opex: draft.other_opex ?? null,
        ffe_reserve: ffe || null,
        gop: revenueTotal > 0 ? gop : null,
        gop_margin: gopMargin,
        ebitda: revenueTotal > 0 ? ebitda : null,
        ebitda_margin: ebitdaMargin,
        compset_revpar: draft.compset_revpar ?? null,
        mpi: draft.mpi ?? null,
        ari: draft.ari ?? null,
        rgi: draft.rgi ?? null,
        notes: draft.notes ?? null,
      });
      setShowForm(false);
      setEditingId(null);
      setDraft(emptyDraft);
      await refresh();
    } catch (e) { setError(errMsg(e, t("error"))); }
  };

  const downloadReport = async (period: HotelPeriod) => {
    if (!hotel || !org) return;
    const sorted = [...periods].sort((a, b) => a.period_start.localeCompare(b.period_start));
    const currIdx = sorted.findIndex((p) => p.id === period.id);
    const previous = currIdx > 0 ? sorted[currIdx - 1] : null;

    const blob = await pdf(
      <HotelOwnerReportPdf hotel={hotel} period={period} groupName={org.name} previousPeriod={previous} />
    ).toBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safeName = hotel.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
    a.download = `owner-report-${safeName}-${period.period_start.slice(0, 7)}.pdf`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!hotel) return (
    <div className="mx-auto max-w-5xl px-4 py-16 text-center">
      <p className="text-sm text-muted">{t("notFound")}</p>
      <Link href={`${lp}/hotellerie/groupe`} className="mt-4 inline-flex text-sm text-navy underline">{t("backToGroup")}</Link>
    </div>
  );

  return (
    <div className="bg-background min-h-screen py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href={`${lp}/hotellerie/groupe`} className="text-xs text-muted hover:text-navy">← {org?.name ?? "Groupe"}</Link>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">{hotel.name}</h1>
            <p className="mt-1 text-sm text-muted">
              {hotel.category} · {hotel.nb_chambres} {t("rooms")}
              {hotel.commune ? ` · ${hotel.commune}` : ""}
            </p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditingId(null); setDraft(emptyDraft); }}
            className="rounded-lg bg-purple-700 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-800">
            {showForm ? t("cancelBtn") : t("addPeriod")}
          </button>
        </div>

        {showForm && (
          <div className="mt-4 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-base font-semibold text-navy">{editingId ? t("editPeriodTitle") : t("newPeriodTitle")}</h2>

            <div className="mt-2 flex flex-wrap gap-2">
              {QUARTER_PRESETS.map((q) => (
                <button key={q.label} onClick={() => applyQuarterPreset(q, thisYear)}
                  className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-navy hover:bg-slate-50">
                  {q.label} {thisYear}
                </button>
              ))}
              {QUARTER_PRESETS.map((q) => (
                <button key={q.label + "prev"} onClick={() => applyQuarterPreset(q, thisYear - 1)}
                  className="rounded-md border border-card-border bg-white px-2 py-1 text-[11px] font-medium text-muted hover:bg-slate-50">
                  {q.label} {thisYear - 1}
                </button>
              ))}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <input type="text" placeholder={t("periodLabelPlaceholder")} value={draft.period_label ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, period_label: e.target.value }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-3" />
              <div><label className="block text-xs text-muted mb-1">{t("startDate")}</label>
                <input type="date" value={draft.period_start ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_start: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">{t("endDate")}</label>
                <input type="date" value={draft.period_end ?? ""} onChange={(e) => setDraft((p) => ({ ...p, period_end: e.target.value }))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div></div>

              <div><label className="block text-xs text-muted mb-1">{t("occupancyRate")}</label>
                <input type="number" step="0.01" value={draft.occupancy ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, occupancy: Number(e.target.value) || null }))}
                  placeholder="0.65"
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs text-muted mb-1">{t("adrLabel")}</label>
                <input type="number" value={draft.adr ?? ""}
                  onChange={(e) => setDraft((p) => ({ ...p, adr: Number(e.target.value) || null }))}
                  placeholder="120"
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" /></div>
              <div>
                <label className="block text-xs text-muted mb-1">{t("revparAuto")}</label>
                <div className="rounded-lg border border-input-border bg-slate-50 px-3 py-2 text-sm text-muted">
                  {draft.adr != null && draft.occupancy != null
                    ? formatEUR(draft.adr * draft.occupancy)
                    : "—"}
                </div>
              </div>

              <input type="number" placeholder={t("revenueRooms")} value={draft.revenue_rooms ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, revenue_rooms: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("revenueFb")} value={draft.revenue_fb ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, revenue_fb: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("revenueMice")} value={draft.revenue_mice ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, revenue_mice: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />

              <input type="number" placeholder={t("staffCost")} value={draft.staff_cost ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, staff_cost: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("energyCost")} value={draft.energy_cost ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, energy_cost: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("otherOpex")} value={draft.other_opex ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, other_opex: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />

              <input type="number" placeholder={t("mpiCompset")} value={draft.mpi ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, mpi: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("ariCompset")} value={draft.ari ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, ari: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
              <input type="number" placeholder={t("rgiCompset")} value={draft.rgi ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, rgi: Number(e.target.value) || null }))}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />

              <textarea placeholder={t("notesPlaceholder")} value={draft.notes ?? ""}
                onChange={(e) => setDraft((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm sm:col-span-3" />
            </div>
            <div className="mt-3 flex justify-end">
              <button onClick={handleSave}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                {editingId ? t("saveBtn") : t("addPeriodBtn")}
              </button>
            </div>
          </div>
        )}

        {error && <p className="mt-4 text-xs text-rose-700">{error}</p>}

        <div className="mt-6">
          <h2 className="text-lg font-semibold text-navy">{t("periodsTitle")}</h2>
          {periods.length === 0 && (
            <div className="mt-2 rounded-xl border border-dashed border-card-border bg-card p-8 text-center text-sm text-muted">
              {t("noPeriods")}
            </div>
          )}

          <div className="mt-3 space-y-3">
            {periods.map((p) => (
              <div key={p.id} className="rounded-xl border border-card-border bg-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold text-navy">{p.period_label || `${p.period_start} → ${p.period_end}`}</div>
                    <div className="mt-0.5 text-xs text-muted">
                      RevPAR {p.revpar != null ? formatEUR(p.revpar) : "—"}
                      {p.occupancy != null ? ` · ${t("occShort")} ${(p.occupancy * 100).toFixed(0)}%` : ""}
                      {p.adr != null ? ` · ADR ${formatEUR(p.adr)}` : ""}
                      {p.gop_margin != null ? ` · GOP ${formatPct(p.gop_margin)}` : ""}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button onClick={() => downloadReport(p)}
                      className="rounded-md bg-purple-50 border border-purple-200 px-3 py-1 text-xs font-medium text-purple-800 hover:bg-purple-100">
                      {t("ownerReportPdf")}
                    </button>
                    <button onClick={() => { setEditingId(p.id); setDraft(p as Draft); setShowForm(true); }}
                      className="rounded-md border border-card-border bg-white px-3 py-1 text-xs font-medium text-navy hover:bg-slate-50">
                      {t("editBtn")}
                    </button>
                  </div>
                </div>
                {(p.revenue_total != null || p.ebitda != null) && (
                  <div className="mt-3 grid grid-cols-3 gap-3 border-t border-card-border/50 pt-2 text-xs">
                    {p.revenue_total != null && <div><span className="text-muted">{t("revenuTotal")}</span><div className="font-semibold text-navy">{formatEUR(p.revenue_total)}</div></div>}
                    {p.gop != null && <div><span className="text-muted">{t("gopLabel")}</span><div className="font-semibold text-emerald-700">{formatEUR(p.gop)}</div></div>}
                    {p.ebitda != null && <div><span className="text-muted">{t("ebitdaLabel")}</span><div className="font-semibold text-purple-700">{formatEUR(p.ebitda)}</div></div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          {t("ownerReportInfo")}
        </div>
      </div>
    </div>
  );
}
