"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { calculerImpact, type ImpactResponse, type ClasseImpact } from "@/lib/energy-api";
import { downloadImpactPdf, PdfButton } from "@/components/energy/EnergyPdf";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;

const IMPACT_ENERGIE: Record<string, number> = {
  A: 8, B: 5, C: 2, D: 0, E: -3, F: -7, G: -12, H: -18, I: -25,
};

const CONSO_PAR_CLASSE: Record<string, number> = { A: 35, B: 60, C: 93, D: 130, E: 180, F: 255, G: 350, H: 450, I: 550 };
const CO2_FACTEUR = 300; // g CO₂/kWh mix luxembourgeois

const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

function fmt(n: number): string {
  return n.toLocaleString("fr-LU", { maximumFractionDigits: 0 });
}

function fallbackLocal(valeur: number, classeActuelle: string): ImpactResponse {
  const pctActuelle = IMPACT_ENERGIE[classeActuelle] || 0;
  const valeurBase = valeur / (1 + pctActuelle / 100);
  const classes: ClasseImpact[] = CLASSES.map((c) => {
    const pct = IMPACT_ENERGIE[c];
    const valeurAjustee = Math.round(valeurBase * (1 + pct / 100));
    return { classe: c, ajustementPct: pct, valeurAjustee, delta: valeurAjustee - valeur };
  });
  return { valeurBase: Math.round(valeurBase), classeActuelle, classes,
    methodologie: "Green premium / brown discount basé sur les écarts de prix observés par classe énergétique au Luxembourg.",
    sources: ["Observatoire de l'Habitat 2025", "ECB Climate Risk Assessment"] };
}

export default function ImpactPage() {
  const t = useTranslations("energy.impact");
  const [valeur, setValeur] = useState(750000);
  const [classeActuelle, setClasseActuelle] = useState("D");
  const [result, setResult] = useState<ImpactResponse>(fallbackLocal(750000, "D"));
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (apiOk !== null) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [apiOk]);

  const compute = useCallback(async (v: number, c: string) => {
    try {
      const data = await calculerImpact({ valeurBien: v, classeActuelle: c });
      setResult(data);
      setApiOk(true);
    } catch {
      setResult(fallbackLocal(v, c));
      setApiOk(false);
    }
  }, []);

  useEffect(() => { compute(valeur, classeActuelle); }, [valeur, classeActuelle, compute]);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("description")}</p>
          {apiOk === null && (
            <div className="mt-3 flex items-center gap-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 shrink-0" />
              <div>
                <span className="font-medium">{t("apiConnecting")}</span>
                {elapsed > 3 && <span className="ml-2 text-blue-500 tabular-nums">({elapsed}s)</span>}
              </div>
            </div>
          )}
          {apiOk === false && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              {t("localFallback")}
            </div>
          )}
          {apiOk === true && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-energy bg-energy/5 border border-energy/20 rounded-lg px-3 py-1">
              {t("apiConnected")}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("valeurBien")}</label>
              <div className="relative">
                <input type="number" value={valeur} onChange={(e) => setValeur(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-10 text-foreground" min={50000} step={10000} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("classeActuelle")}</label>
              <div className="flex gap-1.5">
                {CLASSES.map((c) => (
                  <button key={c} onClick={() => setClasseActuelle(c)}
                    className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                      classeActuelle === c ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>{c}</button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">{t("resultTitle")}</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-card-border text-left">
                  <th className="px-6 py-3 font-medium text-muted">{t("classe")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("ajustement")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("valeurAjustee")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">{t("delta")}</th>
                  <th className="px-6 py-3 font-medium text-muted text-right">CO₂ (kg/m²/an)</th>
                </tr>
              </thead>
              <tbody>
                {result.classes.map((c) => {
                  const isActive = c.classe === classeActuelle;
                  return (
                    <tr key={c.classe} className={`border-b border-card-border last:border-0 transition-colors ${isActive ? "bg-energy/10" : "hover:bg-gray-50"}`}>
                      <td className="px-6 py-3">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${CLASS_COLORS[c.classe]}`}>{c.classe}</span>
                        {isActive && <span className="ml-2 text-xs text-energy font-medium">{t("actuelle")}</span>}
                      </td>
                      <td className="px-6 py-3 text-right font-mono">
                        <span className={c.ajustementPct > 0 ? "text-green-600" : c.ajustementPct < 0 ? "text-red-600" : "text-muted"}>
                          {c.ajustementPct > 0 ? "+" : ""}{c.ajustementPct}%
                        </span>
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-semibold">{fmt(c.valeurAjustee)} €</td>
                      <td className="px-6 py-3 text-right font-mono">
                        {c.delta === 0 ? <span className="text-muted">—</span> : (
                          <span className={c.delta > 0 ? "text-green-600" : "text-red-600"}>
                            {c.delta > 0 ? "+" : ""}{fmt(c.delta)} €
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-3 text-right font-mono text-muted">
                        {Math.round((CONSO_PAR_CLASSE[c.classe] || 130) * 0.75 * CO2_FACTEUR / 1000)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-3 bg-gray-50 flex items-center justify-between">
            <span className="text-xs text-muted">{t("classeRef")} · {t("source")}</span>
            <PdfButton onClick={() => downloadImpactPdf(result, classeActuelle, valeur)} label="Télécharger PDF" />
          </div>
        </div>

        {/* Graphique barres horizontales */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">{t("chartTitle")}</h2>
          </div>
          <div className="p-6 space-y-2">
            {result.classes.map((c) => {
              const maxAbs = Math.max(...result.classes.map((x) => Math.abs(x.ajustementPct)));
              const pct = maxAbs > 0 ? (c.ajustementPct / maxAbs) * 50 : 0;
              const isActive = c.classe === classeActuelle;
              return (
                <div key={c.classe} className={`flex items-center gap-3 rounded-lg px-3 py-1.5 ${isActive ? "bg-energy/10" : ""}`}>
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold shrink-0 ${CLASS_COLORS[c.classe]}`}>{c.classe}</span>
                  <div className="flex-1 flex items-center h-6">
                    <div className="w-full relative h-full">
                      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gray-300" />
                      {c.ajustementPct >= 0 ? (
                        <div className="absolute left-1/2 top-1 bottom-1 bg-green-500 rounded-r" style={{ width: `${pct}%` }} />
                      ) : (
                        <div className="absolute right-1/2 top-1 bottom-1 bg-red-500 rounded-l" style={{ width: `${Math.abs(pct)}%` }} />
                      )}
                    </div>
                  </div>
                  <span className={`text-xs font-mono w-12 text-right shrink-0 ${c.ajustementPct > 0 ? "text-green-600" : c.ajustementPct < 0 ? "text-red-600" : "text-muted"}`}>
                    {c.ajustementPct > 0 ? "+" : ""}{c.ajustementPct}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        {/* Explication green premium / brown discount */}
        <div className="mt-6 rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">{t("explainTitle")}</h2>
          </div>
          <div className="p-6 space-y-4 text-sm text-muted leading-relaxed">
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("explainGreenTitle")}</h3>
              <p>{t("explainGreenText")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("explainBrownTitle")}</h3>
              <p>{t("explainBrownText")}</p>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">{t("explainMethodTitle")}</h3>
              <p>{t("explainMethodText")}</p>
            </div>
            <div className="border-t border-card-border pt-3">
              <h3 className="font-semibold text-foreground mb-1">{t("explainSourcesTitle")}</h3>
              <ul className="list-disc list-inside space-y-0.5 text-xs">
                <li>{t("explainSource1")}</li>
                <li>{t("explainSource2")}</li>
                <li>{t("explainSource3")}</li>
                <li>{t("explainSource4")}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
