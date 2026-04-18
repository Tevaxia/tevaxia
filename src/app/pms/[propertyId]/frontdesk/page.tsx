"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import { listRooms } from "@/lib/pms/rooms";
import type { PmsProperty, PmsReservation, PmsRoom } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

export default function FrontdeskPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [p, r, rr] = await Promise.all([
        getProperty(propertyId),
        listReservations(propertyId, {
          fromDate: today,
          toDate: tomorrow,
          status: ["confirmed", "checked_in", "checked_out"],
        }),
        listRooms(propertyId),
      ]);
      setProperty(p); setReservations(r); setRooms(rr);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId, today, tomorrow]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  const lcSearch = search.toLowerCase();
  const matchSearch = (r: PmsReservation) =>
    !search ||
    r.reservation_number.toLowerCase().includes(lcSearch) ||
    (r.booker_name?.toLowerCase().includes(lcSearch) ?? false) ||
    (r.booker_email?.toLowerCase().includes(lcSearch) ?? false);

  const arrivals = reservations.filter((r) => r.check_in === today && matchSearch(r));
  const departures = reservations.filter((r) => r.check_out === today && matchSearch(r));
  const inHouse = reservations.filter((r) => r.status === "checked_in" && matchSearch(r));

  const roomByRes: Record<string, string> = {};

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <span className="text-navy">Front desk</span>
      </div>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy">Front desk — {new Date().toLocaleDateString("fr-LU", { weekday: "long", day: "numeric", month: "long" })}</h1>
          <p className="mt-1 text-sm text-muted">
            Vue opérationnelle réception : arrivées, départs, clients in-house du jour.
            Design print-friendly pour impression avant shift.
          </p>
        </div>
        <div className="flex gap-2">
          <input type="text" value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher (nom, email, réf)…"
            className="rounded-lg border border-card-border bg-white px-3 py-2 text-sm w-64" />
          <button onClick={() => window.print()}
            className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5">
            🖨 Imprimer
          </button>
        </div>
      </div>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}

      {/* KPIs */}
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <Kpi label="Arrivées aujourd'hui" value={arrivals.length} tone="blue" />
        <Kpi label="Départs aujourd'hui" value={departures.length} tone="amber" />
        <Kpi label="Clients in-house" value={inHouse.length} tone="emerald" />
        <Kpi label="Chambres actives" value={rooms.filter((r) => r.active).length} />
      </div>

      {/* Arrivées */}
      <Section title="Arrivées" color="blue" count={arrivals.length}>
        {arrivals.length === 0 ? (
          <EmptyRow label="Aucune arrivée prévue aujourd'hui" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-right">Adultes / Enfants</th>
                <th className="px-3 py-2 text-left">Départ prévu</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map((r) => (
                <tr key={r.id} className={`border-b border-card-border/40 ${r.status === "checked_in" ? "bg-emerald-50/30" : ""}`}>
                  <td className="px-3 py-1.5 font-mono text-xs">{r.reservation_number}</td>
                  <td className="px-3 py-1.5">
                    <div className="font-medium text-navy">{r.booker_name ?? "—"}</div>
                    <div className="text-[10px] text-muted">{r.booker_email ?? ""}</div>
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">
                    {r.nb_adults} / {r.nb_children}
                  </td>
                  <td className="px-3 py-1.5 text-xs">{new Date(r.check_out).toLocaleDateString("fr-LU")}</td>
                  <td className="px-3 py-1.5 text-right font-mono text-xs">{formatEUR(Number(r.total_amount))}</td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      r.status === "checked_in" ? "bg-emerald-100 text-emerald-900" : "bg-blue-100 text-blue-900"
                    }`}>
                      {r.status === "checked_in" ? "✓ Arrivé" : "À accueillir"}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right">
                    <Link href={`/pms/${propertyId}/reservations/${r.id}`}
                      className="text-xs text-navy hover:underline">Ouvrir →</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* Départs */}
      <Section title="Départs" color="amber" count={departures.length}>
        {departures.length === 0 ? (
          <EmptyRow label="Aucun départ prévu aujourd'hui" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                <th className="px-3 py-2 text-left">Réf</th>
                <th className="px-3 py-2 text-left">Client</th>
                <th className="px-3 py-2 text-left">Arrivée</th>
                <th className="px-3 py-2 text-right">Nuits</th>
                <th className="px-3 py-2 text-right">Total</th>
                <th className="px-3 py-2 text-right">Payé</th>
                <th className="px-3 py-2 text-center">Statut</th>
                <th className="px-3 py-2 text-right"></th>
              </tr>
            </thead>
            <tbody>
              {departures.map((r) => {
                const balance = Number(r.total_amount) - Number(r.amount_paid);
                return (
                  <tr key={r.id} className="border-b border-card-border/40">
                    <td className="px-3 py-1.5 font-mono text-xs">{r.reservation_number}</td>
                    <td className="px-3 py-1.5">
                      <div className="font-medium text-navy">{r.booker_name ?? "—"}</div>
                    </td>
                    <td className="px-3 py-1.5 text-xs">{new Date(r.check_in).toLocaleDateString("fr-LU")}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">{r.nb_nights}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-xs">{formatEUR(Number(r.total_amount))}</td>
                    <td className={`px-3 py-1.5 text-right font-mono text-xs ${balance > 0 ? "text-rose-700 font-semibold" : "text-emerald-700"}`}>
                      {formatEUR(Number(r.amount_paid))}
                      {balance > 0 && <div className="text-[9px]">Solde {formatEUR(balance)}</div>}
                    </td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        r.status === "checked_out" ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-900"
                      }`}>
                        {r.status === "checked_out" ? "✓ Parti" : "À checker"}
                      </span>
                    </td>
                    <td className="px-3 py-1.5 text-right">
                      <Link href={`/pms/${propertyId}/reservations/${r.id}/folio`}
                        className="text-xs text-navy hover:underline">Folio →</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* In-house */}
      <Section title="Clients in-house" color="emerald" count={inHouse.length}>
        {inHouse.length === 0 ? (
          <EmptyRow label="Aucun client in-house" />
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {inHouse.map((r) => (
              <Link key={r.id} href={`/pms/${propertyId}/reservations/${r.id}`}
                className="rounded-lg border border-card-border bg-card p-3 hover:border-navy transition-colors">
                <div className="text-xs font-mono text-muted">{r.reservation_number}</div>
                <div className="mt-0.5 font-semibold text-navy text-sm">{r.booker_name ?? "—"}</div>
                <div className="mt-1 text-[10px] text-muted">
                  {r.nb_adults} adulte(s) · {r.nb_nights} nuit(s)
                </div>
                <div className="mt-1 text-[10px] text-muted">
                  Départ : {new Date(r.check_out).toLocaleDateString("fr-LU")}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900 print:hidden">
        <strong>Usage front-desk :</strong> imprimer cette page à 6h30 (avant ouverture) +
        15h30 (shift après-midi). Les arrivées sans check-in à 20h deviennent no-show
        candidates. Les départs avec solde &gt; 0 nécessitent règlement avant check-out.
      </div>
    </div>
  );
}

function Section({ title, color, count, children }: {
  title: string; color: "blue" | "amber" | "emerald"; count: number; children: React.ReactNode;
}) {
  const headerBg = color === "blue" ? "bg-blue-600" : color === "amber" ? "bg-amber-600" : "bg-emerald-600";
  return (
    <section className="mt-6 rounded-xl border border-card-border bg-card overflow-hidden">
      <div className={`${headerBg} text-white px-4 py-2 flex items-center justify-between`}>
        <h2 className="text-sm font-bold uppercase tracking-wider">{title}</h2>
        <span className="rounded-full bg-white/20 px-2 py-0.5 text-xs font-bold">{count}</span>
      </div>
      <div className="overflow-x-auto p-4">{children}</div>
    </section>
  );
}

function EmptyRow({ label }: { label: string }) {
  return <div className="py-6 text-center text-sm text-muted italic">{label}</div>;
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: "blue" | "amber" | "emerald" }) {
  const bg = tone === "blue" ? "bg-blue-50 border-blue-200" :
    tone === "amber" ? "bg-amber-50 border-amber-200" :
    tone === "emerald" ? "bg-emerald-50 border-emerald-200" : "bg-card border-card-border";
  const txt = tone === "blue" ? "text-blue-900" :
    tone === "amber" ? "text-amber-900" :
    tone === "emerald" ? "text-emerald-900" : "text-navy";
  return (
    <div className={`rounded-xl border ${bg} p-3`}>
      <div className="text-[10px] uppercase tracking-wider text-muted font-semibold">{label}</div>
      <div className={`mt-1 text-3xl font-bold ${txt}`}>{value}</div>
    </div>
  );
}
