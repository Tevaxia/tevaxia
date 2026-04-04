"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { calculerRenovation, type RenovationResponse } from "@/lib/energy-api";
import { estimerCoutsRenovation } from "@/lib/renovation-costs";
import { downloadRenovationPdf, PdfButton } from "@/components/energy/EnergyPdf";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
const IMPACT_ENERGIE: Record<string, number> = { A: 8, B: 5, C: 2, D: 0, E: -3, F: -7, G: -12, H: -18, I: -25 };
const CONSO_PAR_CLASSE: Record<string, number> = { A: 35, B: 60, C: 93, D: 130, E: 180, F: 255, G: 350, H: 450, I: 550 };
const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white", B: "bg-green-500 text-white", C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900", E: "bg-orange-400 text-white", F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white", H: "bg-red-700 text-white", I: "bg-red-900 text-white",
};

function fmt(n: number): string { return n.toLocaleString("fr-LU", { maximumFractionDigits: 0 }); }

const CO2_FACTEUR = 300; // g CO₂/kWh mix luxembourgeois

function fallbackLocal(ca: string, cc: string, surface: number, annee: number, valeur: number, prixEnergie = 0.12): RenovationResponse | null {
  if (CLASSES.indexOf(cc as typeof CLASSES[number]) >= CLASSES.indexOf(ca as typeof CLASSES[number])) return null;
  const est = estimerCoutsRenovation(ca, cc, surface, annee);
  if (est.postes.length === 0) return null;
  const gainPct = (IMPACT_ENERGIE[cc] || 0) - (IMPACT_ENERGIE[ca] || 0);
  const gainValeur = Math.round(valeur * (gainPct / 100));
  const saut = CLASSES.indexOf(ca as typeof CLASSES[number]) - CLASSES.indexOf(cc as typeof CLASSES[number]);
  const tauxKB = saut >= 4 ? 0.625 : saut === 3 ? 0.50 : saut === 2 ? 0.375 : 0.25;
  const montantKB = Math.round(est.totalMoyen * tauxKB);
  const subvConseil = 1500;
  const totalAides = montantKB + subvConseil;
  const resteACharge = Math.max(est.totalAvecHonoraires - totalAides, 0);
  const roi = resteACharge > 0 ? Math.round((gainValeur * 100 / resteACharge) * 10) / 10 : 0;
  const consoAct = CONSO_PAR_CLASSE[ca] || 130;
  const consoCib = CONSO_PAR_CLASSE[cc] || 130;
  const ecoKwh = Math.round((consoAct - consoCib) * 0.75 * surface);
  const ecoEur = Math.round(ecoKwh * prixEnergie);
  const payback = ecoEur > 0 ? Math.round(resteACharge * 10 / ecoEur) / 10 : 99;
  return {
    sautClasse: `${ca} → ${cc}`, postes: est.postes.map((p) => ({ label: p.label, coutMin: p.coutMin, coutMax: p.coutMax, coutMoyen: p.coutMoyen })),
    totalMin: est.totalMin, totalMax: est.totalMax, totalMoyen: est.totalMoyen,
    honoraires: est.honoraires, totalProjet: est.totalAvecHonoraires, dureeEstimeeMois: est.dureeEstimeeMois,
    gainValeur, gainValeurPct: Math.round(gainPct * 10) / 10, roiPct: roi,
    klimabonus: { sautClasses: saut, taux: tauxKB, montant: montantKB, description: `Saut ${ca} → ${cc} (${saut} classes) : ${tauxKB * 100}% des travaux subventionnés` },
    klimapret: (() => { const m = Math.min(resteACharge, 100000); const r = 0.015 / 12; const mens = m > 0 ? Math.round(m * r / (1 - Math.pow(1 + r, -180))) : 0; return { montantMax: m, taux: 0.015, dureeMois: 180, mensualite: mens }; })(),
    subventionConseil: subvConseil, totalAides, resteACharge,
    economieAnnuelleKwh: ecoKwh, economieAnnuelleEur: ecoEur,
    paybackAnnees: payback,
    van20ans: (() => { let v = -resteACharge; for (let a = 1; a <= 20; a++) { v += ecoEur * Math.pow(1.03, a) / Math.pow(1.03, a); } return Math.round(v); })(),
    triPct: ecoEur > 0 && resteACharge > 0 ? Math.round((ecoEur / resteACharge) * 1000) / 10 : 0,
  };
}

export default function RenovationPage() {
  const t = useTranslations("energy.renovation");
  const [classeActuelle, setClasseActuelle] = useState<typeof CLASSES[number]>("F");
  const [classeCible, setClasseCible] = useState<typeof CLASSES[number]>("B");
  const [surface, setSurface] = useState(120);
  const [annee, setAnnee] = useState(1975);
  const [valeur, setValeur] = useState(650000);
  const [prixEnergie, setPrixEnergie] = useState(0.12);
  const [modeCopro, setModeCopro] = useState(false);
  const [nbLots, setNbLots] = useState(10);
  const [result, setResult] = useState<RenovationResponse | null>(null);
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (apiOk !== null) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [apiOk]);

  const compute = useCallback(async (ca: string, cc: string, s: number, a: number, v: number, px: number) => {
    if (CLASSES.indexOf(cc as typeof CLASSES[number]) >= CLASSES.indexOf(ca as typeof CLASSES[number])) { setResult(null); return; }
    try {
      const data = await calculerRenovation({ classeActuelle: ca, classeCible: cc, surface: s, anneeConstruction: a, valeurBien: v, prixEnergieKwh: px });
      setResult(data); setApiOk(true);
    } catch { setResult(fallbackLocal(ca, cc, s, a, v, px)); setApiOk(false); }
  }, []);

  useEffect(() => { compute(classeActuelle, classeCible, surface, annee, valeur, prixEnergie); },
    [classeActuelle, classeCible, surface, annee, valeur, prixEnergie, compute]);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
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
          {apiOk === false && <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">{t("localFallback")}</div>}
          {apiOk === true && <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-energy bg-energy/5 border border-energy/20 rounded-lg px-3 py-1">{t("apiConnected")}</div>}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("classeActuelle")}</label>
              <div className="flex gap-1">
                {CLASSES.map((c) => (
                  <button key={c} onClick={() => { setClasseActuelle(c); if (CLASSES.indexOf(classeCible) >= CLASSES.indexOf(c)) setClasseCible(CLASSES[Math.max(0, CLASSES.indexOf(c) - 2)]); }}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${classeActuelle === c ? `${CLASS_COLORS[c]} ring-2 ring-offset-1 ring-energy` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{c}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("classeCible")}</label>
              <div className="flex gap-1">
                {CLASSES.map((c) => {
                  const disabled = CLASSES.indexOf(c) >= CLASSES.indexOf(classeActuelle);
                  return (<button key={c} onClick={() => !disabled && setClasseCible(c)} disabled={disabled}
                    className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${disabled ? "bg-gray-50 text-gray-300 cursor-not-allowed" : classeCible === c ? `${CLASS_COLORS[c]} ring-2 ring-offset-1 ring-energy` : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>{c}</button>);
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("surface")}</label>
              <input type="number" value={surface} onChange={(e) => setSurface(Number(e.target.value))} className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={20} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("anneeConstruction")}</label>
              <input type="number" value={annee} onChange={(e) => setAnnee(Number(e.target.value))} className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={1800} max={2025} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("valeurBien")}</label>
              <div className="relative">
                <input type="number" value={valeur} onChange={(e) => setValeur(Number(e.target.value))} className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-10 text-foreground" min={50000} step={10000} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-sm">€</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Prix énergie (€/kWh)</label>
              <input type="number" value={prixEnergie} onChange={(e) => setPrixEnergie(Number(e.target.value))} className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={0.05} max={0.50} step={0.01} />
              <p className="text-xs text-muted mt-0.5">Tarif moyen LU 2025 : 0,12 €/kWh</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-card-border flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={modeCopro} onChange={(e) => setModeCopro(e.target.checked)} className="rounded border-input-border text-energy focus:ring-energy" />
              <span className="text-sm font-medium text-foreground">Mode copropriété</span>
            </label>
            {modeCopro && (
              <div className="flex items-center gap-2">
                <label className="text-sm text-muted">Nombre de lots :</label>
                <input type="number" value={nbLots} onChange={(e) => setNbLots(Math.max(2, Number(e.target.value)))} className="w-20 rounded-lg border border-input-border bg-input-bg px-3 py-1.5 text-sm text-foreground" min={2} max={200} />
              </div>
            )}
          </div>
        </div>

        {result && result.postes.length > 0 && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-foreground">{t("resultTitle")}</h2>
                  <p className="text-xs text-muted mt-0.5">{result.sautClasse} · {surface} m² · {annee}</p>
                </div>
                <PdfButton onClick={() => downloadRenovationPdf(result, { classeActuelle, classeCible, surface, anneeConstruction: annee, valeurBien: valeur })} label="PDF" />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-card-border text-left">
                    <th className="px-6 py-3 font-medium text-muted">{t("poste")}</th>
                    <th className="px-6 py-3 font-medium text-muted text-right">{t("coutMin")}</th>
                    <th className="px-6 py-3 font-medium text-muted text-right">{t("coutMax")}</th>
                    <th className="px-6 py-3 font-medium text-muted text-right">{t("coutMoyen")}</th>
                  </tr></thead>
                  <tbody>
                    {result.postes.map((p) => (
                      <tr key={p.label} className="border-b border-card-border last:border-0 hover:bg-gray-50">
                        <td className="px-6 py-3 text-foreground">{p.label}</td>
                        <td className="px-6 py-3 text-right font-mono text-muted">{fmt(p.coutMin)} €</td>
                        <td className="px-6 py-3 text-right font-mono text-muted">{fmt(p.coutMax)} €</td>
                        <td className="px-6 py-3 text-right font-mono font-semibold">{fmt(p.coutMoyen)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="text-xs text-muted uppercase tracking-wider">{t("totalProjet")}</div>
                <div className="mt-1 text-2xl font-bold text-foreground">{fmt(result.totalProjet)} €</div>
                <div className="mt-1 text-xs text-muted">{t("totalTravaux")} : {fmt(result.totalMoyen)} € + {t("honoraires")} : {fmt(result.honoraires)} €</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="text-xs text-muted uppercase tracking-wider">{t("duree")}</div>
                <div className="mt-1 text-2xl font-bold text-foreground">{result.dureeEstimeeMois} {t("mois")}</div>
                <div className="mt-1 text-xs text-muted">{result.postes.length} {t("postesDeTravaux")}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="text-xs text-muted uppercase tracking-wider">{t("gainValeur")}</div>
                <div className={`mt-1 text-2xl font-bold ${result.gainValeur > 0 ? "text-green-600" : "text-red-600"}`}>
                  {result.gainValeur > 0 ? "+" : ""}{fmt(result.gainValeur)} €
                </div>
                <div className="mt-1 text-xs text-muted">{result.gainValeurPct > 0 ? "+" : ""}{result.gainValeurPct}% {t("deValeur")}</div>
              </div>
              <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="text-xs text-muted uppercase tracking-wider">{t("roi")}</div>
                <div className={`mt-1 text-2xl font-bold ${result.roiPct > 100 ? "text-green-600" : result.roiPct > 50 ? "text-yellow-600" : "text-red-600"}`}>{result.roiPct}%</div>
                <div className="mt-1 text-xs text-muted">{result.roiPct >= 100 ? t("roiRentable") : result.roiPct >= 50 ? t("roiPartiel") : t("roiNegatif")}</div>
                <div className="mt-0.5 text-xs text-muted/70">{t("roiDesc")}</div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-gradient-to-r from-energy/5 to-transparent p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted">{t("fourchetteTravaux")}</span>
                <span className="font-mono font-semibold text-foreground">{fmt(result.totalMin)} € — {fmt(result.totalMax)} €</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-gray-200 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-energy to-energy-light rounded-full"
                  style={{ width: `${result.totalMax > result.totalMin ? ((result.totalMoyen - result.totalMin) / (result.totalMax - result.totalMin)) * 100 : 50}%` }} />
              </div>
              <div className="mt-1 flex justify-between text-xs text-muted">
                <span>{t("min")} : {fmt(result.totalMin)} €</span>
                <span>{t("max")} : {fmt(result.totalMax)} €</span>
              </div>
            </div>

            {/* Aides & subventions */}
            {result.klimabonus && (
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-green-500/5 to-transparent">
                  <h2 className="font-semibold text-foreground">{t("aidesTitle")}</h2>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-green-800">{t("klimabonus")}</span>
                        <span className="text-xs bg-green-600 text-white rounded-full px-2 py-0.5">{(result.klimabonus.taux * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-2xl font-bold text-green-700">{fmt(result.klimabonus.montant)} €</div>
                      <div className="text-xs text-green-600 mt-1">{result.klimabonus.description}</div>
                    </div>
                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-blue-800">{t("klimapret")}</span>
                        <span className="text-xs bg-blue-600 text-white rounded-full px-2 py-0.5">{(result.klimapret.taux * 100).toFixed(1)}%</span>
                      </div>
                      <div className="text-2xl font-bold text-blue-700">{fmt(result.klimapret.montantMax)} €</div>
                      <div className="text-xs text-blue-600 mt-1">
                        {t("klimapretDuree")} : {result.klimapret.dureeMois / 12} ans · {t("klimapretTaux")} : {(result.klimapret.taux * 100).toFixed(1)}%
                        {result.klimapret.mensualite > 0 && <> · {t("klimapretMensualite")} : {fmt(result.klimapret.mensualite)} €/mois</>}
                      </div>
                    </div>
                  </div>
                  {/* Avantage Klimaprêt */}
                  {result.klimapret.montantMax > 0 && result.klimapret.mensualite > 0 && (() => {
                    const tauxMarche = 0.04;
                    const m = result.klimapret.montantMax;
                    const d = result.klimapret.dureeMois;
                    const rMarche = tauxMarche / 12;
                    const mensMarche = Math.round(m * rMarche / (1 - Math.pow(1 + rMarche, -d)));
                    const ecoInterets = (mensMarche - result.klimapret.mensualite) * d;
                    return (
                      <div className="rounded-xl border border-purple-200 bg-purple-50 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-purple-800">{t("klimapretAvantage")}</span>
                          <span className="text-xs bg-purple-600 text-white rounded-full px-2 py-0.5">{t("klimapretVsMarche", { taux: String((tauxMarche * 100).toFixed(1)) })}</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-700">{fmt(ecoInterets)} €</div>
                        <div className="text-xs text-purple-600 mt-1">{t("klimapretEcoDesc", { mens: String(fmt(result.klimapret.mensualite)), mensMarche: String(fmt(mensMarche)) })}</div>
                        <div className="text-xs text-purple-600 mt-1 font-medium">{t("klimapretZeroCash")}</div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center gap-2 text-sm text-muted">
                    <span>{t("subventionConseil")} : {fmt(result.subventionConseil)} €</span>
                  </div>
                  <div className="flex items-center justify-between border-t border-card-border pt-3">
                    <div>
                      <div className="text-sm text-muted">{t("totalAides")}</div>
                      <div className="text-lg font-bold text-green-600">{fmt(result.totalAides)} €</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted">{t("resteACharge")}</div>
                      <div className="text-lg font-bold text-foreground">{fmt(result.resteACharge)} €</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Comparaison avant / après */}
            <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                <h2 className="font-semibold text-foreground">Comparaison avant / après rénovation</h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[{ label: "Avant", classe: classeActuelle }, { label: "Après", classe: classeCible }].map((side) => {
                    const conso = (CONSO_PAR_CLASSE[side.classe] || 130) * 0.75 * surface;
                    const co2 = Math.round(conso * CO2_FACTEUR / 1000);
                    const val = Math.round(valeur * (1 + (IMPACT_ENERGIE[side.classe] || 0) / 100));
                    return (
                      <div key={side.label} className={`rounded-xl border p-5 ${side.label === "Après" ? "border-energy/30 bg-energy/5" : "border-card-border bg-gray-50"}`}>
                        <div className="flex items-center gap-3 mb-4">
                          <span className={`inline-flex items-center justify-center w-10 h-10 rounded-xl text-lg font-bold ${CLASS_COLORS[side.classe]}`}>{side.classe}</span>
                          <div>
                            <div className="text-sm font-semibold text-foreground">{side.label} rénovation</div>
                            <div className="text-xs text-muted">Classe {side.classe}</div>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between"><span className="text-muted">Valeur estimée</span><span className="font-mono font-semibold">{fmt(val)} €</span></div>
                          <div className="flex justify-between"><span className="text-muted">Consommation</span><span className="font-mono">{fmt(Math.round(conso))} kWh/an</span></div>
                          <div className="flex justify-between"><span className="text-muted">CO₂</span><span className="font-mono">{fmt(co2)} kg/an</span></div>
                          <div className="flex justify-between"><span className="text-muted">Coût énergie</span><span className="font-mono">{fmt(Math.round(conso * prixEnergie))} €/an</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {(() => {
                  const consoAvant = (CONSO_PAR_CLASSE[classeActuelle] || 130) * 0.75 * surface;
                  const consoApres = (CONSO_PAR_CLASSE[classeCible] || 130) * 0.75 * surface;
                  const ecoCO2 = Math.round((consoAvant - consoApres) * CO2_FACTEUR / 1000);
                  const ecoEnergie = Math.round((consoAvant - consoApres) * prixEnergie);
                  return (
                    <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-card-border">
                      <div className="text-center"><div className="text-lg font-bold text-green-600">-{fmt(Math.round(consoAvant - consoApres))} kWh</div><div className="text-xs text-muted">Énergie économisée / an</div></div>
                      <div className="text-center"><div className="text-lg font-bold text-green-600">-{fmt(ecoCO2)} kg CO₂</div><div className="text-xs text-muted">Émissions évitées / an</div></div>
                      <div className="text-center"><div className="text-lg font-bold text-green-600">-{fmt(ecoEnergie)} €</div><div className="text-xs text-muted">Facture énergie / an</div></div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Rentabilité */}
            {result.economieAnnuelleKwh > 0 && (
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-amber-500/5 to-transparent">
                  <h2 className="font-semibold text-foreground">{t("rentabiliteTitle")}</h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">{t("economieAnnuelle")}</div>
                      <div className="mt-1 text-2xl font-bold text-energy">{fmt(result.economieAnnuelleEur)} €</div>
                      <div className="text-xs text-muted mt-0.5">{fmt(result.economieAnnuelleKwh)} kWh {t("economieKwh")}</div>
                    </div>
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">CO₂ évité</div>
                      <div className="mt-1 text-2xl font-bold text-energy">{fmt(Math.round(result.economieAnnuelleKwh * CO2_FACTEUR / 1000))} kg/an</div>
                      <div className="text-xs text-muted mt-0.5">{(result.economieAnnuelleKwh * CO2_FACTEUR / 1000000).toFixed(1)} tonnes/an</div>
                    </div>
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">{t("payback")}</div>
                      <div className={`mt-1 text-2xl font-bold ${result.paybackAnnees < 15 ? "text-green-600" : result.paybackAnnees < 25 ? "text-amber-600" : "text-red-600"}`}>
                        {result.paybackAnnees} {t("paybackAnnees")}
                      </div>
                      <div className="text-xs text-muted mt-0.5">{t("resteACharge")} / {t("economieAnnuelle").toLowerCase()}</div>
                    </div>
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">{t("van")}</div>
                      <div className={`mt-1 text-2xl font-bold ${result.van20ans > 0 ? "text-green-600" : "text-red-600"}`}>
                        {result.van20ans > 0 ? "+" : ""}{fmt(result.van20ans)} €
                      </div>
                      <div className="text-xs text-muted mt-0.5">{t("vanDesc")}</div>
                    </div>
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">{t("tri")}</div>
                      <div className={`mt-1 text-2xl font-bold ${result.triPct > 5 ? "text-green-600" : result.triPct > 0 ? "text-amber-600" : "text-red-600"}`}>
                        {result.triPct}%
                      </div>
                      <div className="text-xs text-muted mt-0.5">{t("triDesc")}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mode copropriété */}
            {modeCopro && result && (
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-indigo-500/5 to-transparent">
                  <h2 className="font-semibold text-foreground">Répartition copropriété — {nbLots} lots</h2>
                </div>
                <div className="p-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-center">
                      <div className="text-xs text-indigo-600 uppercase tracking-wider">Coût total / lot</div>
                      <div className="mt-1 text-2xl font-bold text-indigo-700">{fmt(Math.round(result.totalProjet / nbLots))} €</div>
                      <div className="text-xs text-indigo-500 mt-0.5">Quote-part moyenne</div>
                    </div>
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
                      <div className="text-xs text-green-600 uppercase tracking-wider">Aides / lot</div>
                      <div className="mt-1 text-2xl font-bold text-green-700">{fmt(Math.round(result.totalAides / nbLots))} €</div>
                      <div className="text-xs text-green-500 mt-0.5">Klimabonus + conseil</div>
                    </div>
                    <div className="rounded-xl border border-card-border p-4 text-center">
                      <div className="text-xs text-muted uppercase tracking-wider">Reste / lot</div>
                      <div className="mt-1 text-2xl font-bold text-foreground">{fmt(Math.round(result.resteACharge / nbLots))} €</div>
                      <div className="text-xs text-muted mt-0.5">Après aides</div>
                    </div>
                    {result.klimapret.mensualite > 0 && (
                      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-center">
                        <div className="text-xs text-blue-600 uppercase tracking-wider">Mensualité / lot</div>
                        <div className="mt-1 text-2xl font-bold text-blue-700">{fmt(Math.round(result.klimapret.mensualite / nbLots))} €/mois</div>
                        <div className="text-xs text-blue-500 mt-0.5">Klimaprêt 1,5%</div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200">
                    <h3 className="text-sm font-semibold text-indigo-800 mb-2">Synthèse pour AG de copropriété</h3>
                    <ul className="text-xs text-indigo-700 space-y-1">
                      <li>Rénovation {result.sautClasse} · {surface} m² · {result.postes.length} postes de travaux</li>
                      <li>Coût total projet : {fmt(result.totalProjet)} € soit {fmt(Math.round(result.totalProjet / nbLots))} € par lot ({nbLots} lots)</li>
                      <li>Subventions Klimabonus : {fmt(result.klimabonus.montant)} € ({(result.klimabonus.taux * 100).toFixed(0)}%) + conseil : {fmt(result.subventionConseil)} €</li>
                      <li>Reste à charge : {fmt(result.resteACharge)} € soit {fmt(Math.round(result.resteACharge / nbLots))} € par lot</li>
                      <li>Gain de valeur estimé : +{fmt(result.gainValeur)} € ({result.gainValeurPct > 0 ? "+" : ""}{result.gainValeurPct}%)</li>
                      <li>Économie énergie : {fmt(result.economieAnnuelleEur)} €/an soit {fmt(Math.round(result.economieAnnuelleEur / nbLots))} € par lot et par an</li>
                      <li>CO₂ évité : {fmt(Math.round(result.economieAnnuelleKwh * CO2_FACTEUR / 1000))} kg/an</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {result && result.postes.length === 0 && (
          <div className="rounded-2xl border border-card-border bg-card p-8 text-center text-muted">{t("aucunPoste")}</div>
        )}
      </div>
    </div>
  );
}
