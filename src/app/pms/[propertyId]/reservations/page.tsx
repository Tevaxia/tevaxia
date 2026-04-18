"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import type { PmsProperty, PmsReservation, PmsReservationStatus } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";

const STATUS_COLORS: Record<PmsReservationStatus, string> = {
  quote: "bg-navy/10 text-navy",
  confirmed: "bg-blue-100 text-blue-900",
  checked_in: "bg-emerald-100 text-emerald-900",
  checked_out: "bg-slate-100 text-slate-800",
  cancelled: "bg-rose-100 text-rose-900",
  no_show: "bg-amber-100 text-amber-900",
};

const STATUS_ORDER: PmsReservationStatus[] = ["quote","confirmed","checked_in","checked_out","cancelled","no_show"];

export default function ReservationsListPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const tc = useTranslations("pms.common");
  const ts = useTranslations("pms.reservationStatus");
  const t = useTranslations("pms.reservationList");
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [filter, setFilter] = useState<PmsReservationStatus | "all">("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      const [p, res] = await Promise.all([
        getProperty(propertyId),
        listReservations(propertyId),
      ]);
      setProperty(p);
      setReservations(res);
      setLoading(false);
    })();
  }, [propertyId, user, authLoading]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{tc("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">{tc("signInLink")}</Link></div>;

  const filtered = filter === "all" ? reservations : reservations.filter((r) => r.status === filter);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <div className="mt-1 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
        <Link
          href={`/pms/${propertyId}/reservations/nouveau`}
          className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-light"
        >
          {t("newReservation")}
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        {(["all", ...STATUS_ORDER] as ("all" | PmsReservationStatus)[]).map((s) => {
          const count = s === "all" ? reservations.length : reservations.filter((r) => r.status === s).length;
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1 font-medium ${
                filter === s
                  ? "bg-navy text-white"
                  : "border border-card-border text-slate hover:border-navy hover:text-navy"
              }`}
            >
              {s === "all" ? t("filterAll") : ts(s)} <span className="opacity-60">({count})</span>
            </button>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-card-border bg-card p-3">
        {filtered.length === 0 ? (
          <p className="p-4 text-xs text-muted italic">{t("empty")}</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colNumber")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colClient")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colCheckIn")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colCheckOut")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colNights")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colAmount")}</th>
                <th className="py-2 px-2 text-right font-medium text-muted">{t("colPaid")}</th>
                <th className="py-2 px-2 text-left font-medium text-muted">{t("colSource")}</th>
                <th className="py-2 px-2 text-center font-medium text-muted">{t("colStatus")}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const balance = Number(r.total_amount || 0) - Number(r.amount_paid || 0);
                return (
                  <tr key={r.id} className="border-b border-card-border/40 hover:bg-card/30">
                    <td className="py-2 px-2 font-mono">
                      <Link href={`/pms/${propertyId}/reservations/${r.id}`} className="text-navy hover:underline">
                        {r.reservation_number}
                      </Link>
                    </td>
                    <td className="py-2 px-2">{r.booker_name ?? "—"}</td>
                    <td className="py-2 px-2 font-mono">{r.check_in}</td>
                    <td className="py-2 px-2 font-mono">{r.check_out}</td>
                    <td className="py-2 px-2 text-right font-mono">{r.nb_nights}</td>
                    <td className="py-2 px-2 text-right font-mono">{formatEUR(Number(r.total_amount))}</td>
                    <td className={`py-2 px-2 text-right font-mono ${balance > 0 ? "text-rose-700" : "text-emerald-700"}`}>
                      {formatEUR(Number(r.amount_paid))}
                      {balance > 0 && <span className="block text-[9px] opacity-70">{t("balanceRemaining", { amount: formatEUR(balance) })}</span>}
                    </td>
                    <td className="py-2 px-2 text-[10px] text-muted">{r.source}</td>
                    <td className="py-2 px-2 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] ${STATUS_COLORS[r.status]}`}>{ts(r.status)}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
