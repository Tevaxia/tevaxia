"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import {
  listRoomTypes, listRooms, createRoomType, updateRoomType, deleteRoomType,
  createRoom, updateRoom, deleteRoom, setRoomStatus, statusLabel,
} from "@/lib/pms/rooms";
import {
  listRatePlans, createRatePlan, updateRatePlan, deleteRatePlan,
} from "@/lib/pms/rates";
import type {
  PmsProperty, PmsRoom, PmsRoomStatus, PmsRoomType, PmsRatePlan,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";

const STATUSES: PmsRoomStatus[] = [
  "available", "occupied", "dirty", "clean", "inspected", "out_of_order", "maintenance",
];

export default function RoomsPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [roomTypes, setRoomTypes] = useState<PmsRoomType[]>([]);
  const [rooms, setRooms] = useState<PmsRoom[]>([]);
  const [ratePlans, setRatePlans] = useState<PmsRatePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [p, types, rr, rp] = await Promise.all([
      getProperty(propertyId),
      listRoomTypes(propertyId),
      listRooms(propertyId),
      listRatePlans(propertyId),
    ]);
    setProperty(p);
    setRoomTypes(types);
    setRooms(rr);
    setRatePlans(rp);
    setLoading(false);
  }, [propertyId]);

  useEffect(() => {
    if (authLoading || !user) return;
    void reload();
  }, [user, authLoading, reload]);

  // Forms state
  const [rtForm, setRtForm] = useState({ code: "", name: "", capacity_adults: 2, capacity_children: 0, base_rate: 120, size_m2: 20 });
  const [roomForm, setRoomForm] = useState({ room_type_id: "", number: "", floor: 0 });
  const [rpForm, setRpForm] = useState({ code: "", name: "", refundable: true, breakfast_included: false, discount_pct: 0, min_los: 1 });

  const addRoomType = async () => {
    if (!rtForm.code.trim() || !rtForm.name.trim()) { setError("Code et nom requis"); return; }
    try {
      await createRoomType({ property_id: propertyId, ...rtForm, code: rtForm.code.toUpperCase() });
      setRtForm({ code: "", name: "", capacity_adults: 2, capacity_children: 0, base_rate: 120, size_m2: 20 });
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const addRoom = async () => {
    if (!roomForm.number.trim() || !roomForm.room_type_id) { setError("Numéro et type requis"); return; }
    try {
      await createRoom({ property_id: propertyId, ...roomForm });
      setRoomForm({ room_type_id: roomForm.room_type_id, number: "", floor: 0 });
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  const addRatePlan = async () => {
    if (!rpForm.code.trim() || !rpForm.name.trim()) { setError("Code et nom requis"); return; }
    try {
      await createRatePlan({ property_id: propertyId, ...rpForm, code: rpForm.code.toUpperCase() });
      setRpForm({ code: "", name: "", refundable: true, breakfast_included: false, discount_pct: 0, min_los: 1 });
      await reload();
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };

  if (authLoading || loading) return <div className="mx-auto max-w-5xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-3xl px-4 py-12 text-center text-sm text-muted"><Link href="/connexion" className="text-navy underline">Connectez-vous</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Link href={`/pms/${propertyId}`} className="text-xs text-navy hover:underline">← {property.name}</Link>
      <h1 className="mt-1 text-2xl font-bold text-navy sm:text-3xl">Chambres &amp; tarifs</h1>

      {error && <div className="mt-3 rounded-md bg-rose-50 border border-rose-200 p-3 text-xs text-rose-900">{error}</div>}

      {/* Types de chambres */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Types de chambres</h2>
        <div className="grid gap-2 sm:grid-cols-6 text-xs mb-4">
          <input
            placeholder="Code (STD)"
            value={rtForm.code}
            onChange={(e) => setRtForm({ ...rtForm, code: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <input
            placeholder="Nom (Standard)"
            value={rtForm.name}
            onChange={(e) => setRtForm({ ...rtForm, name: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5 sm:col-span-2"
          />
          <input
            type="number" placeholder="Adultes" value={rtForm.capacity_adults}
            onChange={(e) => setRtForm({ ...rtForm, capacity_adults: Number(e.target.value) })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <input
            type="number" placeholder="Tarif base €" value={rtForm.base_rate}
            onChange={(e) => setRtForm({ ...rtForm, base_rate: Number(e.target.value) })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <button
            type="button"
            onClick={addRoomType}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
          >
            + Ajouter
          </button>
        </div>

        {roomTypes.length === 0 ? (
          <p className="text-xs text-muted italic">Aucun type. Commencez par ajouter STD (Standard), DLX (Deluxe), STE (Suite)…</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-1 pr-2 text-left font-medium text-muted">Code</th>
                <th className="py-1 pr-2 text-left font-medium text-muted">Nom</th>
                <th className="py-1 px-2 text-right font-medium text-muted">Cap. Ad/Enf</th>
                <th className="py-1 px-2 text-right font-medium text-muted">Tarif base</th>
                <th className="py-1 px-2 text-right font-medium text-muted">Surface</th>
                <th className="py-1 pl-2 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {roomTypes.map((rt) => (
                <tr key={rt.id} className="border-b border-card-border/40">
                  <td className="py-1 pr-2 font-mono">{rt.code}</td>
                  <td className="py-1 pr-2">{rt.name}</td>
                  <td className="py-1 px-2 text-right font-mono">{rt.capacity_adults}/{rt.capacity_children}</td>
                  <td className="py-1 px-2 text-right font-mono">{formatEUR(Number(rt.base_rate))}</td>
                  <td className="py-1 px-2 text-right font-mono">{rt.size_m2 ? `${rt.size_m2} m²` : "—"}</td>
                  <td className="py-1 pl-2 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        const v = prompt("Nouveau tarif base €", String(rt.base_rate));
                        if (v !== null) {
                          const n = Number(v);
                          if (Number.isFinite(n)) {
                            await updateRoomType(rt.id, { base_rate: n });
                            await reload();
                          }
                        }
                      }}
                      className="text-navy hover:underline mr-2"
                    >
                      Modifier
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Supprimer type ${rt.code} ?`)) {
                          await deleteRoomType(rt.id);
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

      {/* Chambres physiques */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Chambres physiques</h2>
        <div className="grid gap-2 sm:grid-cols-5 text-xs mb-4">
          <select
            value={roomForm.room_type_id}
            onChange={(e) => setRoomForm({ ...roomForm, room_type_id: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          >
            <option value="">Type…</option>
            {roomTypes.map((rt) => <option key={rt.id} value={rt.id}>{rt.code} — {rt.name}</option>)}
          </select>
          <input
            placeholder="N° (101)"
            value={roomForm.number}
            onChange={(e) => setRoomForm({ ...roomForm, number: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <input
            type="number"
            placeholder="Étage"
            value={roomForm.floor}
            onChange={(e) => setRoomForm({ ...roomForm, floor: Number(e.target.value) })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <button
            type="button"
            onClick={addRoom}
            disabled={roomTypes.length === 0}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light disabled:opacity-50 sm:col-span-2"
          >
            + Ajouter chambre
          </button>
        </div>

        {rooms.length === 0 ? (
          <p className="text-xs text-muted italic">Aucune chambre. Ajoutez d&apos;abord un type puis les chambres correspondantes.</p>
        ) : (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
            {rooms.map((r) => {
              const rt = roomTypes.find((t) => t.id === r.room_type_id);
              return (
                <div key={r.id} className="rounded-md border border-card-border bg-background p-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-navy">{r.number}</span>
                    <span className="text-[10px] text-muted">{rt?.code ?? "?"}</span>
                  </div>
                  <div className="mt-1 text-[10px] text-muted">Étage {r.floor ?? "—"}</div>
                  <select
                    value={r.status}
                    onChange={async (e) => { await setRoomStatus(r.id, e.target.value as PmsRoomStatus); await reload(); }}
                    className="mt-1 w-full rounded border border-card-border bg-background px-1 py-0.5 text-[10px]"
                  >
                    {STATUSES.map((s) => <option key={s} value={s}>{statusLabel(s)}</option>)}
                  </select>
                  <button
                    type="button"
                    onClick={async () => {
                      if (confirm(`Supprimer chambre ${r.number} ?`)) {
                        await deleteRoom(r.id);
                        await reload();
                      }
                    }}
                    className="mt-1 w-full text-[9px] text-rose-700 hover:underline"
                  >
                    supprimer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Rate plans */}
      <section className="mt-6 rounded-xl border border-card-border bg-card p-5">
        <h2 className="text-sm font-semibold text-navy mb-3">Rate plans (tarifs commerciaux)</h2>
        <div className="grid gap-2 sm:grid-cols-7 text-xs mb-4">
          <input
            placeholder="Code (BAR)"
            value={rpForm.code}
            onChange={(e) => setRpForm({ ...rpForm, code: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <input
            placeholder="Nom (Best Available Rate)"
            value={rpForm.name}
            onChange={(e) => setRpForm({ ...rpForm, name: e.target.value })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5 sm:col-span-2"
          />
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={rpForm.refundable} onChange={(e) => setRpForm({ ...rpForm, refundable: e.target.checked })} />
            Remb.
          </label>
          <label className="flex items-center gap-1 text-[11px]">
            <input type="checkbox" checked={rpForm.breakfast_included} onChange={(e) => setRpForm({ ...rpForm, breakfast_included: e.target.checked })} />
            PDJ
          </label>
          <input
            type="number" placeholder="% rabais"
            value={rpForm.discount_pct}
            onChange={(e) => setRpForm({ ...rpForm, discount_pct: Number(e.target.value) })}
            className="rounded-md border border-card-border bg-background px-2 py-1.5"
          />
          <button
            type="button"
            onClick={addRatePlan}
            className="rounded-md bg-navy px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-light"
          >
            + Ajouter
          </button>
        </div>

        {ratePlans.length === 0 ? (
          <p className="text-xs text-muted italic">Aucun rate plan. Ajoutez BAR (Best Available Rate), NR (Non-Refundable), CORP, PKG…</p>
        ) : (
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-card-border">
                <th className="py-1 pr-2 text-left font-medium text-muted">Code</th>
                <th className="py-1 pr-2 text-left font-medium text-muted">Nom</th>
                <th className="py-1 px-2 text-center font-medium text-muted">Remb.</th>
                <th className="py-1 px-2 text-center font-medium text-muted">PDJ</th>
                <th className="py-1 px-2 text-right font-medium text-muted">% rabais</th>
                <th className="py-1 px-2 text-right font-medium text-muted">Min séj.</th>
                <th className="py-1 pl-2 text-right font-medium text-muted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {ratePlans.map((rp) => (
                <tr key={rp.id} className="border-b border-card-border/40">
                  <td className="py-1 pr-2 font-mono">{rp.code}</td>
                  <td className="py-1 pr-2">{rp.name}</td>
                  <td className="py-1 px-2 text-center">{rp.refundable ? "✓" : "—"}</td>
                  <td className="py-1 px-2 text-center">{rp.breakfast_included ? "✓" : "—"}</td>
                  <td className="py-1 px-2 text-right font-mono">{rp.discount_pct}%</td>
                  <td className="py-1 px-2 text-right font-mono">{rp.min_los}</td>
                  <td className="py-1 pl-2 text-right">
                    <button
                      type="button"
                      onClick={async () => {
                        await updateRatePlan(rp.id, { active: !rp.active });
                        await reload();
                      }}
                      className="text-navy hover:underline mr-2"
                    >
                      {rp.active ? "Désactiver" : "Activer"}
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        if (confirm(`Supprimer rate plan ${rp.code} ?`)) {
                          await deleteRatePlan(rp.id);
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

      <div className="mt-6">
        <Link
          href={`/pms/${propertyId}/tarifs`}
          className="text-xs text-navy hover:underline"
        >
          Gérer les tarifs saisonniers par période →
        </Link>
      </div>
    </div>
  );
}
