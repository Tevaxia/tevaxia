"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRooms, listRoomTypes } from "@/lib/pms/rooms";
import { listRatePlans } from "@/lib/pms/rates";
import { listReservations, fetchAvailability } from "@/lib/pms/reservations";
import { aggregateKpis } from "@/lib/pms/kpi";
import type {
  PmsAvailabilityRow, PmsProperty, PmsRatePlan, PmsReservation,
  PmsRoom, PmsRoomType, PmsNightAudit,
} from "@/lib/pms/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";
import {
  ResponsiveContainer, AreaChart, Area, Tooltip, YAxis,
} from "recharts";
import { SkeletonStat, SkeletonCard } from "@/components/Skeleton";

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysISO(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

export default function PropertyOverviewPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const ts = useTranslations("pms.reservationStatus");
  const t = useTranslations("pms.property");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [availability, setAvailability] = useState<PmsAvailabilityRow[]>([]);
  const [audits, setAudits] = useState<PmsNightAudit[]>([]);
  const [auditsPrev, setAuditsPrev] = useState<PmsNightAudit[]>([]);
  const [ratePlans, setRatePlans] = useState<PmsRatePlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const [p, types, rr, plans, res, avail] = await Promise.all([
        getProperty(propertyId),
        listRoomTypes(propertyId),
        listRooms(propertyId),
        listRatePlans(propertyId),
        listReservations(propertyId, { fromDate: plusDaysISO(-30), toDate: plusDaysISO(60) }),
        fetchAvailability(propertyId, todayISO(), plusDaysISO(13)),
      ]);
      setProperty(p);
      setRoomTypes(types);
      setRooms(rr);
      setRatePlans(plans);
      setReservations(res);
      setAvailability(avail);

      if (isSupabaseConfigured && supabase) {
        const [curr, prev] = await Promise.all([
          supabase
            .from("pms_night_audits")
            .select("*")
            .eq("property_id", propertyId)
            .gte("audit_date", plusDaysISO(-30))
            .lte("audit_date", plusDaysISO(0))
            .order("audit_date"),
          supabase
            .from("pms_night_audits")
            .select("*")
            .eq("property_id", propertyId)
            .gte("audit_date", plusDaysISO(-60))
            .lt("audit_date", plusDaysISO(-30))
            .order("audit_date"),
        ]);
        setAudits((curr.data ?? []) as PmsNightAudit[]);
        setAuditsPrev((prev.data ?? []) as PmsNightAudit[]);
      }
      setLoading(false);
    })();
  }, [propertyId, user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="h-7 w-64 animate-pulse rounded bg-card-border/50" />
        <div className="mt-2 h-3 w-80 animate-pulse rounded bg-card-border/50" />
        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => <SkeletonStat key={i} />)}
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <div className="sr-only">{tc("loading")}</div>
      </div>
    );
  }
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;
  if (!property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">{tc("propertyNotFound")}</div>;

  const today = todayISO();
  const totalRooms = rooms.length;
  const roomsByStatus = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const occupiedRooms = roomsByStatus["occupied"] ?? 0;
  const availableRooms = roomsByStatus["available"] ?? 0;
  const dirtyRooms = roomsByStatus["dirty"] ?? 0;

  const arrivalsToday = reservations.filter((r) => r.check_in === today && (r.status === "confirmed" || r.status === "checked_in"));
  const departuresToday = reservations.filter((r) => r.check_out === today && r.status === "checked_in");
  const inHouse = reservations.filter((r) => r.status === "checked_in").length;
  const pendingQuotes = reservations.filter((r) => r.status === "quote").length;

  const occToday = totalRooms > 0 ? (occupiedRooms / totalRooms) * 100 : 0;
  const kpis = aggregateKpis(audits);
  const kpisPrev = aggregateKpis(auditsPrev);

  // Sparkline data (14 derniers jours d'audits)
  const spark = audits.slice(-14).map((a) => ({
    day: a.audit_date.slice(5),
    occ: Math.round(Number(a.occupancy_pct) * 10) / 10,
  }));

  // Trend 7d : compare avg dernière semaine vs avant-dernière
  const last7 = audits.slice(-7);
  const prev7 = audits.slice(-14, -7);
  const avg7 = last7.length > 0 ? last7.reduce((s, a) => s + Number(a.occupancy_pct), 0) / last7.length : 0;
  const avgPrev7 = prev7.length > 0 ? prev7.reduce((s, a) => s + Number(a.occupancy_pct), 0) / prev7.length : 0;
  const trend7 = avg7 - avgPrev7;

  const configIncomplete = roomTypes.length === 0 || rooms.length === 0 || ratePlans.length === 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:py-10">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <Link href="/pms" className="text-[11px] text-muted hover:text-navy inline-flex items-center gap-1">
            ← {t("backAllProps")}
          </Link>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl truncate">{property.name}</h1>
          <div className="mt-1 flex items-center gap-2 text-[11px] text-muted">
            {property.commune && <span>{property.commune}</span>}
            <span>·</span>
            <span>TVA {property.tva_rate}%</span>
            {property.taxe_sejour_eur != null && property.taxe_sejour_eur > 0 && (
              <>
                <span>·</span>
                <span>Tx séj. {property.taxe_sejour_eur} €</span>
              </>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/pms/${propertyId}/reservations/nouveau`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-light transition-colors"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            {t("newReservation")}
          </Link>
        </div>
      </div>

      {/* Config banner */}
      {configIncomplete && (
        <div className="mt-5 rounded-xl border border-gold bg-gradient-to-r from-gold/15 via-amber-50 to-gold/15 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-navy">⚙️ {t("configBanner")}</h2>
              <p className="mt-1 text-xs text-muted max-w-2xl">{t("configBannerDesc")}</p>
              <ul className="mt-2 flex flex-wrap gap-3 text-[11px]">
                <li className={roomTypes.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {roomTypes.length > 0 ? "✅" : "◯"} {t("configCheckTypes")} ({roomTypes.length})
                </li>
                <li className={rooms.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {rooms.length > 0 ? "✅" : "◯"} {t("configCheckRooms")} ({rooms.length})
                </li>
                <li className={ratePlans.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {ratePlans.length > 0 ? "✅" : "◯"} {t("configCheckPlans")} ({ratePlans.length})
                </li>
              </ul>
            </div>
            <Link
              href={`/pms/${propertyId}/setup`}
              className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-light whitespace-nowrap"
            >
              {t("configBannerCta")}
            </Link>
          </div>
        </div>
      )}

      {/* Nav remplacée par la sidebar PMS (voir layout.tsx) */}
      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900 lg:hidden">
        👈 Utilisez <strong>Outils PMS</strong> dans la sidebar (bouton ☰ en bas à droite sur mobile) pour accéder au front desk, calendrier, tarifs, channels iCal, USALI, pickup, forecast.
      </div>

      {/* Hero — occupancy today with sparkline */}
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl bg-gradient-to-br from-navy-dark via-navy to-navy-light text-white p-6 shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <div className="text-[11px] uppercase tracking-wider text-white/60 font-medium">{t("heroOccToday")}</div>
            <div className="mt-2 flex items-baseline gap-3 flex-wrap">
              <div className="text-5xl font-bold tabular-nums">{occToday.toFixed(0)}<span className="text-2xl text-white/60">%</span></div>
              <div className="text-sm text-white/70">
                {occupiedRooms}/{totalRooms}
              </div>
              <TrendBadge delta={trend7} suffix=" pp" labelKey={t("heroOccTrend")} />
            </div>
          </div>
          {spark.length > 1 && (
            <div className="absolute inset-0 opacity-40 pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={spark} margin={{ top: 40, right: 0, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sparkGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#d4a84a" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#d4a84a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <YAxis hide domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: "rgba(30,58,95,0.95)", border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, fontSize: 10, color: "white" }}
                    formatter={(v) => [`${v} %`, "Occ."]}
                    labelStyle={{ color: "white" }}
                  />
                  <Area type="monotone" dataKey="occ" stroke="#d4a84a" strokeWidth={2} fill="url(#sparkGradient)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Room status board */}
        <div className="rounded-2xl border border-card-border bg-card p-5">
          <div className="text-[11px] uppercase tracking-wider text-muted font-medium">{t("roomStatusBoard")}</div>
          <div className="mt-3 space-y-1.5">
            <StatusBar label={t("legendAvailable")} value={availableRooms} total={totalRooms} color="bg-emerald-500" />
            <StatusBar label={t("legendOccupied")} value={occupiedRooms} total={totalRooms} color="bg-blue-500" />
            <StatusBar label={t("legendDirty")} value={dirtyRooms} total={totalRooms} color="bg-amber-500" />
            {(totalRooms - availableRooms - occupiedRooms - dirtyRooms) > 0 && (
              <StatusBar label={t("legendOther")} value={totalRooms - availableRooms - occupiedRooms - dirtyRooms} total={totalRooms} color="bg-slate-400" />
            )}
          </div>
          <Link href={`/pms/${propertyId}/chambres`} className="mt-4 inline-flex items-center gap-1 text-[11px] text-navy hover:underline">
            {t("navRooms")} →
          </Link>
        </div>
      </section>

      {/* Today's operations — quatre tuiles actionnables */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("todaysOps")}</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <OpTile
            label={t("opsArrivals")}
            value={arrivalsToday.length}
            icon={<PathIcon d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />}
            tone={arrivalsToday.length > 0 ? "emerald" : "muted"}
            href={`/pms/${propertyId}/reservations?filter=today-arrivals`}
          />
          <OpTile
            label={t("opsDepartures")}
            value={departuresToday.length}
            icon={<PathIcon d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15M9 12l3 3m0 0l3-3m-3 3V2.25" />}
            tone={departuresToday.length > 0 ? "blue" : "muted"}
            href={`/pms/${propertyId}/reservations?filter=today-departures`}
          />
          <OpTile
            label={t("opsInHouse")}
            value={inHouse}
            icon={<PathIcon d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />}
            tone="navy"
            href={`/pms/${propertyId}/reservations?status=checked_in`}
          />
          <OpTile
            label={t("opsDirty")}
            value={dirtyRooms}
            icon={<PathIcon d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />}
            tone={dirtyRooms > 0 ? "amber" : "muted"}
            href={`/pms/${propertyId}/chambres`}
          />
        </div>
      </section>

      {/* Revenue KPIs avec tendances */}
      <section className="mt-6">
        <h2 className="text-sm font-semibold text-navy mb-3">{t("revenue30d")}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <RevCard
            label={t("kpiAdr")}
            value={formatEUR(kpis.adr)}
            trend={kpisPrev.adr > 0 ? ((kpis.adr - kpisPrev.adr) / kpisPrev.adr) * 100 : null}
            trendLabel={t("vsPrev30d")}
          />
          <RevCard
            label={t("kpiRevpar")}
            value={formatEUR(kpis.revpar)}
            trend={kpisPrev.revpar > 0 ? ((kpis.revpar - kpisPrev.revpar) / kpisPrev.revpar) * 100 : null}
            trendLabel={t("vsPrev30d")}
            highlight
          />
          <RevCard
            label={t("kpiOccupancy")}
            value={`${kpis.occupancyPct.toFixed(1)} %`}
            trend={kpisPrev.occupancyPct > 0 ? kpis.occupancyPct - kpisPrev.occupancyPct : null}
            trendLabel={t("vsPrev30d")}
            trendIsPp
          />
        </div>
      </section>

      {/* Arrivées aujourd'hui + Dispo 14j */}
      <section className="mt-6 grid gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2 rounded-2xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">{t("arrivalsTodayTitle")}</h2>
            <Link href={`/pms/${propertyId}/reservations`} className="text-[11px] text-navy hover:underline">{t("recentResAll")}</Link>
          </div>
          {arrivalsToday.length === 0 ? (
            <div className="py-6 text-center text-xs text-muted italic">{t("arrivalsListEmpty")}</div>
          ) : (
            <ul className="space-y-2">
              {arrivalsToday.slice(0, 6).map((r) => (
                <li key={r.id}>
                  <Link
                    href={`/pms/${propertyId}/reservations/${r.id}`}
                    className="flex items-center gap-3 rounded-lg border border-card-border/50 bg-background/60 p-2.5 hover:border-navy hover:bg-background transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-navy truncate">{r.booker_name ?? "—"}</div>
                      <div className="text-[10px] text-muted font-mono">
                        {r.reservation_number} · {r.nb_nights}n · {r.nb_adults}{t("unitsAdults")}
                        {r.nb_children > 0 && ` / ${r.nb_children}${t("unitsChildren")}`}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-mono text-navy">{formatEUR(Number(r.total_amount || 0))}</div>
                      <span className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] ${statusClass(r.status)}`}>{ts(r.status)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Disponibilité 14j heatmap */}
        <div className="lg:col-span-3 rounded-2xl border border-card-border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-navy">{t("availNext14")}</h2>
            <Link href={`/pms/${propertyId}/calendrier`} className="text-[11px] text-navy hover:underline">{t("availFullCalendar")}</Link>
          </div>
          {availability.length === 0 ? (
            <p className="py-6 text-center text-xs text-muted italic">{t("availNoTypes")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-[10px]">
                <thead>
                  <tr>
                    <th className="py-1 pr-2 text-left font-medium text-muted">{t("availDayColumn")}</th>
                    {roomTypes.map((rt) => (
                      <th key={rt.id} className="py-1 px-1 text-center font-mono text-muted">{rt.code}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from(new Set(availability.map((a) => a.day))).sort().slice(0, 14).map((day) => {
                    const d = new Date(day);
                    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                    return (
                      <tr key={day}>
                        <td className={`py-1 pr-2 font-mono ${isWeekend ? "text-navy font-semibold" : "text-muted"}`}>
                          {d.toLocaleDateString(undefined, { weekday: "short", day: "2-digit" })}
                        </td>
                        {roomTypes.map((rt) => {
                          const cell = availability.find((a) => a.day === day && a.room_type_id === rt.id);
                          const avail = cell?.available_rooms ?? 0;
                          const total = cell?.total_rooms ?? 0;
                          const pct = total > 0 ? (avail / total) * 100 : 0;
                          const cls = pct === 0
                            ? "bg-rose-500/90 text-white"
                            : pct <= 20
                            ? "bg-rose-300 text-rose-900"
                            : pct <= 50
                            ? "bg-amber-300 text-amber-900"
                            : "bg-emerald-300 text-emerald-900";
                          return (
                            <td key={rt.id} className="py-0.5 px-0.5">
                              <div className={`${cls} rounded text-center font-mono py-1 font-semibold`}>
                                {avail}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Pending quotes */}
      {pendingQuotes > 0 && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <span>{t("pendingQuotes", { count: pendingQuotes })}</span>
          <Link href={`/pms/${propertyId}/reservations?filter=quote`} className="ml-auto underline font-semibold">{t("recentResAll")} →</Link>
        </div>
      )}
    </div>
  );
}

function PathIcon({ d }: { d: string }) {
  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.75} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

function TrendBadge({ delta, suffix = " %", labelKey }: { delta: number; suffix?: string; labelKey?: string }) {
  const isUp = delta > 0.5;
  const isDown = delta < -0.5;
  const cls = isUp
    ? "bg-emerald-400/20 text-emerald-200 border-emerald-400/40"
    : isDown
    ? "bg-rose-400/20 text-rose-200 border-rose-400/40"
    : "bg-white/10 text-white/70 border-white/20";
  const arrow = isUp ? "▲" : isDown ? "▼" : "→";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      <span>{arrow}</span>
      <span className="font-mono">{Math.abs(delta).toFixed(1)}{suffix}</span>
      {labelKey && <span className="opacity-60">{labelKey}</span>}
    </span>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-0.5">
        <span className="text-slate">{label}</span>
        <span className="font-mono font-semibold text-navy">{value}</span>
      </div>
      <div className="h-1.5 rounded-full bg-card-border/40 overflow-hidden">
        <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function OpTile({
  label, value, icon, tone, href,
}: { label: string; value: number; icon: React.ReactNode; tone: "emerald" | "blue" | "amber" | "navy" | "muted"; href: string }) {
  const toneCls = {
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-900 hover:bg-emerald-100",
    blue: "bg-blue-50 border-blue-200 text-blue-900 hover:bg-blue-100",
    amber: "bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100",
    navy: "bg-navy/5 border-navy/20 text-navy hover:bg-navy/10",
    muted: "bg-card border-card-border text-slate hover:bg-card/80",
  }[tone];
  return (
    <Link
      href={href}
      className={`group rounded-xl border p-4 transition-all hover:-translate-y-0.5 hover:shadow-sm ${toneCls}`}
    >
      <div className="flex items-center justify-between">
        <div className="opacity-80">{icon}</div>
        <span className="text-[10px] opacity-50 group-hover:opacity-100 transition-opacity">→</span>
      </div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-0.5 text-[11px] opacity-70 font-medium">{label}</div>
    </Link>
  );
}

function RevCard({
  label, value, trend, trendLabel, highlight, trendIsPp,
}: { label: string; value: string; trend: number | null; trendLabel: string; highlight?: boolean; trendIsPp?: boolean }) {
  const cls = highlight
    ? "bg-gradient-to-br from-navy to-navy-light text-white border-transparent"
    : "bg-card border-card-border text-navy";
  const trendCls = trend == null
    ? "text-muted"
    : trend > 0
    ? highlight ? "text-emerald-200" : "text-emerald-700"
    : trend < 0
    ? highlight ? "text-rose-200" : "text-rose-700"
    : highlight ? "text-white/60" : "text-muted";
  const arrow = trend == null ? "—" : trend > 0.5 ? "▲" : trend < -0.5 ? "▼" : "→";
  return (
    <div className={`rounded-xl border p-5 ${cls}`}>
      <div className={`text-[11px] uppercase tracking-wider font-medium ${highlight ? "text-white/60" : "text-muted"}`}>{label}</div>
      <div className="mt-2 text-3xl font-bold tabular-nums">{value}</div>
      {trend != null && (
        <div className={`mt-2 flex items-center gap-1.5 text-[11px] ${trendCls}`}>
          <span className="font-mono">{arrow} {Math.abs(trend).toFixed(1)}{trendIsPp ? " pp" : " %"}</span>
          <span className={highlight ? "text-white/50" : "text-muted"}>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

function statusClass(s: PmsReservation["status"]): string {
  switch (s) {
    case "confirmed": return "bg-blue-100 text-blue-900";
    case "checked_in": return "bg-emerald-100 text-emerald-900";
    case "checked_out": return "bg-slate-100 text-slate-800";
    case "cancelled": return "bg-rose-100 text-rose-900";
    case "no_show": return "bg-amber-100 text-amber-900";
    case "quote": return "bg-navy/10 text-navy";
  }
}
