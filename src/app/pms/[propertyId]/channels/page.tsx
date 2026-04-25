"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRoomTypes, listRooms } from "@/lib/pms/rooms";
import {
  listCalendars, createCalendar, updateCalendar, deleteCalendar,
  calendarStats, triggerSync, detectSourceFromUrl, iCalUrlValidation,
  SOURCE_COLORS,
  type PmsExternalCalendar, type PmsCalendarSource, type ExternalCalendarStats,
} from "@/lib/pms/external-calendars";
import type { PmsProperty, PmsRoom, PmsRoomType } from "@/lib/pms/types";
import { errMsg } from "@/lib/pms/errors";

const SOURCE_OPTIONS: PmsCalendarSource[] = [
  "airbnb", "booking", "vrbo", "homeaway", "expedia", "agoda", "tripadvisor", "custom_ics",
];

const SOURCE_KEY: Record<PmsCalendarSource, string> = {
  airbnb: "sourceAirbnb",
  booking: "sourceBooking",
  vrbo: "sourceVrbo",
  homeaway: "sourceHomeaway",
  expedia: "sourceExpedia",
  agoda: "sourceAgoda",
  tripadvisor: "sourceTripadvisor",
  custom_ics: "sourceCustomIcs",
};

export default function ChannelsPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const t = useTranslations("pmsChannels");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [calendars, setCalendars] = useState<PmsExternalCalendar[]>([]);
  const [stats, setStats] = useState<Record<string, ExternalCalendarStats>>({});
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncingAll, setSyncingAll] = useState(false);
  const [flash, setFlash] = useState<string | null>(null);

  const sourceLabel = (s: PmsCalendarSource) => t(SOURCE_KEY[s]);

  const fmtDateTime = (s: string | null): string => {
    if (!s) return t("never");
    const d = new Date(s);
    return d.toLocaleString(dateLocale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const validateUrl = (url: string): string | null => {
    const code = iCalUrlValidation(url);
    if (!code) return null;
    if (code === "URL requise.") return t("errUrlRequired");
    if (code.startsWith("L'URL doit commencer")) return t("errUrlScheme");
    if (code === "URL trop longue.") return t("errUrlTooLong");
    return code;
  };

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<{
    source: PmsCalendarSource; label: string; ics_url: string;
    room_id: string; room_type_id: string;
  }>({
    source: "airbnb", label: "", ics_url: "", room_id: "", room_type_id: "",
  });

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [p, cs, rt, rr] = await Promise.all([
        getProperty(propertyId),
        listCalendars(propertyId),
        listRoomTypes(propertyId),
        listRooms(propertyId),
      ]);
      setProperty(p);
      setCalendars(cs);
      setRoomTypes(rt);
      setRooms(rr);
      const st: Record<string, ExternalCalendarStats> = {};
      await Promise.all(cs.map(async (c) => {
        const s = await calendarStats(c.id);
        if (s) st[c.id] = s;
      }));
      setStats(st);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const submitNew = async () => {
    const urlErr = validateUrl(form.ics_url);
    if (urlErr) { setError(urlErr); return; }
    if (!form.label.trim()) { setError(t("errLabelRequired")); return; }
    try {
      await createCalendar({
        property_id: propertyId,
        source: form.source,
        label: form.label,
        ics_url: form.ics_url,
        room_id: form.room_id || null,
        room_type_id: form.room_type_id || null,
      });
      setForm({ source: "airbnb", label: "", ics_url: "", room_id: "", room_type_id: "" });
      setShowForm(false);
      setError(null);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const handleSync = async (cal: PmsExternalCalendar) => {
    setSyncing(cal.id);
    try {
      const res = await triggerSync(cal.id);
      if (res.ok) {
        setFlash(t("flashSyncResult", {
          source: sourceLabel(cal.source),
          imported: res.imported,
          updated: res.updated,
          deactivated: res.deactivated,
        }));
      } else {
        setError(res.error || t("errSyncFailed"));
      }
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
    setSyncing(null);
  };

  const handleSyncAll = async () => {
    setSyncingAll(true);
    for (const cal of calendars.filter((c) => c.active)) {
      await triggerSync(cal.id);
    }
    await reload();
    setSyncingAll(false);
    setFlash(t("flashSyncAllDone"));
  };

  const handleToggle = async (cal: PmsExternalCalendar) => {
    await updateCalendar(cal.id, { active: !cal.active });
    await reload();
  };

  const handleDelete = async (cal: PmsExternalCalendar) => {
    if (!confirm(t("confirmDelete", { label: cal.label }))) return;
    await deleteCalendar(cal.id);
    await reload();
  };

  const handleUrlChange = (v: string) => {
    const next = { ...form, ics_url: v };
    if (v && form.source === "airbnb" && !form.label) {
      next.source = detectSourceFromUrl(v);
      next.label = sourceLabel(next.source);
    } else if (v) {
      next.source = detectSourceFromUrl(v);
    }
    setForm(next);
  };

  if (authLoading || loading) {
    return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  }
  if (!user || !property) return (
    <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted">
      <Link href="/connexion" className="text-navy underline">{t("signIn")}</Link>
    </div>
  );

  const totalFuture = Object.values(stats).reduce((s, x) => s + (x.future_blocks ?? 0), 0);
  const totalActive = Object.values(stats).reduce((s, x) => s + (x.active_blocks ?? 0), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <Link href={`/pms/${propertyId}`} className="text-xs text-muted hover:text-navy">← {property.name}</Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
        </div>
        <div className="flex gap-2">
          {calendars.filter((c) => c.active).length > 0 && (
            <button onClick={handleSyncAll} disabled={syncingAll}
              className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 disabled:opacity-50">
              {syncingAll ? t("syncing") : t("btnSyncAll")}
            </button>
          )}
          <button onClick={() => setShowForm(!showForm)}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light">
            {showForm ? t("btnCancel") : t("btnAddFeed")}
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Stats */}
      {calendars.length > 0 && (
        <div className="mt-5 grid gap-3 sm:grid-cols-4">
          <StatCard label={t("statActiveFeeds")} value={calendars.filter((c) => c.active).length} />
          <StatCard label={t("statTotalFeeds")} value={calendars.length} />
          <StatCard label={t("statActiveBlocksToday")} value={totalActive} tone="emerald" />
          <StatCard label={t("statFutureBlocks")} value={totalFuture} tone="blue" />
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="mt-5 rounded-xl border border-navy/20 bg-navy/5 p-5 space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy">{t("formTitle")}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-xs sm:col-span-2">
              <div className="mb-1 font-semibold text-slate">{t("fieldUrl")}</div>
              <input type="url" value={form.ics_url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://www.airbnb.com/calendar/ical/XXX.ics?s=YYY"
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono" />
              <div className="mt-1 text-[10px] text-muted">{t("fieldUrlHint")}</div>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldSource")}</div>
              <select value={form.source}
                onChange={(e) => setForm({ ...form, source: e.target.value as PmsCalendarSource })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                {SOURCE_OPTIONS.map((s) => (
                  <option key={s} value={s}>{sourceLabel(s)}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldLabel")}</div>
              <input type="text" value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={t("labelPlaceholder", { source: sourceLabel(form.source) })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldRoom")}</div>
              <select value={form.room_id}
                onChange={(e) => setForm({ ...form, room_id: e.target.value, room_type_id: "" })}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
                <option value="">{t("optWholeProperty")}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>{t("roomNumber", { number: r.number })}</option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              <div className="mb-1 font-semibold text-slate">{t("fieldRoomType")}</div>
              <select value={form.room_type_id}
                onChange={(e) => setForm({ ...form, room_type_id: e.target.value, room_id: "" })}
                disabled={!!form.room_id}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm disabled:opacity-50">
                <option value="">{t("optNotSpecified")}</option>
                {roomTypes.map((rt) => (
                  <option key={rt.id} value={rt.id}>{rt.name}</option>
                ))}
              </select>
            </label>
          </div>
          <button onClick={submitNew}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
            {t("btnCreate")}
          </button>
        </div>
      )}

      {/* Calendars list */}
      {calendars.length === 0 ? (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {t("emptyState")}
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {calendars.map((c) => {
            const st = stats[c.id];
            const isError = c.last_sync_status === "error";
            return (
              <div key={c.id} className={`rounded-xl border p-4 ${isError ? "border-rose-200 bg-rose-50/40" : "border-card-border bg-card"}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: c.color ?? SOURCE_COLORS[c.source] }} />
                      <h3 className="text-base font-semibold text-navy">{c.label}</h3>
                      {!c.active && (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-700">{t("badgeDisabled")}</span>
                      )}
                      <span className="rounded-full bg-background px-2 py-0.5 text-[10px] font-semibold text-navy">
                        {sourceLabel(c.source)}
                      </span>
                    </div>
                    <div className="mt-1 text-[10px] font-mono text-muted truncate">{c.ics_url}</div>
                    {(c.room_id || c.room_type_id) && (
                      <div className="mt-1 text-[11px] text-muted">
                        {c.room_id
                          ? t("scopeRoom", { number: rooms.find((r) => r.id === c.room_id)?.number ?? t("scopeUnknown") })
                          : t("scopeType", { name: roomTypes.find((rt) => rt.id === c.room_type_id)?.name ?? t("scopeUnknown") })}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleSync(c)} disabled={syncing === c.id || syncingAll}
                      className="rounded-lg bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50">
                      {syncing === c.id ? t("btnSyncShort") : t("btnSync")}
                    </button>
                    <button onClick={() => handleToggle(c)}
                      className="rounded-lg border border-card-border bg-white px-3 py-1.5 text-xs font-semibold text-slate hover:bg-background">
                      {c.active ? t("btnDisable") : t("btnEnable")}
                    </button>
                    <button onClick={() => handleDelete(c)}
                      className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50">
                      {t("btnDelete")}
                    </button>
                  </div>
                </div>

                {/* Stats row */}
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5 text-[11px]">
                  <StatMini label={t("miniLastSync")} value={fmtDateTime(c.last_sync_at)} />
                  <StatMini label={t("miniSyncTotal")} value={String(c.sync_count)} />
                  <StatMini label={t("miniEventsImport")} value={String(c.events_count)} />
                  <StatMini label={t("miniActiveBlocks")} value={String(st?.active_blocks ?? 0)} tone="emerald" />
                  <StatMini label={t("miniFutureBlocks")} value={String(st?.future_blocks ?? 0)} tone="blue" />
                </div>

                {isError && c.last_error && (
                  <div className="mt-2 rounded border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-900">
                    <strong>{t("errorLabel")}</strong> {c.last_error}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900"
        dangerouslySetInnerHTML={{ __html: t.raw("knowNote") as string }} />
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "blue" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" :
    tone === "blue" ? "bg-blue-50 border-blue-200" :
    "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" :
    tone === "blue" ? "text-blue-900" : "text-navy";
  return (
    <div className={`rounded-xl border p-3 ${bg}`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}

function StatMini({ label, value, tone }: { label: string; value: string; tone?: "emerald" | "blue" }) {
  const txt = tone === "emerald" ? "text-emerald-700" :
    tone === "blue" ? "text-blue-700" : "text-navy";
  return (
    <div>
      <div className="text-[9px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`font-semibold ${txt}`}>{value}</div>
    </div>
  );
}
