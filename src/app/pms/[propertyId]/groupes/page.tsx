"use client";

import { useEffect, useState, use, useCallback, useMemo } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import {
  listGroups, createGroup, updateGroup, deleteGroup,
  groupFillRate, cutoffAlert,
  GROUP_STATUS_COLORS,
  type PmsGroup, type PmsGroupStatus, type PmsGroupBillingMode,
} from "@/lib/pms/groups";
import type { PmsProperty } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

const GROUP_STATUS_KEY: Record<PmsGroupStatus, string> = {
  prospect: "statusProspect",
  tentative: "statusTentative",
  confirmed: "statusConfirmed",
  partially_booked: "statusPartiallyBooked",
  complete: "statusComplete",
  cancelled: "statusCancelled",
  completed: "statusCompleted",
};

const BILLING_MODE_KEY: Record<PmsGroupBillingMode, string> = {
  master_account: "billingMaster",
  individual: "billingIndividual",
  split: "billingSplit",
};

const MEETING_SETUP_KEYS: Record<string, string> = {
  theatre: "setupTheatre",
  classroom: "setupClassroom",
  u_shape: "setupUShape",
  banquet: "setupBanquet",
  cocktail: "setupCocktail",
  boardroom: "setupBoardroom",
};

export default function GroupsPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const t = useTranslations("pmsGroupes");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [groups, setGroups] = useState<PmsGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<PmsGroupStatus | "all" | "active">("active");
  const [showForm, setShowForm] = useState(false);

  const today = new Date();
  const emptyForm = {
    name: "",
    organizer_name: "",
    organizer_email: "",
    organizer_phone: "",
    organizer_company: "",
    check_in: today.toISOString().slice(0, 10),
    check_out: new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10),
    rooms_blocked: 10,
    negotiated_rate: 150,
    billing_mode: "individual" as PmsGroupBillingMode,
    cutoff_date: "",
    deposit_required: 0,
    has_meeting_room: false,
    meeting_room_setup: "",
    meeting_room_capacity: 0,
    fb_package: "",
    notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [p, g] = await Promise.all([
        getProperty(propertyId),
        listGroups(propertyId),
      ]);
      setProperty(p); setGroups(g);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.organizer_name.trim()) {
      setError(t("errNameRequired")); return;
    }
    if (form.rooms_blocked < 1) { setError(t("errMinRoom")); return; }
    try {
      await createGroup({
        property_id: propertyId,
        name: form.name,
        organizer_name: form.organizer_name,
        organizer_email: form.organizer_email || null,
        organizer_phone: form.organizer_phone || null,
        organizer_company: form.organizer_company || null,
        check_in: form.check_in,
        check_out: form.check_out,
        rooms_blocked: form.rooms_blocked,
        negotiated_rate: form.negotiated_rate || null,
        billing_mode: form.billing_mode,
        cutoff_date: form.cutoff_date || null,
        deposit_required: form.deposit_required || null,
        has_meeting_room: form.has_meeting_room,
        meeting_room_setup: form.has_meeting_room ? form.meeting_room_setup : null,
        meeting_room_capacity: form.has_meeting_room ? form.meeting_room_capacity || null : null,
        fb_package: form.has_meeting_room ? form.fb_package || null : null,
        notes: form.notes || null,
        status: "prospect",
      });
      setForm(emptyForm);
      setShowForm(false);
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleStatusChange = async (g: PmsGroup, newStatus: PmsGroupStatus) => {
    await updateGroup(g.id, { status: newStatus });
    await reload();
  };

  const handleDelete = async (g: PmsGroup) => {
    if (!confirm(t("confirmDelete", { name: g.name }))) return;
    await deleteGroup(g.id);
    await reload();
  };

  const filtered = useMemo(() => {
    if (filter === "all") return groups;
    if (filter === "active") {
      return groups.filter((g) => !["cancelled", "completed"].includes(g.status));
    }
    return groups.filter((g) => g.status === filter);
  }, [groups, filter]);

  const stats = useMemo(() => {
    const active = groups.filter((g) => !["cancelled", "completed"].includes(g.status));
    const roomsBlockedTotal = active.reduce((s, g) => s + g.rooms_blocked, 0);
    const roomsBookedTotal = active.reduce((s, g) => s + g.rooms_booked, 0);
    const revenueExpected = active.reduce((s, g) => s + (Number(g.total_expected_revenue) || 0), 0);
    const cutoffAlerts = active.filter((g) => {
      const fill = groupFillRate(g.rooms_booked, g.rooms_blocked);
      return cutoffAlert(g.cutoff_date, fill).severity !== "none";
    }).length;
    return { active: active.length, roomsBlockedTotal, roomsBookedTotal, revenueExpected, cutoffAlerts };
  }, [groups]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("signIn")}</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <span className="text-navy">{t("breadcrumb")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
          {showForm ? t("btnCancel") : t("btnNew")}
        </button>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-5">
        <Stat label={t("statActive")} value={String(stats.active)} />
        <Stat label={t("statRoomsBlocked")} value={stats.roomsBlockedTotal.toLocaleString(dateLocale)} />
        <Stat label={t("statRoomsBooked")} value={stats.roomsBookedTotal.toLocaleString(dateLocale)}
          sub={stats.roomsBlockedTotal > 0 ? t("statRoomsBookedSub", { rate: Math.round(stats.roomsBookedTotal / stats.roomsBlockedTotal * 100) }) : ""} />
        <Stat label={t("statRevenue")} value={formatEUR(stats.revenueExpected)} tone="emerald" />
        <Stat label={t("statCutoffAlerts")} value={String(stats.cutoffAlerts)}
          tone={stats.cutoffAlerts > 0 ? "amber" : undefined} />
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="mt-5 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("formTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("fName")} value={form.name}
              onChange={(v) => setForm({ ...form, name: v })}
              placeholder={t("fNamePh")} />
            <Field label={t("fOrganizer")} value={form.organizer_name}
              onChange={(v) => setForm({ ...form, organizer_name: v })} />
            <Field label={t("fOrgEmail")} type="email" value={form.organizer_email}
              onChange={(v) => setForm({ ...form, organizer_email: v })} />
            <Field label={t("fOrgPhone")} type="tel" value={form.organizer_phone}
              onChange={(v) => setForm({ ...form, organizer_phone: v })} />
            <Field label={t("fOrgCompany")} value={form.organizer_company}
              onChange={(v) => setForm({ ...form, organizer_company: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("fCheckIn")} type="date" value={form.check_in}
                onChange={(v) => setForm({ ...form, check_in: v })} />
              <Field label={t("fCheckOut")} type="date" value={form.check_out}
                onChange={(v) => setForm({ ...form, check_out: v })} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t("fRoomsBlocked")} type="number" value={String(form.rooms_blocked)}
                onChange={(v) => setForm({ ...form, rooms_blocked: Number(v) })} />
              <Field label={t("fNegRate")} type="number" value={String(form.negotiated_rate)}
                onChange={(v) => setForm({ ...form, negotiated_rate: Number(v) })} />
            </div>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fBilling")}</div>
              <select value={form.billing_mode}
                onChange={(e) => setForm({ ...form, billing_mode: e.target.value as PmsGroupBillingMode })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {(Object.keys(BILLING_MODE_KEY) as PmsGroupBillingMode[]).map((k) => (
                  <option key={k} value={k}>{t(BILLING_MODE_KEY[k])}</option>
                ))}
              </select>
            </label>
            <Field label={t("fCutoff")} type="date" value={form.cutoff_date}
              onChange={(v) => setForm({ ...form, cutoff_date: v })} />
            <Field label={t("fDeposit")} type="number" value={String(form.deposit_required)}
              onChange={(v) => setForm({ ...form, deposit_required: Number(v) })} />
          </div>

          <div className="border-t border-card-border pt-3">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy">
              <input type="checkbox" checked={form.has_meeting_room}
                onChange={(e) => setForm({ ...form, has_meeting_room: e.target.checked })} />
              {t("fHasMice")}
            </label>
            {form.has_meeting_room && (
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <label className="text-xs">
                  <div className="mb-1 font-semibold text-slate">{t("fSetup")}</div>
                  <select value={form.meeting_room_setup}
                    onChange={(e) => setForm({ ...form, meeting_room_setup: e.target.value })}
                    className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                    <option value="">{t("setupDash")}</option>
                    {Object.keys(MEETING_SETUP_KEYS).map((k) => (
                      <option key={k} value={k}>{t(MEETING_SETUP_KEYS[k])}</option>
                    ))}
                  </select>
                </label>
                <Field label={t("fCapacity")} type="number" value={String(form.meeting_room_capacity)}
                  onChange={(v) => setForm({ ...form, meeting_room_capacity: Number(v) })} />
                <Field label={t("fFbPackage")} value={form.fb_package}
                  onChange={(v) => setForm({ ...form, fb_package: v })}
                  placeholder={t("fFbPackagePh")} />
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fNotes")}</div>
              <textarea value={form.notes} rows={2}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
          </div>

          <div className="flex justify-end">
            <button onClick={handleCreate}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
              {t("btnCreate")}
            </button>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="mt-5 flex flex-wrap gap-2">
        {(["active", "all"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === f ? "bg-navy text-white" : "bg-card border border-card-border text-slate"
            }`}>
            {f === "active" ? t("filterActive") : t("filterAll")} ({f === "active" ? stats.active : groups.length})
          </button>
        ))}
        {(["prospect", "tentative", "confirmed", "partially_booked", "complete"] as PmsGroupStatus[]).map((s) => (
          <button key={s} onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              filter === s ? "bg-navy text-white" : GROUP_STATUS_COLORS[s]
            }`}>
            {t(GROUP_STATUS_KEY[s])}
          </button>
        ))}
      </div>

      {/* Liste */}
      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {filter !== "all" && filter !== "active"
            ? t("emptyStatus", { status: t(GROUP_STATUS_KEY[filter as PmsGroupStatus]) })
            : t("emptyAll")}
        </div>
      ) : (
        <div className="mt-5 space-y-3">
          {filtered.map((g) => {
            const fillRate = groupFillRate(g.rooms_booked, g.rooms_blocked);
            const alert = cutoffAlert(g.cutoff_date, fillRate);
            return (
              <div key={g.id} className={`rounded-xl border p-4 ${
                alert.severity === "critical" ? "border-rose-300 bg-rose-50/30" :
                alert.severity === "warning" ? "border-amber-300 bg-amber-50/30" :
                "border-card-border bg-card"
              }`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-[11px] text-muted">{g.code}</span>
                      <h3 className="text-base font-bold text-navy">{g.name}</h3>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${GROUP_STATUS_COLORS[g.status]}`}>
                        {t(GROUP_STATUS_KEY[g.status])}
                      </span>
                      {g.has_meeting_room && (
                        <span className="rounded-full bg-indigo-100 text-indigo-900 px-2 py-0.5 text-[10px]">
                          🎤 {t("miceBadge")}
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {g.organizer_name}
                      {g.organizer_company && ` · ${g.organizer_company}`}
                      {g.organizer_email && ` · ${g.organizer_email}`}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs">
                      <span>📅 {new Date(g.check_in).toLocaleDateString(dateLocale)} → {new Date(g.check_out).toLocaleDateString(dateLocale)} ({t("nights", { n: g.nb_nights })})</span>
                      <span>🛏️ <strong>{t("rooms", { booked: g.rooms_booked, blocked: g.rooms_blocked, rate: fillRate })}</strong></span>
                      {g.negotiated_rate && <span>💰 {t("negRate", { amount: formatEUR(Number(g.negotiated_rate)) })}</span>}
                      {g.total_expected_revenue && <span className="text-emerald-700 font-semibold">= {formatEUR(Number(g.total_expected_revenue))}</span>}
                    </div>

                    {/* Progress bar */}
                    <div className="mt-2 h-1.5 w-full rounded-full bg-background overflow-hidden">
                      <div className={`h-full ${fillRate >= 80 ? "bg-emerald-500" : fillRate >= 50 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${Math.min(100, fillRate)}%` }} />
                    </div>

                    {alert.severity !== "none" && (
                      <div className={`mt-2 rounded-lg px-2 py-1 text-xs ${
                        alert.severity === "critical" ? "bg-rose-100 text-rose-900" :
                        alert.severity === "warning" ? "bg-amber-100 text-amber-900" :
                        "bg-blue-100 text-blue-900"
                      }`}>
                        ⚠️ {alert.message}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <select value={g.status}
                      onChange={(e) => handleStatusChange(g, e.target.value as PmsGroupStatus)}
                      className="rounded border border-input-border bg-input-bg px-2 py-1 text-xs">
                      {(Object.keys(GROUP_STATUS_KEY) as PmsGroupStatus[]).map((k) => (
                        <option key={k} value={k}>{t(GROUP_STATUS_KEY[k])}</option>
                      ))}
                    </select>
                    <Link href={`/pms/${propertyId}/reservations/nouveau?group=${g.id}`}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">
                      {t("btnNewIndividual")}
                    </Link>
                    <button onClick={() => handleDelete(g)}
                      className="text-xs text-rose-700 hover:underline">
                      {t("btnDelete")}
                    </button>
                  </div>
                </div>

                {g.notes && (
                  <div className="mt-2 rounded bg-background px-2 py-1 text-xs text-slate italic">
                    {g.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>{t("workflowTitle")}</strong> {t("workflowText")}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void;
  type?: "text" | "email" | "tel" | "date" | "number";
  placeholder?: string;
}) {
  return (
    <label className="block text-xs">
      <div className="mb-1 font-semibold text-slate">{label}</div>
      <input type={type} value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
    </label>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" | "amber" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "amber" ? "text-amber-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
