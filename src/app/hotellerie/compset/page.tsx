"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { COMPSET_LU, averageADR, averageOccupancy, averageRevPAR, type HotelCategory } from "@/lib/hotellerie/compset-lu";

const CATEGORIES: { value: HotelCategory; label: string; color: string }[] = [
  { value: "budget", label: "Budget 1-2★", color: "bg-slate-100 text-slate-800" },
  { value: "midscale", label: "Midscale 3★", color: "bg-blue-100 text-blue-800" },
  { value: "upscale", label: "Upscale 4★", color: "bg-purple-100 text-purple-800" },
  { value: "luxury", label: "Luxury 5★", color: "bg-amber-100 text-amber-800" },
];

export default function CompsetPage() {
  const [category, setCategory] = useState<HotelCategory | "all">("all");

  const filtered = useMemo(() => {
    return category === "all" ? COMPSET_LU : COMPSET_LU.filter((c) => c.category === category);
  }, [category]);

  const zones = useMemo(() => {
    const set = new Set(filtered.map((c) => c.zone));
    return Array.from(set);
  }, [filtered]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">&larr; Hôtellerie</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Compset hôtelier Luxembourg + Grande Région</h1>
          <p className="mt-2 text-muted">
            Benchmarks ADR, occupation et RevPAR par zone et catégorie. Sources : STR EMEA Performance Report Q4 2025,
            Horwath HTL European Hotel Valuation Index 2025, observatoire tevaxia. Mise à jour trimestrielle.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          <button onClick={() => setCategory("all")}
            className={`rounded-lg px-3 py-2 text-xs font-medium ${category === "all" ? "bg-navy text-white" : "border border-card-border bg-card text-slate hover:bg-slate-50"}`}>
            Toutes catégories
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.value} onClick={() => setCategory(c.value)}
              className={`rounded-lg px-3 py-2 text-xs font-medium ${category === c.value ? "bg-navy text-white" : "border border-card-border bg-card text-slate hover:bg-slate-50"}`}>
              {c.label}
            </button>
          ))}
        </div>

        {/* KPI globaux filtrés */}
        <div className="grid gap-3 sm:grid-cols-3 mb-8">
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">ADR moyen</div>
            <div className="mt-1 text-2xl font-bold text-navy">{averageADR(filtered)} €</div>
            <div className="text-xs text-muted">{filtered.length} zones × catégories</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">Occupation moyenne</div>
            <div className="mt-1 text-2xl font-bold text-navy">{(averageOccupancy(filtered) * 100).toFixed(1)}%</div>
          </div>
          <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
            <div className="text-xs uppercase tracking-wider text-muted">RevPAR moyen</div>
            <div className="mt-1 text-2xl font-bold text-navy">{averageRevPAR(filtered)} €</div>
          </div>
        </div>

        {/* Tableau */}
        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 font-semibold text-slate">Zone</th>
                <th className="px-4 py-2 font-semibold text-slate">Catégorie</th>
                <th className="px-4 py-2 font-semibold text-slate text-right">ADR</th>
                <th className="px-4 py-2 font-semibold text-slate text-right">Occupation</th>
                <th className="px-4 py-2 font-semibold text-slate text-right">RevPAR</th>
                <th className="px-4 py-2 font-semibold text-slate">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const cat = CATEGORIES.find((c) => c.value === e.category);
                return (
                  <tr key={i} className="border-b border-card-border/50 hover:bg-background">
                    <td className="px-4 py-2 font-medium text-navy">{e.zone}</td>
                    <td className="px-4 py-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cat?.color}`}>{cat?.label}</span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-semibold">{e.adr} €</td>
                    <td className="px-4 py-2 text-right font-mono">{(e.occupancy * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-navy">{e.revPAR} €</td>
                    <td className="px-4 py-2 text-xs text-muted">{e.source}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <p className="mt-4 text-xs text-muted">
          <strong>{zones.length} zones couvertes</strong> — Luxembourg Centre, Gare, Kirchberg, Findel, Esch-sur-Alzette, Ettelbruck, Diekirch, Mersch,
          Metz (FR), Saarbrücken (DE), Trier (DE), Liège (BE).
        </p>

        <div className="mt-8 rounded-xl border border-blue-200 bg-blue-50 p-5 text-sm text-blue-900">
          <strong>À propos des données :</strong> les benchmarks ci-dessus sont des moyennes annualisées 2025
          combinant sources publiques (STR EMEA Performance Report, Horwath HTL HVI) et panel tevaxia. Les valeurs
          sont indicatives — pour une analyse précise avant acquisition, abonnez-vous à STR Global / CoStar (€5-20k/an)
          ou à Horwath HTL. Contactez-nous si vous souhaitez contribuer au panel Hotrec LU en partage réciproque.
        </div>
      </div>
    </div>
  );
}
