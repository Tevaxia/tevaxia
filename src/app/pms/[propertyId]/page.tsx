"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRooms, listRoomTypes } from "@/lib/pms/rooms";
import { listRatePlans } from "@/lib/pms/rates";
import { listReservations, fetchAvailability } from "@/lib/pms/reservations";
import { aggregateKpis, pickupLast30Days } from "@/lib/pms/kpi";
import type { PmsAvailabilityRow, PmsProperty, PmsRatePlan, PmsReservation, PmsRoom, PmsRoomType, PmsNightAudit } from "@/lib/pms/types";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { formatEUR } from "@/lib/calculations";

function todayISO(): string { return new Date().toISOString().slice(0, 10); }
function plusDaysISO(days: number): string {
  const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10);
}

export default function PropertyOverviewPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [availability, setAvailability] = useState<PmsAvailabilityRow[]>([]);
  const [audits, setAudits] = useState<PmsNightAudit[]>([]);
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

      // Charge 30 derniers night audits pour KPIs
      if (isSupabaseConfigured && supabase) {
        const { data } = await supabase
          .from("pms_night_audits")
          .select("*")
          .eq("property_id", propertyId)
          .gte("audit_date", plusDaysISO(-30))
          .order("audit_date");
        setAudits((data ?? []) as PmsNightAudit[]);
      }
      setLoading(false);
    })();
  }, [propertyId, user, authLoading]);

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;
  if (!property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted">Propriété introuvable.</div>;

  const totalRooms = rooms.length;
  const roomsByStatus = rooms.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});
  const today = todayISO();
  const arrivalsToday = reservations.filter((r) => r.check_in === today && r.status === "confirmed").length;
  const departuresToday = reservations.filter((r) => r.check_out === today && r.status === "checked_in").length;
  const inHouse = reservations.filter((r) => r.status === "checked_in").length;
  const pendingQuotes = reservations.filter((r) => r.status === "quote").length;
  const kpis = aggregateKpis(audits);
  const pickup = pickupLast30Days(reservations);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <Link href="/pms" className="text-xs text-navy hover:underline">← Toutes mes propriétés</Link>
          <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">{property.name}</h1>
          <p className="mt-1 text-xs text-muted">
            {property.commune ?? "—"} · TVA {property.tva_rate}% · Taxe séjour {property.taxe_sejour_eur ?? 0} €
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/pms/${propertyId}/reservations/nouveau`} className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-navy-light">
            + Réservation
          </Link>
        </div>
      </div>

      {/* Banner config incomplète */}
      {(roomTypes.length === 0 || rooms.length === 0 || ratePlans.length === 0) && (
        <div className="mt-5 rounded-xl border border-gold bg-gradient-to-r from-gold/15 via-amber-50 to-gold/15 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-navy">⚙️ Configuration initiale à finaliser</h2>
              <p className="mt-1 text-xs text-muted max-w-2xl">
                Pour accepter des réservations, il faut au moins un type de chambre, une chambre physique et un rate plan.
                L&apos;assistant vous guide en 2 minutes avec des valeurs types pré-remplies.
              </p>
              <ul className="mt-2 flex flex-wrap gap-3 text-[11px]">
                <li className={roomTypes.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {roomTypes.length > 0 ? "✅" : "◯"} Types de chambres ({roomTypes.length})
                </li>
                <li className={rooms.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {rooms.length > 0 ? "✅" : "◯"} Chambres physiques ({rooms.length})
                </li>
                <li className={ratePlans.length > 0 ? "text-emerald-700" : "text-muted"}>
                  {ratePlans.length > 0 ? "✅" : "◯"} Rate plans ({ratePlans.length})
                </li>
              </ul>
            </div>
            <Link
              href={`/pms/${propertyId}/setup`}
              className="rounded-md bg-navy px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-navy-light whitespace-nowrap"
            >
              Lancer l&apos;assistant →
            </Link>
          </div>
        </div>
      )}

      {/* Navigation sous-module */}
      <nav className="mt-6 flex flex-wrap gap-2 border-b border-card-border pb-3">
        {[
          { href: `/pms/${propertyId}`, label: "Tableau de bord", active: true },
          { href: `/pms/${propertyId}/chambres`, label: "Chambres & tarifs" },
          { href: `/pms/${propertyId}/calendrier`, label: "Calendrier" },
          { href: `/pms/${propertyId}/reservations`, label: "Réservations" },
          { href: `/pms/${propertyId}/guests`, label: "Invités (CRM)" },
          { href: `/pms/${propertyId}/factures`, label: "Factures" },
          { href: `/pms/${propertyId}/rapports`, label: "Rapports" },
        ].map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`rounded-md px-3 py-1.5 text-xs font-medium ${
              l.active
                ? "bg-navy text-white"
                : "border border-card-border text-slate hover:border-navy hover:text-navy"
            }`}
          >
            {l.label}
          </Link>
        ))}
      </nav>

      {/* KPIs opérationnels */}
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <KpiCard label="Chambres" value={totalRooms.toString()} sub={`${Object.keys(roomsByStatus).length} statuts`} />
        <KpiCard label="In-house" value={inHouse.toString()} sub="clients présents" />
        <KpiCard label="Arrivées aujourd'hui" value={arrivalsToday.toString()} />
        <KpiCard label="Départs aujourd'hui" value={departuresToday.toString()} />
      </div>

      {/* KPIs revenus 30 derniers jours */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <KpiCard
          label="Occupation 30j"
          value={kpis.occupancyPct.toFixed(1) + " %"}
          tone="emerald"
        />
        <KpiCard label="ADR 30j" value={formatEUR(kpis.adr)} tone="navy" />
        <KpiCard label="RevPAR 30j" value={formatEUR(kpis.revpar)} tone="navy" />
        <KpiCard
          label="Pickup 30j"
          value={pickup.reservationsLast30.toString()}
          sub={`${pickup.roomNightsLast30} nuits · ${formatEUR(pickup.avgRevenuePerReservation)} / rés.`}
        />
      </div>

      {/* Statuts chambres */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Statut des chambres</h2>
        {totalRooms === 0 ? (
          <p className="text-xs text-muted italic">
            Aucune chambre configurée.{" "}
            <Link href={`/pms/${propertyId}/chambres`} className="text-navy underline">Ajouter des types &amp; chambres</Link>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7 text-xs">
            {Object.entries(roomsByStatus).map(([status, count]) => (
              <div key={status} className="rounded-md border border-card-border bg-background p-2 text-center">
                <div className="font-mono font-semibold text-navy">{count}</div>
                <div className="mt-0.5 text-[10px] text-muted">{status}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Dispo 14 jours */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy">Disponibilité (14 prochains jours)</h2>
          <Link href={`/pms/${propertyId}/calendrier`} className="text-xs text-navy hover:underline">Calendrier complet →</Link>
        </div>
        {availability.length === 0 ? (
          <p className="text-xs text-muted italic">Pas encore de types de chambres configurés.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead>
                <tr className="border-b border-card-border">
                  <th className="py-1 pr-2 text-left font-medium text-muted">Jour</th>
                  {roomTypes.map((rt) => (
                    <th key={rt.id} className="py-1 px-2 text-center font-medium text-muted">{rt.code}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from(new Set(availability.map((a) => a.day))).sort().slice(0, 14).map((day) => (
                  <tr key={day} className="border-b border-card-border/40">
                    <td className="py-1 pr-2 font-mono text-muted">
                      {new Date(day).toLocaleDateString("fr-LU", { weekday: "short", day: "2-digit", month: "short" })}
                    </td>
                    {roomTypes.map((rt) => {
                      const cell = availability.find((a) => a.day === day && a.room_type_id === rt.id);
                      const avail = cell?.available_rooms ?? 0;
                      const total = cell?.total_rooms ?? 0;
                      const pct = total > 0 ? (avail / total) * 100 : 0;
                      const bg = pct > 50 ? "bg-emerald-50" : pct > 20 ? "bg-amber-50" : "bg-rose-50";
                      return (
                        <td key={rt.id} className={`py-1 px-2 text-center font-mono ${bg}`}>
                          {avail}/{total}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Réservations récentes */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy">Réservations (60 prochains jours)</h2>
          <Link href={`/pms/${propertyId}/reservations`} className="text-xs text-navy hover:underline">Toutes →</Link>
        </div>
        {reservations.length === 0 ? (
          <p className="text-xs text-muted italic">Aucune réservation pour le moment.</p>
        ) : (
          <ul className="divide-y divide-card-border/40 text-xs">
            {reservations.slice(0, 10).map((r) => (
              <li key={r.id} className="flex items-center justify-between py-2">
                <div className="min-w-0 flex-1">
                  <Link href={`/pms/${propertyId}/reservations/${r.id}`} className="font-mono text-navy hover:underline">
                    {r.reservation_number}
                  </Link>
                  <span className="ml-2 text-muted">
                    {r.check_in} → {r.check_out} · {r.nb_adults}ad / {r.nb_children}enf
                  </span>
                </div>
                <div className="font-mono text-navy">{formatEUR(Number(r.total_amount || 0))}</div>
                <span className={`ml-3 rounded-full px-2 py-0.5 text-[10px] ${statusClass(r.status)}`}>{r.status}</span>
              </li>
            ))}
          </ul>
        )}
        {pendingQuotes > 0 && (
          <div className="mt-3 text-xs text-amber-900">
            ⚠ {pendingQuotes} devis en attente de confirmation.
          </div>
        )}
      </section>
    </div>
  );
}

function KpiCard({ label, value, sub, tone = "default" }: { label: string; value: string; sub?: string; tone?: "default" | "navy" | "emerald" }) {
  const cls =
    tone === "emerald"
      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
      : tone === "navy"
      ? "bg-navy text-white border-transparent"
      : "bg-card border-card-border text-navy";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <div className="text-[11px] opacity-80">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
      {sub && <div className="mt-0.5 text-[10px] opacity-70">{sub}</div>}
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
