"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRooms, listRoomTypes, statusLabel } from "@/lib/pms/rooms";
import { listReservations, listReservationLines } from "@/lib/pms/reservations";
import type {
  PmsProperty, PmsRoom, PmsRoomType, PmsReservation, PmsReservationRoom,
} from "@/lib/pms/types";

function isoDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}
function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
function buildDayRange(start: Date, count: number): Date[] {
  return Array.from({ length: count }, (_, i) => addDays(start, i));
}

export default function CalendarPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [lines, setLines] = useState<Record<string, PmsReservationRoom[]>>({});
  const [startDate, setStartDate] = useState<string>(isoDay(new Date()));
  const [daysCount, setDaysCount] = useState<number>(30);
  const [loading, setLoading] = useState(true);

  const start = useMemo(() => new Date(startDate), [startDate]);
  const days = useMemo(() => buildDayRange(start, daysCount), [start, daysCount]);
  const endDate = useMemo(() => isoDay(addDays(start, daysCount)), [start, daysCount]);

  useEffect(() => {
    if (authLoading || !user) return;
    (async () => {
      setLoading(true);
      const [p, types, rr, res] = await Promise.all([
        getProperty(propertyId),
        listRoomTypes(propertyId),
        listRooms(propertyId),
        listReservations(propertyId, { fromDate: startDate, toDate: endDate }),
      ]);
      setProperty(p);
      setRoomTypes(types);
      setRooms(rr);
      setReservations(res);

      const linesByRes: Record<string, PmsReservationRoom[]> = {};
      for (const r of res) {
        linesByRes[r.id] = await listReservationLines(r.id);
      }
      setLines(linesByRes);
      setLoading(false);
    })();
  }, [propertyId, user, authLoading, startDate, endDate]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  // Mapping room_id → cellule (réservation + line)
  const reservationForRoomDay = (roomId: string, dayISO: string): { res: PmsReservation; line: PmsReservationRoom } | null => {
    for (const r of reservations) {
      if (r.status === "cancelled" || r.status === "no_show") continue;
      if (dayISO < r.check_in || dayISO >= r.check_out) continue;
      const ls = lines[r.id] ?? [];
      const l = ls.find((l) => l.room_id === roomId);
      if (l) return { res: r, line: l };
    }
    return null;
  };

  const cellColor = (status: PmsReservation["status"]): string => {
    switch (status) {
      case "confirmed": return "bg-blue-300";
      case "checked_in": return "bg-emerald-400";
      case "checked_out": return "bg-slate-300";
      case "quote": return "bg-amber-200";
      default: return "bg-gray-200";
    }
  };

  return (
    <div className="mx-auto max-w-full px-4 py-10">
      <div className="max-w-7xl mx-auto">
        <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
        <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Calendrier</h1>
        <p className="mt-1 text-sm text-muted">Grille chambre × jour avec chevauchement réservations.</p>

        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-xs">
            <span className="text-muted">Début</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
            />
          </label>
          <label className="text-xs">
            <span className="text-muted">Nb jours</span>
            <select
              value={daysCount}
              onChange={(e) => setDaysCount(Number(e.target.value))}
              className="mt-1 block rounded-md border border-card-border bg-background px-2 py-1.5 text-sm"
            >
              <option value="7">7</option>
              <option value="14">14</option>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </label>
          <div className="flex items-center gap-3 ml-auto text-[11px] text-muted">
            <LegendDot color="bg-emerald-400" label="Check-in" />
            <LegendDot color="bg-blue-300" label="Confirmée" />
            <LegendDot color="bg-amber-200" label="Devis" />
            <LegendDot color="bg-slate-300" label="Terminée" />
          </div>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="mt-6 max-w-4xl mx-auto rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Ajoutez d&apos;abord des chambres dans{" "}
          <Link href={`/pms/${propertyId}/chambres`} className="underline">Chambres &amp; tarifs</Link>.
        </div>
      ) : (
        <div className="mt-6 overflow-x-auto">
          <table className="border-collapse text-[10px]" style={{ minWidth: "100%" }}>
            <thead>
              <tr className="sticky top-0 bg-card">
                <th className="border border-card-border px-1 py-1 text-left text-[10px] font-medium text-muted whitespace-nowrap" style={{ minWidth: 100 }}>
                  Chambre
                </th>
                {days.map((d) => (
                  <th
                    key={d.toISOString()}
                    className={`border border-card-border px-0.5 py-1 text-center font-normal ${
                      d.getDay() === 0 || d.getDay() === 6 ? "bg-card/60" : ""
                    }`}
                    style={{ minWidth: 32 }}
                  >
                    <div className="text-muted">{d.toLocaleDateString("fr-LU", { weekday: "narrow" })}</div>
                    <div className="font-mono text-navy">{d.getDate()}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((rt) => {
                const typeRooms = rooms.filter((r) => r.room_type_id === rt.id);
                if (typeRooms.length === 0) return null;
                return (
                  <>
                    <tr key={`group-${rt.id}`}>
                      <td colSpan={daysCount + 1} className="bg-navy/5 px-2 py-1 text-[11px] font-semibold text-navy">
                        {rt.code} — {rt.name}
                      </td>
                    </tr>
                    {typeRooms.map((r) => (
                      <tr key={r.id}>
                        <td className="border border-card-border px-1 py-1 font-mono whitespace-nowrap">
                          <span className="text-navy font-semibold">{r.number}</span>
                          <span className="ml-1 text-[9px] text-muted">{statusLabel(r.status)}</span>
                        </td>
                        {days.map((d) => {
                          const iso = isoDay(d);
                          const cell = reservationForRoomDay(r.id, iso);
                          if (!cell) {
                            const weekend = d.getDay() === 0 || d.getDay() === 6;
                            return <td key={iso} className={`border border-card-border px-0.5 py-1 ${weekend ? "bg-card/30" : ""}`} />;
                          }
                          const isArrival = iso === cell.res.check_in;
                          return (
                            <td
                              key={iso}
                              className={`border border-card-border px-0.5 py-1 ${cellColor(cell.res.status)} relative`}
                              title={`${cell.res.reservation_number} · ${cell.res.check_in} → ${cell.res.check_out}`}
                            >
                              <Link
                                href={`/pms/${propertyId}/reservations/${cell.res.id}`}
                                className="block text-[8px] font-mono text-navy whitespace-nowrap truncate"
                              >
                                {isArrival ? cell.res.reservation_number.replace("R-", "") : "·"}
                              </Link>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={`inline-block h-2 w-4 rounded ${color}`} />
      {label}
    </span>
  );
}
