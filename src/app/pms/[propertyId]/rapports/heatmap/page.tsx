"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProperty } from "@/lib/pms/properties";
import type { PmsProperty, PmsNightAudit } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

interface DayCell {
  date: string;
  occupancy: number;
  revenue: number;
  available: boolean; // audit existant pour ce jour
}

export default function HeatmapPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const t = useTranslations("pmsHeatmap");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [cells, setCells] = useState<Map<string, DayCell>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const p = await getProperty(propertyId);
      setProperty(p);

      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("pms_night_audits")
          .select("audit_date, occupancy_pct, total_revenue")
          .eq("property_id", propertyId)
          .gte("audit_date", `${year}-01-01`)
          .lte("audit_date", `${year}-12-31`);
        const map = new Map<string, DayCell>();
        for (const a of ((data ?? []) as Pick<PmsNightAudit, "audit_date" | "occupancy_pct" | "total_revenue">[])) {
          map.set(a.audit_date, {
            date: a.audit_date,
            occupancy: Number(a.occupancy_pct),
            revenue: Number(a.total_revenue),
            available: true,
          });
        }
        setCells(map);
      }
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId, year]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{t("loginPrompt")}</Link></div>;

  const MONTHS = t("monthsShort").split(",");
  const WEEKDAYS = t("weekdaysShort").split(",");

  const daysInMonth = (m: number) => new Date(year, m + 1, 0).getDate();

  const occupancyColor = (occ: number): string => {
    if (occ === 0) return "bg-slate-100";
    if (occ < 30) return "bg-rose-200";
    if (occ < 50) return "bg-amber-200";
    if (occ < 70) return "bg-lime-200";
    if (occ < 85) return "bg-emerald-300";
    return "bg-emerald-500";
  };

  // Stats annuelles
  const allCells = Array.from(cells.values());
  const totalOcc = allCells.reduce((s, c) => s + c.occupancy, 0);
  const avgOcc = allCells.length > 0 ? totalOcc / allCells.length : 0;
  const totalRev = allCells.reduce((s, c) => s + c.revenue, 0);
  const bestDay = allCells.sort((a, b) => b.occupancy - a.occupancy)[0];
  const worstDay = allCells.filter((c) => c.occupancy > 0).sort((a, b) => a.occupancy - b.occupancy)[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/rapports`} className="hover:text-navy">{t("crumbReports")}</Link>
        <span>/</span>
        <span className="text-navy">{t("crumbCurrent")}</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t("pageTitle")}</h1>
          <p className="mt-1 text-sm text-muted">{t("pageDesc")}</p>
        </div>
        <select value={year} onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm">
          {[year - 2, year - 1, year, year + 1].filter((y, i, a) => a.indexOf(y) === i).map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* Stats annuelles */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Stat label={t("statAvgOcc")} value={`${avgOcc.toFixed(1)}%`} />
        <Stat label={t("statRecordedDays")} value={t("statRecordedDaysValue", { n: allCells.length })} />
        <Stat label={t("statRevenue")} value={formatEUR(totalRev)} tone="emerald" />
        <Stat label={t("statBestDay")}
          value={bestDay ? `${bestDay.occupancy.toFixed(0)}%` : t("dash")}
          sub={bestDay ? new Date(bestDay.date).toLocaleDateString(dateLocale) : ""} />
      </div>

      {/* Heatmap grid */}
      <div className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {MONTHS.map((month, mIdx) => {
            const days = daysInMonth(mIdx);
            const firstDay = new Date(year, mIdx, 1).getDay() || 7; // 1 = Monday
            const offset = firstDay - 1; // décalage pour lundi = col 0
            return (
              <div key={`${month}-${mIdx}`} className="rounded-lg border border-card-border/40 bg-background/40 p-2">
                <div className="mb-1 text-center text-xs font-semibold text-navy">{month} {year}</div>
                <div className="grid grid-cols-7 gap-0.5 text-[10px] text-muted text-center mb-0.5">
                  {WEEKDAYS.map((d, i) => (
                    <div key={i}>{d}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                  {Array.from({ length: offset }).map((_, i) => (
                    <div key={`empty-${i}`} />
                  ))}
                  {Array.from({ length: days }).map((_, i) => {
                    const day = i + 1;
                    const dateStr = `${year}-${String(mIdx + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                    const cell = cells.get(dateStr);
                    const occ = cell?.occupancy ?? 0;
                    return (
                      <div key={dateStr}
                        title={cell
                          ? t("cellTitleFilled", { date: dateStr, pct: occ.toFixed(0), revenue: formatEUR(cell.revenue) })
                          : t("cellTitleEmpty", { date: dateStr })
                        }
                        className={`aspect-square rounded-sm flex items-center justify-center text-[9px] font-semibold ${
                          cell ? occupancyColor(occ) : "bg-slate-50 text-slate-300"
                        } ${occ >= 70 ? "text-white" : "text-slate-700"}`}>
                        {day}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center justify-center gap-3 text-[10px] text-muted">
          <span>{t("legendOccupancy")}</span>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-slate-100" />
            <span>{t("legendZero")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-rose-200" />
            <span>{t("legendLow")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-amber-200" />
            <span>{t("legendMid")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-lime-200" />
            <span>{t("legendOk")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-300" />
            <span>{t("legendGood")}</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span>{t("legendHigh")}</span>
          </div>
        </div>
      </div>

      {allCells.length === 0 && (
        <div className="mt-6 rounded-xl border-2 border-dashed border-card-border py-12 text-center text-sm text-muted">
          {(() => {
            const raw = t("emptyYear", { year });
            const parts = raw.split(/<link>|<\/link>/);
            return (
              <>
                {parts[0]}
                <Link href={`/pms/${propertyId}/reservations`} className="text-navy underline">{parts[1]}</Link>
                {parts[2]}
              </>
            );
          })()}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <span dangerouslySetInnerHTML={{ __html: t("methodology") }} />
        {worstDay && (
          <div className="mt-2">
            {t("worstDayInfo", {
              date: new Date(worstDay.date).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }),
              pct: worstDay.occupancy.toFixed(0),
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "emerald" }) {
  const bg = tone === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-card border-card-border";
  const txt = tone === "emerald" ? "text-emerald-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-xl font-bold ${txt}`}>{value}</div>
      {sub && <div className="text-[10px] text-muted">{sub}</div>}
    </div>
  );
}
