"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { OBSERVATOIRE_STR_LU, averageADR, averageOccupancy, totalActiveListings, LU_AIRBNB_TOTAL_LISTINGS, LU_AIRBNB_GROWTH_YOY } from "@/lib/str-observatoire";

export default function ObservatoireStr() {
  const [filter, setFilter] = useState<"all" | "lu-ville" | "sud" | "nord" | "moselle">("all");

  const filtered = useMemo(() => {
    if (filter === "lu-ville") return OBSERVATOIRE_STR_LU.filter((e) => e.commune === "Luxembourg-Ville");
    if (filter === "sud") return OBSERVATOIRE_STR_LU.filter((e) => ["Esch-sur-Alzette", "Differdange"].includes(e.commune));
    if (filter === "nord") return OBSERVATOIRE_STR_LU.filter((e) => ["Diekirch / Vianden", "Echternach / Mullerthal"].includes(e.commune));
    if (filter === "moselle") return OBSERVATOIRE_STR_LU.filter((e) => e.commune.includes("Mondorf") || e.commune.includes("Remich"));
    return OBSERVATOIRE_STR_LU;
  }, [filter]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Observatoire STR Luxembourg</h1>
          <p className="mt-2 text-muted">
            Données agrégées Airbnb/Booking/Vrbo par commune et zone. ADR médian, percentiles P25-P75, occupation, nuitées disponibles,
            listings actifs. Sources : AirDNA sample, observations tevaxia Q4 2025 + rapports Airbnb Market Reports.
          </p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Listings LU</div>
            <div className="mt-1 text-2xl font-bold text-navy">{LU_AIRBNB_TOTAL_LISTINGS.toLocaleString("fr-LU")}</div>
            <div className="text-xs text-muted">+{(LU_AIRBNB_GROWTH_YOY * 100).toFixed(0)}% YoY</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">ADR médian filtré</div>
            <div className="mt-1 text-2xl font-bold text-navy">{averageADR(filtered)} €</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Occupation médiane</div>
            <div className="mt-1 text-2xl font-bold text-navy">{(averageOccupancy(filtered) * 100).toFixed(0)}%</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Annonces actives (filtre)</div>
            <div className="mt-1 text-2xl font-bold text-navy">{totalActiveListings(filtered)}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {([
            ["all", "Toutes zones"], ["lu-ville", "Luxembourg-Ville"], ["sud", "Sud (Esch, Differdange)"],
            ["nord", "Nord tourisme"], ["moselle", "Moselle / Mondorf"],
          ] as const).map(([k, label]) => (
            <button key={k} onClick={() => setFilter(k)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === k ? "bg-navy text-white" : "border border-card-border bg-card text-slate hover:bg-slate-50"}`}>
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">Zone</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">ADR P25</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">ADR médian</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">ADR P75</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Occupation</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">RevPAR</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Listings</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => (
                <tr key={i} className="border-b border-card-border/50 hover:bg-background">
                  <td className="px-4 py-2">
                    <div className="font-medium text-navy">{e.commune}</div>
                    <div className="text-xs text-muted">{e.zone}</div>
                  </td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">{e.adrP25} €</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-navy">{e.adrMedian} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs text-muted">{e.adrP75} €</td>
                  <td className="px-4 py-2 text-right font-mono">{(e.occupancyMedian * 100).toFixed(0)}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold text-rose-700">{e.revPARMedian} €</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{e.activeListings}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 text-xs text-blue-900">
          <strong>Mise à jour :</strong> Q4 2025 (trimestrielle). Ces données sont indicatives et à considérer comme un benchmark macro.
          Pour un pricing précis par bien, combinez avec <Link href="/str/pricing" className="underline font-semibold">/str/pricing</Link> et
          votre propre compset (voisins directs).
          <br/><strong>Sources :</strong> AirDNA échantillon LU, Airbnb Market Reports, panel tevaxia. Pour l&apos;accès API complet,
          licence AirDNA payante (~$200-500/mois selon usage).
        </div>
      </div>
    </div>
  );
}
