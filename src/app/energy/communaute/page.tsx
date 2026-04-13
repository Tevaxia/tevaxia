"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { calculerCommunaute, type CommunauteResponse } from "@/lib/energy-api";
import { generateCommunautePdfBlob, PdfButton } from "@/components/energy/EnergyPdf";
import {
  fetchPVGISProduction,
  estimateProduction,
  getCommuneCoords,
  orientationToAzimuth,
  orientationToTilt,
  type PVGISResult,
} from "@/lib/pvgis";
import { COMMUNE_COORDS } from "@/lib/communes-coords";

const PRODUCTION_KWH_PAR_KWC = 950;
const TAUX_AUTOCONSO_BASE = 0.40;
const FACTEUR_FOISONNEMENT = 0.025;
const TARIF_RACHAT_SURPLUS = 0.07;
const CO2_FACTEUR = 300;

const ORIENTATION_OPTIONS = [
  { value: "SUD", label: "Sud (0°)" },
  { value: "SUD_EST", label: "Sud-Est (-45°)" },
  { value: "SUD_OUEST", label: "Sud-Ouest (45°)" },
  { value: "EST", label: "Est (-90°)" },
  { value: "OUEST", label: "Ouest (90°)" },
  { value: "EST_OUEST", label: "Est-Ouest (bi)" },
  { value: "PLAT", label: "Toit plat" },
  { value: "NORD", label: "Nord (180°)" },
] as const;

function fallbackLocal(nb: number, pv: number, conso: number, tr: number, tp: number): CommunauteResponse {
  const productionAnnuelle = Math.round(pv * PRODUCTION_KWH_PAR_KWC);
  const consoTotale = Math.round(nb * conso);
  const tauxAutoConso = Math.min(0.85, TAUX_AUTOCONSO_BASE + (nb - 1) * FACTEUR_FOISONNEMENT);
  const energieDisponible = Math.min(productionAnnuelle, consoTotale);
  const energieAutoconsommee = Math.round(energieDisponible * tauxAutoConso);
  const surplus = productionAnnuelle - energieAutoconsommee;
  const econAutoC = energieAutoconsommee * (tr - tp);
  const revenuSurplus = surplus * TARIF_RACHAT_SURPLUS;
  const economieTotale = Math.round(econAutoC + revenuSurplus);
  const coutHTVA = Math.round(pv * 1200);
  const coutTVA = Math.round(coutHTVA * 0.17);
  const coutTTC = coutHTVA + coutTVA;
  const mois = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const repartMensuelle = [0.04,0.06,0.09,0.11,0.12,0.12,0.12,0.11,0.09,0.07,0.04,0.03];
  return {
    productionAnnuelle, consoTotale,
    tauxCouverturePct: consoTotale > 0 ? Math.round(productionAnnuelle * 1000 / consoTotale) / 10 : 0,
    tauxAutoConsoPct: Math.round(tauxAutoConso * 1000) / 10,
    energieAutoconsommee, surplus,
    economieTotale, economieParParticipant: Math.round(economieTotale / nb),
    revenuSurplus: Math.round(revenuSurplus),
    co2EviteKg: Math.round(energieAutoconsommee * CO2_FACTEUR / 1000),
    coutInstallationHTVA: coutHTVA, coutInstallationTVA: coutTVA, coutInstallationTTC: coutTTC,
    coutParParticipant: Math.round(coutTTC / nb),
    paybackGlobalAnnees: economieTotale > 0 ? Math.round(coutTTC * 10 / economieTotale) / 10 : 99,
    productionMensuelle: mois.map((m, i) => ({ mois: m, kwh: Math.round(productionAnnuelle * repartMensuelle[i]) })),
    parametres: { productionParKwc: PRODUCTION_KWH_PAR_KWC, tauxAutoConsoBase: TAUX_AUTOCONSO_BASE, facteurFoisonnement: FACTEUR_FOISONNEMENT, tarifRachatSurplus: TARIF_RACHAT_SURPLUS, co2Facteur: CO2_FACTEUR },
    conformite: { statutJuridique: "Copropriété, ASBL ou coopérative", perimetre: "Même poste de transformation ou < 1 km", contratRepartition: "Contrat de répartition entre participants requis", declarationILR: "Déclaration auprès de l'ILR obligatoire", loiReference: "Loi du 21 mai 2021 (transposition RED II)", reglementILR: "Règlement ILR E23/14" },
  };
}

function fmt(n: number, dec = 0): string { return n.toLocaleString("fr-LU", { maximumFractionDigits: dec }); }

export default function CommunautePage() {
  const t = useTranslations("energy.communaute");
  const [nbParticipants, setNbParticipants] = useState(6);
  const [puissancePV, setPuissancePV] = useState(30);
  const [consoMoyenne, setConsoMoyenne] = useState(4500);
  const [tarifReseau, setTarifReseau] = useState(0.28);
  const [tarifPartage, setTarifPartage] = useState(0.15);
  const [commune, setCommune] = useState("");
  const [orientation, setOrientation] = useState("SUD");
  const [inclinaison, setInclinaison] = useState(35);
  const [result, setResult] = useState<CommunauteResponse>(fallbackLocal(6, 30, 4500, 0.28, 0.15));
  const [apiOk, setApiOk] = useState<boolean | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [pvgisData, setPvgisData] = useState<PVGISResult | null>(null);
  const [pvgisLoading, setPvgisLoading] = useState(false);
  const [usePvgis, setUsePvgis] = useState(false);

  const communeNames = useMemo(() => Object.keys(COMMUNE_COORDS).sort(), []);

  useEffect(() => {
    if (apiOk !== null) return;
    const timer = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timer);
  }, [apiOk]);

  // Fetch PVGIS data when commune/orientation/tilt/power changes
  useEffect(() => {
    if (!commune) {
      setPvgisData(null);
      setUsePvgis(false);
      return;
    }
    const coords = getCommuneCoords(commune);
    if (!coords) {
      setPvgisData(null);
      setUsePvgis(false);
      return;
    }
    let cancelled = false;
    setPvgisLoading(true);
    const azimuth = orientationToAzimuth(orientation);
    const tilt = orientationToTilt(orientation, inclinaison);
    fetchPVGISProduction(coords[0], coords[1], puissancePV, azimuth, tilt).then(
      (data) => {
        if (cancelled) return;
        setPvgisLoading(false);
        if (data) {
          setPvgisData(data);
          setUsePvgis(true);
        } else {
          setPvgisData(null);
          setUsePvgis(false);
        }
      }
    );
    return () => { cancelled = true; };
  }, [commune, orientation, inclinaison, puissancePV]);

  const compute = useCallback(async (nb: number, pv: number, c: number, tr: number, tp: number, pvgis: PVGISResult | null, usePv: boolean) => {
    try {
      const data = await calculerCommunaute({ nbParticipants: nb, puissancePV: pv, consoMoyenneParParticipant: c, tarifReseau: tr, tarifPartage: tp });
      // If we have PVGIS data, override the production figures
      if (usePv && pvgis) {
        data.productionAnnuelle = pvgis.annualKwh;
        data.productionMensuelle = pvgis.monthlyKwh.map((m) => ({ mois: m.month, kwh: m.kwh }));
        data.parametres = { ...data.parametres, productionParKwc: Math.round(pvgis.annualKwh / pv) };
        // Recalculate derived values based on real production
        const consoTotale = nb * c;
        const tauxAutoConso = Math.min(0.85, TAUX_AUTOCONSO_BASE + (nb - 1) * FACTEUR_FOISONNEMENT);
        const energieDisponible = Math.min(pvgis.annualKwh, consoTotale);
        const energieAutoconsommee = Math.round(energieDisponible * tauxAutoConso);
        const surplus = pvgis.annualKwh - energieAutoconsommee;
        const econAutoC = energieAutoconsommee * (tr - tp);
        const revenuSurplus = surplus * TARIF_RACHAT_SURPLUS;
        const economieTotale = Math.round(econAutoC + revenuSurplus);
        data.consoTotale = consoTotale;
        data.tauxCouverturePct = consoTotale > 0 ? Math.round(pvgis.annualKwh * 1000 / consoTotale) / 10 : 0;
        data.tauxAutoConsoPct = Math.round(tauxAutoConso * 1000) / 10;
        data.energieAutoconsommee = energieAutoconsommee;
        data.surplus = surplus;
        data.economieTotale = economieTotale;
        data.economieParParticipant = Math.round(economieTotale / nb);
        data.revenuSurplus = Math.round(revenuSurplus);
        data.co2EviteKg = Math.round(energieAutoconsommee * CO2_FACTEUR / 1000);
        data.paybackGlobalAnnees = economieTotale > 0 ? Math.round(data.coutInstallationTTC * 10 / economieTotale) / 10 : 99;
      }
      setResult(data); setApiOk(true);
    } catch {
      const local = fallbackLocal(nb, pv, c, tr, tp);
      // Override local fallback with PVGIS data if available
      if (usePv && pvgis) {
        local.productionAnnuelle = pvgis.annualKwh;
        local.productionMensuelle = pvgis.monthlyKwh.map((m) => ({ mois: m.month, kwh: m.kwh }));
        local.parametres = { ...local.parametres, productionParKwc: Math.round(pvgis.annualKwh / pv) };
        const consoTotale = nb * c;
        const tauxAutoConso = Math.min(0.85, TAUX_AUTOCONSO_BASE + (nb - 1) * FACTEUR_FOISONNEMENT);
        const energieDisponible = Math.min(pvgis.annualKwh, consoTotale);
        const energieAutoconsommee = Math.round(energieDisponible * tauxAutoConso);
        const surplus = pvgis.annualKwh - energieAutoconsommee;
        const econAutoC = energieAutoconsommee * (tr - tp);
        const revenuSurplus = surplus * TARIF_RACHAT_SURPLUS;
        const economieTotale = Math.round(econAutoC + revenuSurplus);
        local.consoTotale = consoTotale;
        local.tauxCouverturePct = consoTotale > 0 ? Math.round(pvgis.annualKwh * 1000 / consoTotale) / 10 : 0;
        local.tauxAutoConsoPct = Math.round(tauxAutoConso * 1000) / 10;
        local.energieAutoconsommee = energieAutoconsommee;
        local.surplus = surplus;
        local.economieTotale = economieTotale;
        local.economieParParticipant = Math.round(economieTotale / nb);
        local.revenuSurplus = Math.round(revenuSurplus);
        local.co2EviteKg = Math.round(energieAutoconsommee * CO2_FACTEUR / 1000);
        local.paybackGlobalAnnees = economieTotale > 0 ? Math.round(local.coutInstallationTTC * 10 / economieTotale) / 10 : 99;
      }
      setResult(local); setApiOk(false);
    }
  }, []);

  useEffect(() => { compute(nbParticipants, puissancePV, consoMoyenne, tarifReseau, tarifPartage, pvgisData, usePvgis); },
    [nbParticipants, puissancePV, consoMoyenne, tarifReseau, tarifPartage, pvgisData, usePvgis, compute]);

  const params = result.parametres;

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
          {pvgisLoading && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-blue-600 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1">
              <div className="h-3 w-3 animate-spin rounded-full border-2 border-blue-300 border-t-blue-600 shrink-0" />
              {t("pvgisLoading")}
            </div>
          )}
          {!pvgisLoading && usePvgis && pvgisData && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></svg>
              {t("pvgisConnected")}
            </div>
          )}
          {!pvgisLoading && commune && !usePvgis && !pvgisLoading && (
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1">
              {t("pvgisFallback")}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("nbParticipants")}</label>
              <input type="number" value={nbParticipants} onChange={(e) => setNbParticipants(Math.max(2, Number(e.target.value)))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={2} max={50} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("puissancePV")}</label>
              <input type="number" value={puissancePV} onChange={(e) => setPuissancePV(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={1} max={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("consoMoyenne")}</label>
              <input type="number" value={consoMoyenne} onChange={(e) => setConsoMoyenne(Number(e.target.value))}
                className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 text-foreground" min={1000} max={20000} step={500} />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("tarifReseau")}</label>
              <div className="relative">
                <input type="number" value={tarifReseau} onChange={(e) => setTarifReseau(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-16 text-foreground" min={0.1} max={1} step={0.01} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">€/kWh</span>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">{t("tarifPartage")}</label>
              <div className="relative">
                <input type="number" value={tarifPartage} onChange={(e) => setTarifPartage(Number(e.target.value))}
                  className="w-full rounded-lg border border-input-border bg-input-bg px-4 py-2.5 pr-16 text-foreground" min={0.01} max={0.5} step={0.01} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted text-xs">€/kWh</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("productionAnnuelle")}</div>
              <div className="mt-1 text-2xl font-bold text-foreground">{fmt(result.productionAnnuelle)} kWh</div>
              <div className="mt-1 text-xs text-muted">{puissancePV} kWc × {params.productionParKwc} kWh/kWc</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("tauxAutoconso")}</div>
              <div className="mt-1 text-2xl font-bold text-energy">{result.tauxAutoConsoPct}%</div>
              <div className="mt-1 text-xs text-muted">{fmt(result.energieAutoconsommee)} kWh {t("autoconsommes")}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("economieTotale")}</div>
              <div className="mt-1 text-2xl font-bold text-green-600">{fmt(result.economieTotale)} €/an</div>
              <div className="mt-1 text-xs text-muted">{t("economieParticipant")} : {fmt(result.economieParParticipant)} €/an</div>
            </div>
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <div className="text-xs text-muted uppercase tracking-wider">{t("co2Evite")}</div>
              <div className="mt-1 text-2xl font-bold text-energy">{fmt(result.co2EviteKg)} kg/an</div>
              <div className="mt-1 text-xs text-muted">{(result.co2EviteKg / 1000).toFixed(1)} {t("tonnesCO2")}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
              <h2 className="font-semibold text-foreground">{t("resultTitle")}</h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{t("prodVsConso")}</span>
                  <span className="font-mono text-foreground">{fmt(result.productionAnnuelle)} / {fmt(result.consoTotale)} kWh</span>
                </div>
                <div className="h-4 rounded-full bg-gray-200 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-energy rounded-full" style={{ width: `${Math.min(100, result.tauxCouverturePct)}%` }} />
                </div>
                <div className="mt-1 text-xs text-muted">{t("couverture", { pct: String(result.tauxCouverturePct) })}</div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{t("autoVsSurplus")}</span>
                  <span className="font-mono text-foreground">{fmt(result.energieAutoconsommee)} / {fmt(result.surplus)} kWh</span>
                </div>
                <div className="h-4 rounded-full bg-amber-200 overflow-hidden relative">
                  <div className="absolute inset-y-0 left-0 bg-energy rounded-full" style={{ width: `${result.tauxAutoConsoPct}%` }} />
                </div>
                <div className="mt-1 flex justify-between text-xs text-muted">
                  <span>{t("autoconsomme", { pct: String(result.tauxAutoConsoPct) })}</span>
                  <span>{t("surplusRevendu")} : {fmt(result.revenuSurplus)} €/an</span>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-card-border">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("economieAutoconso")}</span>
                    <span className="font-mono font-semibold">{fmt(result.economieTotale - result.revenuSurplus)} €/an</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("revenuSurplusReseau")}</span>
                    <span className="font-mono font-semibold">{fmt(result.revenuSurplus)} €/an</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Investissement & payback */}
          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-amber-500/5 to-transparent">
              <h2 className="font-semibold text-foreground">{t("investTitle")}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-xl border border-card-border p-4 text-center">
                  <div className="text-xs text-muted uppercase tracking-wider">{t("coutHTVA")}</div>
                  <div className="mt-1 text-xl font-bold text-foreground">{fmt(result.coutInstallationHTVA)} €</div>
                </div>
                <div className="rounded-xl border border-card-border p-4 text-center">
                  <div className="text-xs text-muted uppercase tracking-wider">{t("tva")}</div>
                  <div className="mt-1 text-xl font-bold text-foreground">{fmt(result.coutInstallationTVA)} €</div>
                </div>
                <div className="rounded-xl border border-card-border p-4 text-center bg-amber-50">
                  <div className="text-xs text-amber-700 uppercase tracking-wider">{t("coutTTC")}</div>
                  <div className="mt-1 text-xl font-bold text-amber-700">{fmt(result.coutInstallationTTC)} €</div>
                </div>
                <div className="rounded-xl border border-card-border p-4 text-center">
                  <div className="text-xs text-muted uppercase tracking-wider">{t("coutParPart")}</div>
                  <div className="mt-1 text-xl font-bold text-foreground">{fmt(result.coutParParticipant)} €</div>
                  <div className="text-xs text-muted">/ {nbParticipants} participants</div>
                </div>
                <div className="rounded-xl border border-card-border p-4 text-center">
                  <div className="text-xs text-muted uppercase tracking-wider">{t("payback")}</div>
                  <div className={`mt-1 text-xl font-bold ${result.paybackGlobalAnnees < 15 ? "text-green-600" : result.paybackGlobalAnnees < 25 ? "text-amber-600" : "text-red-600"}`}>
                    {result.paybackGlobalAnnees} {t("annees")}
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted">{t("coutBase")}</div>
            </div>
          </div>

          {/* Production mensuelle */}
          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
              <h2 className="font-semibold text-foreground">{t("prodMensTitle")}</h2>
            </div>
            <div className="p-6">
              {/* Graphique courbe + barres */}
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={result.productionMensuelle.map((m) => ({ mois: m.mois.slice(0, 3), kwh: m.kwh, consoMoyMensuelle: Math.round(result.consoTotale / 12) }))} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="mois" tick={{ fontSize: 11, fill: "#6B7280" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`} />
                    <Tooltip formatter={(value) => [`${fmt(Number(value))} kWh`]} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="kwh" name="Production PV" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <ReferenceLine y={Math.round(result.consoTotale / 12)} stroke="#ef4444" strokeDasharray="6 3" strokeWidth={2} label={{ value: `Conso moy. ${fmt(Math.round(result.consoTotale / 12))} kWh/mois`, position: "insideTopRight", fontSize: 10, fill: "#ef4444" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex items-center justify-center gap-6 text-xs text-muted">
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-green-500" /> {t("chartProductionPV")}</div>
                <div className="flex items-center gap-1.5"><div className="w-6 h-0 border-t-2 border-dashed border-red-500" /> {t("chartConsoMensuelle")}</div>
              </div>
              <div className="mt-3 text-xs text-muted text-center">{t("prodMensDesc")}</div>
            </div>
          </div>

          {/* Conformité réglementaire */}
          <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-blue-500/5 to-transparent">
              <h2 className="font-semibold text-foreground">{t("conformiteTitle")}</h2>
            </div>
            <div className="p-6">
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: t("confStatut"), value: result.conformite.statutJuridique },
                  { label: t("confPerimetre"), value: result.conformite.perimetre },
                  { label: t("confContrat"), value: result.conformite.contratRepartition },
                  { label: t("confILR"), value: result.conformite.declarationILR },
                  { label: t("confLoi"), value: result.conformite.loiReference },
                  { label: t("confReglement"), value: result.conformite.reglementILR },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-2 rounded-lg border border-card-border p-3">
                    <svg className="h-5 w-5 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{item.label}</div>
                      <div className="text-xs text-muted">{item.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <PdfButton generateBlob={() => generateCommunautePdfBlob(result, { nbParticipants, puissancePV, consoMoyenneParParticipant: consoMoyenne, tarifReseau, tarifPartage })} filename={`energy-communaute-${new Date().toLocaleDateString("fr-LU")}.pdf`} label={t("downloadPdf")} />
          </div>

          <div className="rounded-xl border border-energy/20 bg-energy/5 p-5">
            <h3 className="font-medium text-foreground text-sm mb-2">{t("parametresModele")}</h3>
            <ul className="text-xs text-muted space-y-1">
              <li>{t("paramProduction", { val: String(params.productionParKwc) })}</li>
              <li>{t("paramAutoconso", { base: String((params.tauxAutoConsoBase * 100).toFixed(0)), foisonnement: String((params.facteurFoisonnement * 100).toFixed(1)) })}</li>
              <li>{t("paramRachat", { val: String(params.tarifRachatSurplus) })}</li>
              <li>{t("paramCO2", { val: String(params.co2Facteur) })}</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
