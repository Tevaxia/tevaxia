"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listRoomTypes } from "@/lib/pms/rooms";
import { listRatePlans, listSeasonalRates, createSeasonalRate, deleteSeasonalRate } from "@/lib/pms/rates";
import type { PmsProperty, PmsRoomType, PmsRatePlan, PmsSeasonalRate } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";

export default function SeasonalRatesPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<PmsRatePlan[]>([]);
  const [seasonalRates, setSeasonalRates] = useState<PmsSeasonalRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [p, types, plans, rates] = await Promise.all([
      getProperty(propertyId),
      listRoomTypes(propertyId),
      listRatePlans(propertyId),
      listSeasonalRates(propertyId),
    ]);
    setProperty(p);
    setRoomTypes(types);
    setRatePlans(plans);
    setSeasonalRates(rates);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  const [form, setForm] = useState({
    rate_plan_id: "",
    room_type_id: "",
    start_date: "",
    end_date: "",
    price: 0,
    min_los: 1,
    closed_to_arrival: false,
    closed_to_departure: false,
    stop_sell: false,
  });

  const addRate = async () => {
    if (!form.rate_plan_id || !form.room_type_id || !form.start_date || !form.end_date || form.price <= 0) {
      setError("Tous les champs requis."); return;
    }
    try {
      await createSeasonalRate({ property_id: propertyId, ...form });
      setForm({ ...form, start_date: "", end_date: "", price: 0 });
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Tarifs saisonniers</h1>
      <p className="mt-1 text-sm text-muted">
        Ajoutez des tarifs par période (haute saison, week-ends, événements…) par rate plan × type de chambre.
        Sans tarif saisonnier, le tarif de base (×  discount du rate plan) s&apos;applique.
      </p>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {roomTypes.length === 0 || ratePlans.length === 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
          Vous devez d&apos;abord configurer au moins un type de chambre et un rate plan dans{" "}
          <Link href={`/pms/${propertyId}/chambres`} className="underline">Chambres &amp; tarifs</Link>.
        </div>
      ) : (
        <>
          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Ajouter un tarif saisonnier</h2>
            <div className="grid gap-2 sm:grid-cols-8 text-xs">
              <select
                value={form.rate_plan_id}
                onChange={(e) => setForm({ ...form, rate_plan_id: e.target.value })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              >
                <option value="">Rate plan…</option>
                {ratePlans.map((rp) => <option key={rp.id} value={rp.id}>{rp.code}</option>)}
              </select>
              <select
                value={form.room_type_id}
                onChange={(e) => setForm({ ...form, room_type_id: e.target.value })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              >
                <option value="">Type…</option>
                {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.code}</option>)}
              </select>
              <input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              />
              <input
                type="date"
                value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              />
              <input
                type="number" placeholder="Prix €"
                value={form.price || ""}
                onChange={(e) => setForm({ ...form, price: Number(e.target.value) })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              />
              <input
                type="number" placeholder="Min LOS"
                value={form.min_los}
                onChange={(e) => setForm({ ...form, min_los: Number(e.target.value) })}
                className="rounded-md border border-card-border bg-background px-2 py-1.5"
              />
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={form.stop_sell} onChange={(e) => setForm({ ...form, stop_sell: e.target.checked })} />
                Stop sell
              </label>
              <button
                type="button"
                onClick={addRate}
                className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
              >
                + Ajouter
              </button>
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
            <h2 className="text-sm font-semibold text-navy mb-3">Tarifs enregistrés ({seasonalRates.length})</h2>
            {seasonalRates.length === 0 ? (
              <p className="text-xs text-muted italic">Aucun tarif saisonnier pour l&apos;instant.</p>
            ) : (
              <table className="min-w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border">
                    <th className="py-1 pr-2 text-left font-medium text-muted">Rate plan</th>
                    <th className="py-1 pr-2 text-left font-medium text-muted">Type chambre</th>
                    <th className="py-1 px-2 text-left font-medium text-muted">Début</th>
                    <th className="py-1 px-2 text-left font-medium text-muted">Fin</th>
                    <th className="py-1 px-2 text-right font-medium text-muted">Prix</th>
                    <th className="py-1 px-2 text-right font-medium text-muted">Min LOS</th>
                    <th className="py-1 px-2 text-center font-medium text-muted">Stop sell</th>
                    <th className="py-1 pl-2 text-right font-medium text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {seasonalRates.map((sr) => (
                    <tr key={sr.id} className="border-b border-card-border/40">
                      <td className="py-1 pr-2 font-mono">{ratePlans.find((r) => r.id === sr.rate_plan_id)?.code ?? "?"}</td>
                      <td className="py-1 pr-2 font-mono">{roomTypes.find((r) => r.id === sr.room_type_id)?.code ?? "?"}</td>
                      <td className="py-1 px-2 font-mono">{sr.start_date}</td>
                      <td className="py-1 px-2 font-mono">{sr.end_date}</td>
                      <td className="py-1 px-2 text-right font-mono">{formatEUR(Number(sr.price))}</td>
                      <td className="py-1 px-2 text-right font-mono">{sr.min_los}</td>
                      <td className="py-1 px-2 text-center">{sr.stop_sell ? "✓" : "—"}</td>
                      <td className="py-1 pl-2 text-right">
                        <button
                          type="button"
                          onClick={async () => {
                            if (confirm("Supprimer ce tarif ?")) {
                              await deleteSeasonalRate(sr.id);
                              await reload();
                            }
                          }}
                          className="text-rose-700 hover:underline"
                        >
                          Supprimer
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
