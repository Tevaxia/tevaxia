"use client";

import { useEffect, useState, use, useCallback } from "react";
import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { useAuth } from "@/components/AuthProvider";
import { getProperty } from "@/lib/pms/properties";
import { listReservations } from "@/lib/pms/reservations";
import {
  getFolioByReservation, openFolio, autoPostRoomCharges, postCharge,
  CATEGORY_DEFAULT_TVA,
} from "@/lib/pms/folios";
import type {
  PmsProperty, PmsReservation, PmsFolio, PmsChargeCategory,
} from "@/lib/pms/types";
import { formatEUR } from "@/lib/calculations";
import { errMsg } from "@/lib/pms/errors";

interface QuickItem {
  category: PmsChargeCategory;
  labelKey: string;
  price_ttc: number;
  emoji: string;
}

const QUICK_MENU: QuickItem[] = [
  // F&B
  { category: "breakfast", labelKey: "itemBreakfast", price_ttc: 15, emoji: "🍳" },
  { category: "breakfast", labelKey: "itemBreakfastContinental", price_ttc: 12, emoji: "🥐" },
  { category: "lunch", labelKey: "itemLunchMenu", price_ttc: 28, emoji: "🍽️" },
  { category: "lunch", labelKey: "itemLunchDailySpecial", price_ttc: 18, emoji: "🥗" },
  { category: "dinner", labelKey: "item3Course", price_ttc: 55, emoji: "🍷" },
  { category: "dinner", labelKey: "itemDinnerALaCarte", price_ttc: 45, emoji: "🥩" },
  // Bar
  { category: "bar", labelKey: "itemBeer", price_ttc: 5, emoji: "🍺" },
  { category: "bar", labelKey: "itemWineGlass", price_ttc: 8, emoji: "🍷" },
  { category: "bar", labelKey: "itemCocktail", price_ttc: 12, emoji: "🍸" },
  { category: "bar", labelKey: "itemCoffee", price_ttc: 3.5, emoji: "☕" },
  { category: "bar", labelKey: "itemSoftDrink", price_ttc: 4, emoji: "🥤" },
  { category: "bar", labelKey: "itemMineralWater", price_ttc: 4, emoji: "💧" },
  // Minibar
  { category: "minibar", labelKey: "itemMinibarDrink", price_ttc: 5, emoji: "🧊" },
  { category: "minibar", labelKey: "itemMinibarSnack", price_ttc: 6, emoji: "🍫" },
  // Spa
  { category: "spa", labelKey: "itemMassage", price_ttc: 75, emoji: "💆" },
  { category: "spa", labelKey: "itemSpaAccess", price_ttc: 35, emoji: "♨️" },
  // Other
  { category: "parking", labelKey: "itemParking", price_ttc: 12, emoji: "🅿️" },
  { category: "laundry", labelKey: "itemLaundry", price_ttc: 20, emoji: "👔" },
  { category: "room_service", labelKey: "itemRoomService", price_ttc: 8, emoji: "🛎️" },
];

const CATEGORY_GROUPS: { labelKey: string; categories: PmsChargeCategory[] }[] = [
  { labelKey: "grpRestaurant", categories: ["breakfast", "lunch", "dinner", "room_service"] },
  { labelKey: "grpBar", categories: ["bar"] },
  { labelKey: "grpRoom", categories: ["minibar", "laundry"] },
  { labelKey: "grpWellness", categories: ["spa", "parking"] },
];

const CATEGORY_KEY: Record<PmsChargeCategory, string> = {
  room: "catRoom",
  taxe_sejour: "catTouristTax",
  extra_bed: "catExtraBed",
  breakfast: "catBreakfast",
  lunch: "catLunch",
  dinner: "catDinner",
  bar: "catBar",
  minibar: "catMinibar",
  room_service: "catRoomService",
  meeting_room: "catMeetingRoom",
  parking: "catParking",
  laundry: "catLaundry",
  spa: "catSpa",
  phone: "catPhone",
  internet: "catInternet",
  transport: "catTransport",
  cancellation_fee: "catCancellationFee",
  damage: "catDamage",
  other: "catOther",
};

export default function PosPage(props: { params: Promise<{ propertyId: string }> }) {
  const { propertyId } = use(props.params);
  const t = useTranslations("pmsPos");
  const tFolio = useTranslations("pmsFolio");
  const locale = useLocale();
  const dateLocale = locale === "fr" ? "fr-LU" : locale === "de" ? "de-LU" : locale === "pt" ? "pt-PT" : locale === "lb" ? "de-LU" : "en-GB";
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
    const itemLabel = t(item.labelKey);
    try {
      await postCharge({
        folio_id: folioId,
        category: item.category,
        description: itemLabel,
        quantity: 1,
        unit_price_ht,
        tva_rate: tva,
        source: "pos",
      });
      setFlash(t("flashPosted", {
        label: itemLabel,
        amount: formatEUR(item.price_ttc),
        client: res.booker_name ?? res.reservation_number,
      }));
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

  if (authLoading || loading) return <div className="mx-auto max-w-6xl px-4 py-16 text-center text-muted">{t("loading")}</div>;
  if (!user || !property) return <div className="mx-auto max-w-4xl px-4 py-12 text-center"><Link href="/connexion" className="text-navy underline">{t("signIn")}</Link></div>;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold text-navy">{t("title")}</h1>
      <p className="mt-1 text-sm text-muted">{t("subtitle")}</p>

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
            {t("inHouseTitle", { count: reservations.length })}
          </div>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPh")}
            className="mb-2 w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm" />
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted italic">
              {search ? t("noClient") : t("noInHouse")}
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
                        {r.reservation_number} · {t("departureLabel", { date: new Date(r.check_out).toLocaleDateString(dateLocale, { day: "2-digit", month: "short" }) })}
                      </div>
                      {f && (
                        <div className={`text-xs font-mono ${selectedId === r.id ? "text-white" : "text-navy"}`}>
                          {formatEUR(Number(f.total_ttc))} {t("ttc")}
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
              👈 {t("pickClientHint")}
            </div>
          ) : (
            <>
              <div className="rounded-xl border border-navy bg-navy/5 p-4 mb-4">
                <div className="text-xs text-muted">{t("selectedClient")}</div>
                <div className="text-lg font-bold text-navy">
                  {selected.booker_name ?? "—"} ({selected.reservation_number})
                </div>
                <div className="text-xs text-muted">
                  {t("arrivalDeparture", {
                    checkIn: new Date(selected.check_in).toLocaleDateString(dateLocale),
                    checkOut: new Date(selected.check_out).toLocaleDateString(dateLocale),
                  })}
                </div>
                {selectedFolio && (
                  <div className="mt-2 text-sm">
                    {t("folioOpen")} <span className="font-bold text-navy">{formatEUR(Number(selectedFolio.total_ttc))}</span> {t("ttc")}
                    · {t("balanceRemaining")} <span className="font-bold text-rose-700">{formatEUR(Number(selectedFolio.balance_due))}</span>
                  </div>
                )}
                <Link href={`/pms/${propertyId}/reservations/${selected.id}/folio`}
                  className="mt-2 inline-block text-xs text-navy underline">
                  {t("seeFolio")}
                </Link>
              </div>

              {/* Grid items groupés */}
              {CATEGORY_GROUPS.map((grp) => {
                const items = QUICK_MENU.filter((i) => grp.categories.includes(i.category));
                if (items.length === 0) return null;
                return (
                  <div key={grp.labelKey} className="mb-5">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-2">{t(grp.labelKey)}</h3>
                    <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
                      {items.map((item, i) => (
                        <button key={i} onClick={() => postQuick(selected, item)}
                          className="rounded-xl border border-card-border bg-card p-3 text-left hover:border-navy hover:bg-navy/5 transition-colors">
                          <div className="text-3xl">{item.emoji}</div>
                          <div className="mt-2 text-sm font-semibold text-navy">{t(item.labelKey)}</div>
                          <div className="mt-1 text-lg font-bold text-emerald-700">
                            {formatEUR(item.price_ttc)}
                          </div>
                          <div className="text-[10px] text-muted">
                            {t("catTva", { cat: tFolio(CATEGORY_KEY[item.category]), tva: CATEGORY_DEFAULT_TVA[item.category] })}
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
        <strong>{t("helpTitle")}</strong> {t("helpText")}
      </div>
    </div>
  );
}
