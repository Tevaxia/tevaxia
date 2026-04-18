"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import {
  getFolioByReservation, openFolio, autoPostRoomCharges, postCharge,
  CATEGORY_DEFAULT_TVA, CATEGORY_LABELS,
} from "@/lib/pms/folios";
import type {
  PmsProperty, PmsReservation, PmsFolio, PmsChargeCategory,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

interface QuickItem {
  category: PmsChargeCategory;
  label: string;
  price_ttc: number;
  emoji: string;
}

const QUICK_MENU: QuickItem[] = [
  // F&B
  { category: "breakfast", label: "Petit-déjeuner", price_ttc: 15, emoji: "🍳" },
  { category: "breakfast", label: "Petit-déj. continental", price_ttc: 12, emoji: "🥐" },
  { category: "lunch", label: "Formule déjeuner", price_ttc: 28, emoji: "🍽️" },
  { category: "lunch", label: "Plat du jour", price_ttc: 18, emoji: "🥗" },
  { category: "dinner", label: "Menu 3 services", price_ttc: 55, emoji: "🍷" },
  { category: "dinner", label: "Dîner à la carte", price_ttc: 45, emoji: "🥩" },
  // Bar
  { category: "bar", label: "Bière 33cl", price_ttc: 5, emoji: "🍺" },
  { category: "bar", label: "Verre vin", price_ttc: 8, emoji: "🍷" },
  { category: "bar", label: "Cocktail", price_ttc: 12, emoji: "🍸" },
  { category: "bar", label: "Café", price_ttc: 3.5, emoji: "☕" },
  { category: "bar", label: "Soft drink", price_ttc: 4, emoji: "🥤" },
  { category: "bar", label: "Eau minérale", price_ttc: 4, emoji: "💧" },
  // Minibar
  { category: "minibar", label: "Minibar boisson", price_ttc: 5, emoji: "🧊" },
  { category: "minibar", label: "Minibar snack", price_ttc: 6, emoji: "🍫" },
  // Spa
  { category: "spa", label: "Massage 45min", price_ttc: 75, emoji: "💆" },
  { category: "spa", label: "Accès spa 1 pers.", price_ttc: 35, emoji: "♨️" },
  // Other
  { category: "parking", label: "Parking nuit", price_ttc: 12, emoji: "🅿️" },
  { category: "laundry", label: "Pressing", price_ttc: 20, emoji: "👔" },
  { category: "room_service", label: "Room service", price_ttc: 8, emoji: "🛎️" },
];

const CATEGORY_GROUPS: { label: string; categories: PmsChargeCategory[] }[] = [
  { label: "Restaurant", categories: ["breakfast", "lunch", "dinner", "room_service"] },
  { label: "Bar", categories: ["bar"] },
  { label: "Chambre", categories: ["minibar", "laundry"] },
  { label: "Wellness & services", categories: ["spa", "parking"] },
];

export default function PosPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const { user, loading: authLoading } = useAuth();
  const [property, setProperty] = useState<PmsProperty | null>(null);
  const [reservations, setReservations] = useState<PmsReservation[]>([]);
  const [folios, setFolios] = useState<Record<string, PmsFolio | null>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const reload = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [p, res] = await Promise.all([
        getProperty(propertyId),
        listReservations(propertyId, {
          fromDate: today,
          toDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
          status: ["checked_in"],
        }),
      ]);
      setProperty(p);
      setReservations(res);
      // Load folios in parallel
      const foliosMap: Record<string, PmsFolio | null> = {};
      await Promise.all(res.map(async (r) => {
        foliosMap[r.id] = await getFolioByReservation(r.id);
      }));
      setFolios(foliosMap);
    } catch (e) {
      setError(errMsg(e));
    }
    setLoading(false);
  }, [propertyId]);

  useEffect(() => { if (!authLoading && user) void reload(); }, [user, authLoading, reload]);

  const selected = reservations.find((r) => r.id === selectedId) ?? null;
  const selectedFolio = selected ? folios[selected.id] : null;

  const ensureFolio = async (res: PmsReservation): Promise<string | null> => {
    if (folios[res.id]) return folios[res.id]!.id;
    // Ouvre folio + post nuits
    try {
      const f = await openFolio(propertyId, res.id);
      await autoPostRoomCharges(f.id);
      const refreshed = await getFolioByReservation(res.id);
      setFolios((prev) => ({ ...prev, [res.id]: refreshed }));
      return refreshed?.id ?? null;
    } catch (e) {
      setError(errMsg(e));
      return null;
    }
  };

  const postQuick = async (res: PmsReservation, item: QuickItem) => {
    const folioId = await ensureFolio(res);
    if (!folioId) return;
    const tva = CATEGORY_DEFAULT_TVA[item.category];
    const unit_price_ht = Math.round((item.price_ttc / (1 + tva / 100)) * 100) / 100;
    try {
      await postCharge({
        folio_id: folioId,
        category: item.category,
        description: item.label,
        quantity: 1,
        unit_price_ht,
        tva_rate: tva,
        source: "pos",
      });
      setFlash(`✓ ${item.label} · ${formatEUR(item.price_ttc)} posté sur ${res.booker_name ?? res.reservation_number}`);
      setTimeout(() => setFlash(null), 2500);
      await reload();
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const filtered = reservations.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.reservation_number.toLowerCase().includes(q)
      || (r.booker_name?.toLowerCase().includes(q) ?? false)
      || (r.booker_email?.toLowerCase().includes(q) ?? false);
  });

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">Chargement…</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">Se connecter</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">Point de vente (POS)</h1>
      <p className="mt-1 text-sm text-muted">
        Saisie rapide F&B + services pour clients in-house. Charges automatiquement
        postées sur le folio du client avec TVA LU (F&B 17% / hébergement 3% / spa 17%).
      </p>

      {error && <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900">{error}</div>}
      {flash && (
        <div className="fixed top-20 right-4 z-50 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-lg">
          {flash}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-[300px_1fr]">
        {/* Liste clients in-house */}
        <div className="rounded-xl border border-card-border bg-card p-3">
          <div className="text-xs font-bold uppercase tracking-wider text-navy mb-2">
            Clients in-house ({reservations.length})
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client ou chambre…"
            className="mb-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted italic">
              {search ? "Aucun client trouvé" : "Aucun client in-house"}
            </div>
          ) : (
            <ul className="space-y-1 max-h-[500px] overflow-y-auto">
              {filtered.map((r) => {
                const f = folios[r.id];
                return (
                  <li key={r.id}>
                    <button onClick={() => setSelectedId(r.id)}
                      className={`w-full text-left rounded-lg p-2 transition-colors ${
                        selectedId === r.id ? "bg-navy text-white" : "hover:bg-background"
                      }`}>
                      <div className={`font-semibold text-sm ${selectedId === r.id ? "" : "text-navy"}`}>
                        {r.booker_name ?? r.reservation_number}
                      </div>
                      <div className={`text-[10px] ${selectedId === r.id ? "text-white/70" : "text-muted"}`}>
                        {r.reservation_number} · Départ {new Date(r.check_out).toLocaleDateString("fr-LU", { day: "2-digit", month: "short" })}
                      </div>
                      {f && (
                        <div className={`text-xs font-mono ${selectedId === r.id ? "text-white" : "text-navy"}`}>
                          {formatEUR(Number(f.total_ttc))} TTC
                        </div>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* POS grid */}
        <div>
          {!selected ? (
            <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center text-sm text-muted">
              👈 Sélectionnez un client dans la liste pour poster une charge
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-navy bg-navy/5 p-4 mb-4">
                <div className="text-xs text-muted">Client sélectionné</div>
                <div className="text-lg font-bold text-navy">
                  {selected.booker_name ?? "—"} ({selected.reservation_number})
                </div>
                <div className="text-xs text-muted">
                  Arrivée {new Date(selected.check_in).toLocaleDateString("fr-LU")} →
                  Départ {new Date(selected.check_out).toLocaleDateString("fr-LU")}
                </div>
                {selectedFolio && (
                  <div className="mt-2 text-sm">
                    Folio ouvert : <span className="font-bold text-navy">{formatEUR(Number(selectedFolio.total_ttc))}</span> TTC
                    · Solde restant : <span className="font-bold text-rose-700">{formatEUR(Number(selectedFolio.balance_due))}</span>
                  </div>
                )}
                <Link href={`/pms/${propertyId}/reservations/${selected.id}/folio`}
                  className="mt-2 inline-block text-xs text-navy underline">
                  Voir folio complet →
                </Link>
              </div>

              {/* Grid items groupés */}
              {CATEGORY_GROUPS.map((grp) => {
                const items = QUICK_MENU.filter((i) => grp.categories.includes(i.category));
                if (items.length === 0) return null;
                return (
                  <div key={grp.label} className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">{grp.label}</h3>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((item, i) => (
                        <button key={i} onClick={() => postQuick(selected, item)}
                          className="rounded-xl border border-card-border bg-card p-3 text-left hover:border-navy hover:bg-navy/5 transition-colors">
                          <div className="text-3xl">{item.emoji}</div>
                          <div className="mt-2 text-sm font-semibold text-navy">{item.label}</div>
                          <div className="mt-1 text-lg font-bold text-emerald-700">
                            {formatEUR(item.price_ttc)}
                          </div>
                          <div className="text-[10px] text-muted">
                            {CATEGORY_LABELS[item.category]} · TVA {CATEGORY_DEFAULT_TVA[item.category]}%
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Comment ça marche :</strong> sélection client → clic sur un item = charge
        postée sur son folio instantanément. TVA LU appliquée automatiquement selon
        catégorie. Si le folio n&apos;existe pas encore (check-in récent), il est créé à la
        volée avec pré-post des nuits. Idéal tablette cuisine / bar en mode kiosk.
      </div>
    </div>
  );
}
