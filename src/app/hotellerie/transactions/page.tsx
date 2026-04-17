"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  HOTEL_TRANSACTIONS,
  HOTEL_TRANSACTIONS_LAST_UPDATE,
  aggregateByCategory,
  type HotelCategory,
} from "@/lib/hotel-transactions";
import { formatEUR } from "@/lib/calculations";

const CAT_LABELS: Record<HotelCategory, string> = {
  budget: "Budget (≤ 3*)",
  midscale: "Midscale (3*)",
  upscale: "Upscale (4*)",
  luxury: "Luxury (5*)",
};

const CAT_COLORS: Record<HotelCategory, string> = {
  budget: "bg-slate-100 text-slate-800 border-slate-200",
  midscale: "bg-blue-100 text-blue-900 border-blue-200",
  upscale: "bg-amber-100 text-amber-900 border-amber-200",
  luxury: "bg-purple-100 text-purple-900 border-purple-200",
};

const COUNTRY_FLAGS: Record<string, string> = {
  LU: "🇱🇺", BE: "🇧🇪", FR: "🇫🇷", DE: "🇩🇪",
};

export default function HotelTransactionsPage() {
  const [country, setCountry] = useState<string>("all");
  const [category, setCategory] = useState<HotelCategory | "all">("all");

  const filtered = useMemo(() => {
    return HOTEL_TRANSACTIONS.filter((t) => {
      if (country !== "all" && t.country !== country) return false;
      if (category !== "all" && t.category !== category) return false;
      return true;
    }).sort((a, b) => b.date.localeCompare(a.date));
  }, [country, category]);

  const aggregates = useMemo(() => aggregateByCategory(), []);

  const totalVolume = filtered.reduce((s, t) => s + (t.priceMillEur ?? 0), 0);
  const totalRooms = filtered.reduce((s, t) => s + t.nbRooms, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">← Hôtellerie</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Comparables transactionnels hôtels</h1>
          <p className="mt-2 text-muted">
            Historique de transactions publiques hôtels LU et Grande Région (Sarrebruck, Trèves, Metz,
            Thionville, Arlon). Prix total, prix/chambre, cap rate implicite. Utile pour benchmark
            d&apos;acquisition et calibration de la valorisation.
          </p>
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] text-emerald-800">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            Base mise à jour : {new Date(HOTEL_TRANSACTIONS_LAST_UPDATE).toLocaleDateString("fr-LU")}
          </div>
        </div>

        {/* Stats globales */}
        <div className="grid gap-3 sm:grid-cols-4 mb-6">
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">Transactions</div>
            <div className="mt-1 text-2xl font-bold text-navy">{filtered.length}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">Volume</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalVolume.toFixed(0)} M€</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">Chambres</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalRooms.toLocaleString("fr-LU")}</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4 text-center">
            <div className="text-xs text-muted">Prix / chambre moyen</div>
            <div className="mt-1 text-xl font-bold text-navy">
              {totalRooms > 0 ? formatEUR(Math.round(totalVolume * 1_000_000 / totalRooms)) : "—"}
            </div>
          </div>
        </div>

        {/* Agrégat par catégorie */}
        <div className="mb-6 rounded-xl border border-card-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-navy mb-3">Benchmarks par catégorie</h2>
          <div className="grid gap-3 sm:grid-cols-4">
            {(Object.entries(aggregates) as [HotelCategory, { count: number; avgPricePerRoom: number; avgCapRate: number }][]).map(([cat, agg]) => (
              <div key={cat} className={`rounded-lg border p-3 ${CAT_COLORS[cat]}`}>
                <div className="text-xs font-semibold">{CAT_LABELS[cat]}</div>
                <div className="mt-1 text-[10px] opacity-70">{agg.count} transactions</div>
                <div className="mt-2 text-sm font-mono font-bold">{formatEUR(agg.avgPricePerRoom)}/ch.</div>
                <div className="text-[10px] opacity-80">cap rate moy. {agg.avgCapRate.toFixed(2)} %</div>
              </div>
            ))}
          </div>
        </div>

        {/* Filtres */}
        <div className="mb-4 flex flex-wrap gap-2">
          <select value={country} onChange={(e) => setCountry(e.target.value)}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">Tous pays</option>
            <option value="LU">🇱🇺 Luxembourg</option>
            <option value="BE">🇧🇪 Belgique</option>
            <option value="FR">🇫🇷 France</option>
            <option value="DE">🇩🇪 Allemagne</option>
          </select>
          <select value={category} onChange={(e) => setCategory(e.target.value as HotelCategory | "all")}
            className="rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm">
            <option value="all">Toutes catégories</option>
            {(Object.entries(CAT_LABELS) as [HotelCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        {/* Table des transactions */}
        <div className="rounded-xl border border-card-border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-card-border bg-background/60">
                  <th className="px-3 py-2 text-left font-semibold text-navy">Date</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">Hôtel</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">Ville</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">Catégorie</th>
                  <th className="px-3 py-2 text-right font-semibold text-navy">Chambres</th>
                  <th className="px-3 py-2 text-right font-semibold text-navy">Prix</th>
                  <th className="px-3 py-2 text-right font-semibold text-navy">€/ch.</th>
                  <th className="px-3 py-2 text-right font-semibold text-navy">Cap rate</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">Acheteur</th>
                  <th className="px-3 py-2 text-left font-semibold text-navy">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((t, i) => (
                  <tr key={i} className="border-b border-card-border/40 hover:bg-background/40">
                    <td className="px-3 py-2 font-mono text-[10px]">{t.date}</td>
                    <td className="px-3 py-2 font-medium">{t.hotel}</td>
                    <td className="px-3 py-2">
                      <span className="mr-1">{COUNTRY_FLAGS[t.country] ?? ""}</span>
                      {t.city}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-semibold ${CAT_COLORS[t.category]}`}>
                        {CAT_LABELS[t.category]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono">{t.nbRooms}</td>
                    <td className="px-3 py-2 text-right font-mono font-semibold">
                      {t.priceMillEur !== null ? `${t.priceMillEur} M€` : "n.d."}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {t.pricePerRoom !== null ? formatEUR(t.pricePerRoom) : "—"}
                    </td>
                    <td className="px-3 py-2 text-right font-mono">
                      {t.capRate !== null ? `${t.capRate.toFixed(1)} %` : "—"}
                    </td>
                    <td className="px-3 py-2 text-[10px] text-muted">{t.buyer}</td>
                    <td className="px-3 py-2 text-[10px] text-muted italic">{t.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Sources &amp; méthodologie :</strong> HVS European Hotel Valuation Index, Horwath HTL
          European Hotel Industry Performance, CoStar public data, Cushman &amp; Wakefield Hospitality,
          Invesco presse. Les valeurs agrégées sont indicatives — un comparable isolé n&apos;est pas
          suffisant pour valorisation. Nous complétons à chaque nouvelle publication trimestrielle.
          Pour une due diligence complète, voir <Link href="/hotellerie/due-diligence" className="underline">/hotellerie/due-diligence</Link>.
        </div>
      </div>
    </div>
  );
}
