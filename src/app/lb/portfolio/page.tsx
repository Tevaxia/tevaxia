"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";

interface PortfolioAsset {
  id: string;
  nom: string;
  type: string;
  commune: string;
  valeur: number;
  loyerAnnuel: number;
  surface: number;
  dette: number;
}

const EMPTY_ASSET: Omit<PortfolioAsset, "id"> = {
  nom: "", type: "Appartement", commune: "", valeur: 0, loyerAnnuel: 0, surface: 0, dette: 0,
};

export default function Portfolio() {
  const [assets, setAssets] = useState<PortfolioAsset[]>([
    { id: "1", nom: "Appartement Kirchberg", type: "Appartement", commune: "Luxembourg", valeur: 750000, loyerAnnuel: 28800, surface: 75, dette: 500000 },
    { id: "2", nom: "Bureau Cloche d'Or", type: "Bureau", commune: "Luxembourg", valeur: 1200000, loyerAnnuel: 72000, surface: 150, dette: 800000 },
  ]);

  const updateAsset = (index: number, field: keyof PortfolioAsset, value: string | number) => {
    setAssets((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addAsset = () => setAssets((prev) => [...prev, { ...EMPTY_ASSET, id: String(Date.now()) }]);
  const removeAsset = (i: number) => setAssets((prev) => prev.filter((_, idx) => idx !== i));

  const stats = useMemo(() => {
    const valeurTotale = assets.reduce((s, a) => s + a.valeur, 0);
    const detteTotale = assets.reduce((s, a) => s + a.dette, 0);
    const loyerTotal = assets.reduce((s, a) => s + a.loyerAnnuel, 0);
    const surfaceTotale = assets.reduce((s, a) => s + a.surface, 0);
    const equityTotale = valeurTotale - detteTotale;
    const ltvGlobal = valeurTotale > 0 ? detteTotale / valeurTotale : 0;
    const rendementBrut = valeurTotale > 0 ? loyerTotal / valeurTotale : 0;
    const rendementEquity = equityTotale > 0 ? loyerTotal / equityTotale : 0;

    // Breakdown by type
    const parType: Record<string, { count: number; valeur: number }> = {};
    for (const a of assets) {
      if (!parType[a.type]) parType[a.type] = { count: 0, valeur: 0 };
      parType[a.type].count++;
      parType[a.type].valeur += a.valeur;
    }

    return { valeurTotale, detteTotale, loyerTotal, surfaceTotale, equityTotale, ltvGlobal, rendementBrut, rendementEquity, parType, nbActifs: assets.length };
  }, [assets]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Property portfolio</h1>
          <p className="mt-2 text-muted">Aggregate your assets and track overall performance</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* KPIs */}
          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white">
              <div className="text-xs text-white/60">Total portfolio value</div>
              <div className="text-3xl font-bold mt-1">{formatEUR(stats.valeurTotale)}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div><span className="text-white/50">Equity</span><br/><span className="font-semibold">{formatEUR(stats.equityTotale)}</span></div>
                <div><span className="text-white/50">Debt</span><br/><span className="font-semibold">{formatEUR(stats.detteTotale)}</span></div>
              </div>
            </div>

            <ResultPanel
              title="Portfolio indicators"
              lines={[
                { label: "Number of assets", value: String(stats.nbActifs) },
                { label: "Total area", value: `${stats.surfaceTotale} m²` },
                { label: "Total annual rent", value: formatEUR(stats.loyerTotal) },
                { label: "Gross yield", value: formatPct(stats.rendementBrut) },
                { label: "Return on equity", value: formatPct(stats.rendementEquity), highlight: true },
                { label: "Overall LTV", value: formatPct(stats.ltvGlobal), warning: stats.ltvGlobal > 0.75 },
              ]}
            />

            {/* Breakdown */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-navy mb-3">Breakdown by type</h3>
              <div className="space-y-2">
                {Object.entries(stats.parType).map(([type, data]) => (
                  <div key={type} className="flex items-center justify-between text-sm">
                    <span className="text-slate">{type} ({data.count})</span>
                    <div className="text-right">
                      <span className="font-mono font-semibold">{formatEUR(data.valeur)}</span>
                      <span className="text-xs text-muted ml-2">({(data.valeur / stats.valeurTotale * 100).toFixed(0)}%)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Assets */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Assets ({assets.length})</h2>
              <button onClick={addAsset} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">+ Add</button>
            </div>

            {assets.map((asset, i) => (
              <div key={asset.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{asset.nom || `Asset ${i + 1}`}</span>
                  <button onClick={() => removeAsset(i)} className="text-xs text-error hover:underline">Remove</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-4">
                  <InputField label="Name" type="text" value={asset.nom} onChange={(v) => updateAsset(i, "nom", v)} />
                  <InputField label="Type" type="select" value={asset.type} onChange={(v) => updateAsset(i, "type", v)} options={[
                    { value: "Appartement", label: "Apartment" },
                    { value: "Maison", label: "House" },
                    { value: "Bureau", label: "Office" },
                    { value: "Commerce", label: "Retail" },
                    { value: "Logistique", label: "Logistics" },
                    { value: "Terrain", label: "Land" },
                    { value: "Autre", label: "Other" },
                  ]} />
                  <InputField label="Commune" type="text" value={asset.commune} onChange={(v) => updateAsset(i, "commune", v)} />
                  <InputField label="Area" value={asset.surface} onChange={(v) => updateAsset(i, "surface", v)} suffix="m²" />
                  <InputField label="Value" value={asset.valeur} onChange={(v) => updateAsset(i, "valeur", v)} suffix="€" />
                  <InputField label="Annual rent" value={asset.loyerAnnuel} onChange={(v) => updateAsset(i, "loyerAnnuel", v)} suffix="€" />
                  <InputField label="Debt" value={asset.dette} onChange={(v) => updateAsset(i, "dette", v)} suffix="€" />
                  <div className="flex items-end text-xs text-muted pb-2">
                    Yield: {asset.valeur > 0 ? formatPct(asset.loyerAnnuel / asset.valeur) : "—"}
                  </div>
                </div>
              </div>
            ))}

            {/* Summary table */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Asset</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Value</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Rent</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Gross yield</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">LTV</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">% of portfolio</th>
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id} className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 font-medium">{a.nom}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.valeur)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatEUR(a.loyerAnnuel)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{a.valeur > 0 ? formatPct(a.loyerAnnuel / a.valeur) : "—"}</td>
                      <td className={`px-3 py-1.5 text-right font-mono ${a.valeur > 0 && a.dette / a.valeur > 0.75 ? "text-error" : ""}`}>
                        {a.valeur > 0 ? formatPct(a.dette / a.valeur) : "—"}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">
                        {stats.valeurTotale > 0 ? `${(a.valeur / stats.valeurTotale * 100).toFixed(0)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
