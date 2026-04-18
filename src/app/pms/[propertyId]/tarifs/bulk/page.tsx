"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { getProperty } from "@/lib/pms/properties";
import { listRoomTypes } from "@/lib/pms/rooms";
import { listRatePlans, listSeasonalRates } from "@/lib/pms/rates";
import type { PmsProperty, PmsRoomType, PmsRatePlan, PmsSeasonalRate } from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

export default function BulkRateEditorPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [ratePlans, setRatePlans] = useState<PmsRatePlan[]>([]);
  const [rates, setRates] = useState<PmsSeasonalRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  const [filter, setFilter] = useState({
    rate_plan_id: "",
    room_type_id: "",
    start_date: new Date().toISOString().slice(0, 10),
    end_date: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
  });

  const [action, setAction] = useState<{
    type: "add_pct" | "add_fixed" | "set_value" | "close_range" | "reopen_range";
    value: string;
  }>({ type: "add_pct", value: "5" });

  const [applying, setApplying] = useState(false);

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const [p, rt, rp, sr] = await Promise.all([
        getProperty(propertyId),
        listRoomTypes(propertyId),
        listRatePlans(propertyId),
        listSeasonalRates(propertyId),
      ]);
      setProperty(p); setRoomTypes(rt); setRatePlans(rp); setRates(sr);
    } catch (e) { setError(errMsg(e)); }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const filtered = rates.filter((r) => {
    if (filter.rate_plan_id && r.rate_plan_id !== filter.rate_plan_id) return false;
    if (filter.room_type_id && r.room_type_id !== filter.room_type_id) return false;
    if (filter.end_date < r.start_date) return false;
    if (filter.start_date > r.end_date) return false;
    return true;
  });

  const applyBulk = async () => {
    if (!isSupabaseConfigured || !supabase || filtered.length === 0) return;
    const val = Number(action.value);
    if (action.type !== "close_range" && action.type !== "reopen_range" && !Number.isFinite(val)) {
      setError("Valeur invalide"); return;
    }
    if (!confirm(`Appliquer cette modification à ${filtered.length} tarif(s) ?`)) return;
    setApplying(true); setError(null);

    for (const r of filtered) {
      const patch: Partial<PmsSeasonalRate> = {};
      if (action.type === "add_pct") {
        patch.price = Math.round(Number(r.price) * (1 + val / 100) * 100) / 100;
      } else if (action.type === "add_fixed") {
        patch.price = Math.max(0, Number(r.price) + val);
      } else if (action.type === "set_value") {
        patch.price = Math.max(0, val);
      } else if (action.type === "close_range") {
        patch.stop_sell = true;
      } else if (action.type === "reopen_range") {
        patch.stop_sell = false;
      }
      await supabase.from("pms_seasonal_rates").update(patch).eq("id", r.id);
    }

    setFlash(`✓ ${filtered.length} tarif(s) mis à jour`);
    setTimeout(() => setFlash(null), 4000);
    await reload();
    setApplying(false);
  };

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center gap-2 text-xs text-muted">
        <Link href={`/pms/${propertyId}`} className="hover:text-navy">{property.name}</Link>
        <span>/</span>
        <Link href={`/pms/${propertyId}/tarifs`} className="hover:text-navy">Tarifs</Link>
        <span>/</span>
        <span className="text-navy">Édition bulk</span>
      </div>

      <h1 className="mt-3 text-2xl font-bold text-navy">Édition tarifs en masse</h1>
      <p className="mt-1 text-sm text-muted">
        Modifier plusieurs tarifs saisonniers simultanément : ajustement %, fixe,
        ou écrase valeur. Filtre préalable par rate plan, type de chambre et période.
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-900">{flash}</div>}

      {/* Étape 1 : filtre */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">1. Sélection</h2>
        <div className="grid gap-3 sm:grid-cols-4">
          <label className="text-xs">
            <div className="text-muted mb-1">Rate plan</div>
            <select value={filter.rate_plan_id}
              onChange={(e) => setFilter({ ...filter, rate_plan_id: e.target.value })}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
              <option value="">Tous</option>
              {ratePlans.map((rp) => <option key={rp.id} value={rp.id}>{rp.code}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <div className="text-muted mb-1">Room type</div>
            <select value={filter.room_type_id}
              onChange={(e) => setFilter({ ...filter, room_type_id: e.target.value })}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
              <option value="">Tous</option>
              {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.code}</option>)}
            </select>
          </label>
          <label className="text-xs">
            <div className="text-muted mb-1">Début</div>
            <input type="date" value={filter.start_date}
              onChange={(e) => setFilter({ ...filter, start_date: e.target.value })}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
          <label className="text-xs">
            <div className="text-muted mb-1">Fin</div>
            <input type="date" value={filter.end_date}
              onChange={(e) => setFilter({ ...filter, end_date: e.target.value })}
              className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          </label>
        </div>
        <div className="mt-3 text-xs text-muted">
          {filtered.length} tarif(s) correspondent au filtre · Total stockés : {rates.length}
        </div>
      </section>

      {/* Étape 2 : action */}
      <section className="mt-4 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">2. Action</h2>
        <div className="flex flex-wrap gap-3 items-end">
          <label className="text-xs">
            <div className="text-muted mb-1">Opération</div>
            <select value={action.type}
              onChange={(e) => setAction({ ...action, type: e.target.value as typeof action.type })}
              className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
              <option value="add_pct">Ajuster %</option>
              <option value="add_fixed">Ajuster montant fixe</option>
              <option value="set_value">Définir valeur</option>
              <option value="close_range">Fermer à la vente (stop sell)</option>
              <option value="reopen_range">Ré-ouvrir à la vente</option>
            </select>
          </label>
          {(action.type === "add_pct" || action.type === "add_fixed" || action.type === "set_value") && (
            <label className="text-xs">
              <div className="text-muted mb-1">
                Valeur {action.type === "add_pct" ? "(%)" : "(€)"}
              </div>
              <input type="number" value={action.value}
                onChange={(e) => setAction({ ...action, value: e.target.value })}
                step={action.type === "add_pct" ? 0.5 : 5}
                className="w-32 rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm font-mono text-right" />
            </label>
          )}
          <button onClick={applyBulk} disabled={applying || filtered.length === 0}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-50">
            {applying ? "Application…" : `Appliquer à ${filtered.length} tarif(s)`}
          </button>
        </div>
      </section>

      {/* Preview impact */}
      {filtered.length > 0 && (
        <section className="mt-4 rounded-xl border border-card-border bg-card p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy mb-3">
            Aperçu ({filtered.length} tarifs impactés)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border text-[10px] uppercase tracking-wider text-muted">
                  <th className="px-2 py-2 text-left">Rate plan</th>
                  <th className="px-2 py-2 text-left">Room type</th>
                  <th className="px-2 py-2 text-left">Période</th>
                  <th className="px-2 py-2 text-right">Prix actuel</th>
                  <th className="px-2 py-2 text-right">Après action</th>
                  <th className="px-2 py-2 text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, 20).map((r) => {
                  let newPrice: number | null = Number(r.price);
                  let newStopSell = r.stop_sell;
                  const val = Number(action.value);
                  if (action.type === "add_pct") newPrice = Math.round(newPrice * (1 + val / 100) * 100) / 100;
                  else if (action.type === "add_fixed") newPrice = Math.max(0, newPrice + val);
                  else if (action.type === "set_value") newPrice = Math.max(0, val);
                  else if (action.type === "close_range") newStopSell = true;
                  else if (action.type === "reopen_range") newStopSell = false;

                  return (
                    <tr key={r.id} className="border-b border-card-border/40">
                      <td className="px-2 py-1.5 font-mono">{ratePlans.find((rp) => rp.id === r.rate_plan_id)?.code ?? "?"}</td>
                      <td className="px-2 py-1.5 font-mono">{roomTypes.find((rt) => rt.id === r.room_type_id)?.code ?? "?"}</td>
                      <td className="px-2 py-1.5">{r.start_date} → {r.end_date}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{formatEUR(Number(r.price))}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold">
                        {action.type === "close_range" || action.type === "reopen_range"
                          ? formatEUR(Number(r.price))
                          : <span className={newPrice > Number(r.price) ? "text-emerald-700" : newPrice < Number(r.price) ? "text-rose-700" : ""}>
                              {formatEUR(newPrice)}
                              {newPrice !== Number(r.price) && (
                                <span className="ml-1 text-[9px] text-muted">
                                  ({newPrice > Number(r.price) ? "+" : ""}{Math.round((newPrice - Number(r.price)) / Number(r.price) * 100)}%)
                                </span>
                              )}
                            </span>
                        }
                      </td>
                      <td className="px-2 py-1.5">
                        {newStopSell ? (
                          <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] text-rose-900">Stop sell</span>
                        ) : (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] text-emerald-900">Open</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filtered.length > 20 && (
                  <tr><td colSpan={6} className="px-2 py-2 text-center text-[10px] text-muted">
                    …{filtered.length - 20} tarifs supplémentaires (impactés aussi à l'application)
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Revenue management :</strong> utilisez cet outil pour ajuster rapidement les
        tarifs sur des périodes précises (haute saison +15%, basse saison -10%, fermer
        Noël à la vente, etc.). Pour des ajustements fins jour par jour, utilisez la
        page <Link href={`/pms/${propertyId}/tarifs`} className="underline">tarifs standards</Link>.
      </div>
    </div>
  );
}
