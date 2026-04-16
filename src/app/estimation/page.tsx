"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { estimer } from "@/lib/estimation";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { PRIX_MOYEN_M2 } from "@/lib/macro-data";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "@/lib/adjustments";
import { formatEUR, calculerMensualite } from "@/lib/calculations";
import { getDemographics } from "@/lib/demographics";
import ConfidenceGauge from "@/components/ConfidenceGauge";
import Link from "next/link";
import { estimerCoutsRenovation } from "@/lib/renovation-costs";
import { calculerDecoteEmphyteose } from "@/lib/emphyteose";
import { readUrlHash } from "@/lib/url-state";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import RelatedTools from "@/components/RelatedTools";
import Breadcrumbs from "@/components/Breadcrumbs";
import { generateEstimationPdfBlob, PdfButton } from "@/components/ToolsPdf";
import ShareLinkButton from "@/components/ShareLinkButton";
import ShareButton from "@/components/ShareButton";
import AuthGate from "@/components/AuthGate";
import MarketAlertButton from "@/components/MarketAlertButton";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

export default function Estimation() {
  const t = useTranslations("estimation");
  const tv = useTranslations("valorisation");

  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState("adjEtage2e3eRef");
  const [etat, setEtat] = useState("adjEtatBonRef");
  const [exterieur, setExterieur] = useState("adjExtBalconRef");
  const [parking, setParking] = useState(true);
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [estNeuf, setEstNeuf] = useState(false);
  const [bailEmphyteotique, setBailEmphyteotique] = useState(false);
  const [dureeRestanteEmph, setDureeRestanteEmph] = useState(85);
  const [canonAnnuel, setCanonAnnuel] = useState(1200);

  // ── Pre-remplissage depuis URL search params OU hash (lien partagé) ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    // Aussi supporter l'ancien format hash
    const hash = readUrlHash();

    const commune = params.get("c") ?? (hash?.c as string | undefined);
    const surf = params.get("s") ?? (hash?.s as string | undefined);
    const ch = params.get("ch") ?? (hash?.ch as string | undefined);
    const et = params.get("et") ?? (hash?.et as string | undefined);
    const ea = params.get("ea") ?? (hash?.ea as string | undefined);
    const ex = params.get("ex") ?? (hash?.ex as string | undefined);
    const p = params.get("p") ?? (hash?.p as string | undefined);
    const e = params.get("e") ?? (hash?.e as string | undefined);
    const n = params.get("n") ?? (hash?.n as string | undefined);

    if (commune) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCommuneSearch(String(commune));
      const results = rechercherCommune(String(commune));
      if (results.length > 0) setSelectedResult(results[0]);
    }
    if (surf) setSurface(Number(surf));
    if (ch) setNbChambres(Number(ch));
    if (et) setEtage(String(et));
    if (ea) setEtat(String(ea));
    if (ex) setExterieur(String(ex));
    if (p !== undefined && p !== null) setParking(p === "true" || p === "1");
    if (e) setClasseEnergie(String(e));
    if (n !== undefined && n !== null) setEstNeuf(n === "true" || n === "1");
  }, []);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;
    return estimer({
      commune: selectedResult.commune.commune,
      quartier: selectedResult.quartier?.nom,
      surface,
      nbChambres,
      etage,
      etat,
      exterieur,
      parking,
      classeEnergie,
      typeBien: "appartement",
      estNeuf,
    });
  }, [selectedResult, surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf]);

  // ── Comparables synthétiques ──
  const comparables = useMemo(() => {
    if (!selectedResult || !result) return [];
    const basePrix = result.prixM2Ajuste;
    const types = ["appartement", "appartement", "maison", "appartement", "maison"] as const;
    const trimestres = ["T4 2025", "T3 2025", "T2 2025", "T1 2025", "T4 2024"];
    // Deterministic seed from commune name
    const seed = selectedResult.commune.commune.length;
    return Array.from({ length: 5 }, (_, i) => {
      const variation = [0.92, 1.05, 0.97, 1.08, 0.88][i];
      const surfVar = [0.85, 1.15, 0.9, 1.1, 1.2][i];
      const surfComp = Math.round(surface * surfVar);
      const prixM2 = Math.round(basePrix * variation);
      return {
        id: i,
        type: types[(i + seed) % types.length],
        surface: surfComp,
        prixM2,
        prixTotal: prixM2 * surfComp,
        date: trimestres[i],
      };
    });
  }, [selectedResult, result, surface]);

  // ── Données graphique évolution prix commune ──
  const communeChartData = useMemo(() => {
    if (!selectedResult || !result) return [];
    const communePrix = result.prixM2Ajuste;
    // National 2025 price as reference
    const national2025 = PRIX_MOYEN_M2.find((d) => d.year === 2025)?.value ?? 7500;
    const communeFactor = communePrix / national2025;
    return PRIX_MOYEN_M2
      .filter((d) => d.year >= 2019)
      .map((d) => ({
        annee: d.year,
        national: d.value,
        commune: Math.round(d.value * communeFactor),
      }));
  }, [selectedResult, result]);


  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Formulaire */}
        <div className="space-y-6">
          {/* Commune */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("localisation")}</h2>
            <div className="relative">
              <input
                type="text"
                value={communeSearch}
                onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-3 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
              />
              {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((r) => (
                    <button
                      key={r.commune.commune + r.matchedOn}
                      onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors"
                    >
                      {r.isLocalite ? (
                        <><span className="font-medium">{r.matchedOn}</span><span className="text-muted ml-1">— {r.quartier ? t("searchQuartier") : t("searchCommune")} {t("searchDe")} {r.commune.commune}</span></>
                      ) : (
                        <><span className="font-medium">{r.commune.commune}</span><span className="text-muted ml-2">({r.commune.canton})</span></>
                      )}
                      <span className="float-right font-mono text-navy">
                        {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            {selectedResult && (
              <div className="mt-2 flex items-center gap-2">
                <div className="text-xs text-muted flex-1">
                  {selectedResult.quartier
                    ? `${selectedResult.quartier.nom} — ${selectedResult.quartier.note}`
                    : `${selectedResult.commune.commune} (${selectedResult.commune.canton})`
                  }
                </div>
                <MarketAlertButton commune={selectedResult.commune.commune} />
              </div>
            )}
          </div>

          {/* Caractéristiques */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("characteristics")}</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label={t("surfaceLabel")} value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" min={10} max={500} />
              <InputField label={t("chambresLabel")} value={nbChambres} onChange={(v) => setNbChambres(Number(v))} min={0} max={10} />
              <InputField
                label={t("etageLabel")}
                type="select"
                value={etage}
                onChange={setEtage}
                options={AJUST_ETAGE.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label={t("etatLabel")}
                type="select"
                value={etat}
                onChange={setEtat}
                options={AJUST_ETAT.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label={t("exterieurLabel")}
                type="select"
                value={exterieur}
                onChange={setExterieur}
                options={AJUST_EXTERIEUR.map((a) => ({ value: a.labelKey, label: `${tv(a.labelKey)} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label={t("classeEnergieLabel")}
                type="select"
                value={classeEnergie}
                onChange={setClasseEnergie}
                options={[
                  { value: "A", label: t("energieA") },
                  { value: "B", label: t("energieB") },
                  { value: "C", label: t("energieC") },
                  { value: "D", label: t("energieD") },
                  { value: "E", label: t("energieE") },
                  { value: "F", label: t("energieF") },
                  { value: "G", label: t("energieG") },
                ]}
              />
            </div>
            <div className="mt-4 space-y-3">
              <InputField label={t("typeBienLabel")} type="select" value="appartement" onChange={() => {}} options={[
                { value: "appartement", label: t("typeBienAppartement") },
                { value: "maison", label: t("typeBienMaison") },
              ]} hint={t("typeBienHint")} />
              <ToggleField label={t("parkingLabel")} checked={parking} onChange={setParking} hint={t("parkingHint")} />
              <ToggleField label={t("neufLabel")} checked={estNeuf} onChange={setEstNeuf} hint={t("neufHint")} />
              <ToggleField label={t("emphyteotiqueLabel")} checked={bailEmphyteotique} onChange={setBailEmphyteotique} hint={t("emphyteotiqueHint")} />
              {bailEmphyteotique && (
                <div className="grid gap-3 sm:grid-cols-2 mt-2">
                  <InputField label={t("dureeRestanteLabel")} value={dureeRestanteEmph} onChange={(v) => setDureeRestanteEmph(Number(v))} suffix={t("ansSuffix")} min={1} max={99} />
                  <InputField label={t("canonAnnuelLabel")} value={canonAnnuel} onChange={(v) => setCanonAnnuel(Number(v))} suffix={t("canonSuffix")} hint={t("canonHint")} />
                </div>
              )}
            </div>
          </div>

          {/* Résultat */}
          {result && (
            <div className="space-y-4">
              {/* Estimation principale */}
              <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                <div className="text-sm text-white/60">{t("estimationCentrale")}</div>
                <div className="mt-2 text-5xl font-bold">{formatEUR(result.estimationCentrale)}</div>
                <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                  <div>
                    <div className="text-white/40 text-xs">{t("estimationBasse")}</div>
                    <div className="font-semibold">{formatEUR(result.estimationBasse)}</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <div className="text-white/40 text-xs">{t("estimationHaute")}</div>
                    <div className="font-semibold">{formatEUR(result.estimationHaute)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  {t("prixM2Detail", { prixM2: result.prixM2Ajuste, surface })}
                </div>
              </div>

              <AuthGate>
              {/* Double modèle : transactions vs annonces */}
              {result.estimationTransactions != null && result.estimationAnnonces != null && (
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-3">{t("comparaisonSources")}</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-center">
                      <div className="text-xs text-blue-600 font-medium">{t("estimationTransactions")}</div>
                      <div className="text-xs text-blue-400 mb-1">{t("actesNotaries")}</div>
                      <div className="text-lg font-bold text-blue-800">{formatEUR(result.estimationTransactions)}</div>
                    </div>
                    <div className="rounded-lg bg-purple-50 border border-purple-200 p-3 text-center">
                      <div className="text-xs text-purple-600 font-medium">{t("estimationAnnonces")}</div>
                      <div className="text-xs text-purple-400 mb-1">{t("prixAffiches")}</div>
                      <div className="text-lg font-bold text-purple-800">{formatEUR(result.estimationAnnonces)}</div>
                    </div>
                  </div>
                  {result.ecartPct != null && (
                    <div className="mt-3 text-center">
                      <span className="text-xs text-muted">
                        {t("ecartLabel")} : <span className={`font-semibold ${result.ecartPct > 0 ? "text-amber-600" : "text-green-600"}`}>{result.ecartPct > 0 ? "+" : ""}{result.ecartPct}%</span>
                        {" "}— {t("estimationCentraleMoyenne")} : <span className="font-semibold text-navy">{formatEUR(Math.round((result.estimationTransactions + result.estimationAnnonces) / 2))}</span>
                      </span>
                    </div>
                  )}
                  <p className="mt-2 text-[10px] text-muted">
                    {t("comparaisonExplication")}
                  </p>
                </div>
              )}

              {/* Marge de négociation */}
              {result.ecartPct != null && result.ecartPct > 0 && (
                <div className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-2xl font-bold text-amber-700 shrink-0">
                      %
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-amber-900">
                        {t("margeNegociation", { pct: result.ecartPct })}
                      </div>
                      <p className="mt-1 text-xs text-amber-700 leading-relaxed">
                        {t("margeNegociationDetail", { pct: result.ecartPct })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Emphytéose */}
              {bailEmphyteotique && result && (() => {
                const emph = calculerDecoteEmphyteose({
                  valeurPleinePropriete: result.estimationCentrale,
                  dureeRestante: dureeRestanteEmph,
                  canonAnnuel,
                  tauxActualisation: 3.5,
                });
                return (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-amber-800 mb-2">{t("emphyteoseTitle")}</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span className="text-amber-700">{t("valeurPleinePropriete")}</span><span className="font-mono">{formatEUR(result.estimationCentrale)}</span></div>
                      <div className="flex justify-between"><span className="text-amber-700">{t("decoteEmphyteotique", { pct: emph.decotePct.toFixed(1) })}</span><span className="font-mono text-error">- {formatEUR(emph.decote)}</span></div>
                      <div className="flex justify-between font-semibold border-t border-amber-200 pt-1"><span className="text-amber-900">{t("valeurEmphyteose")}</span><span className="font-mono text-navy">{formatEUR(emph.valeurEmphyteose)}</span></div>
                    </div>
                    <p className="mt-2 text-xs text-amber-700">{emph.explication}</p>
                  </div>
                );
              })()}

              {/* Coût mensuel total */}
              {(() => {
                const prixBien = result.estimationCentrale;
                const apport = prixBien * 0.20;
                const capitalEmprunte = prixBien - apport;
                const mensualiteCredit = calculerMensualite(capitalEmprunte, 0.033, 25);
                const chargesCopro = 250;
                const impotFoncier = 15;
                const totalMensuel = mensualiteCredit + chargesCopro + impotFoncier;
                return (
                  <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-1">{t("siVousAchetez")}</h3>
                    <p className="text-[10px] text-muted mb-3">{t("simulationIndicative")}</p>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted">{t("mensualiteCredit")}</span>
                        <span className="font-mono">{formatEUR(Math.round(mensualiteCredit))}/{t("mois")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{t("chargesCopro")}</span>
                        <span className="font-mono">{formatEUR(chargesCopro)}/{t("mois")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted">{t("impotFoncier")}</span>
                        <span className="font-mono">{formatEUR(impotFoncier)}/{t("mois")}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-card-border pt-2 mt-2">
                        <span className="text-navy">{t("totalMensuel")}</span>
                        <span className="text-navy font-mono">{formatEUR(Math.round(totalMensuel))}/{t("mois")}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted">{t("chargesExplication")}</p>
                    <div className="mt-3 text-center">
                      <Link href="/achat-vs-location" className="text-xs font-medium text-navy hover:underline">
                        {t("comparerLocation")}
                      </Link>
                    </div>
                  </div>
                );
              })()}

              {/* Confiance */}
              <ConfidenceGauge level={result.confiance} note={result.confianceNote} />

              {/* Analyse IA */}
              <AiAnalysisCard
                context={[
                  `Commune: ${selectedResult?.commune.commune ?? communeSearch}`,
                  selectedResult?.quartier ? `Quartier: ${selectedResult.quartier.nom}` : null,
                  `Surface: ${surface} m²`,
                  `Chambres: ${nbChambres}`,
                  `Classe énergie: ${classeEnergie}`,
                  `État: ${etat}`,
                  `Neuf: ${estNeuf ? "oui" : "non"}`,
                  `Parking: ${parking ? "oui" : "non"}`,
                  `Prix/m² base: ${result.prixM2Base} EUR`,
                  `Prix/m² ajusté: ${result.prixM2Ajuste} EUR`,
                  `Estimation basse: ${result.estimationBasse} EUR`,
                  `Estimation centrale: ${result.estimationCentrale} EUR`,
                  `Estimation haute: ${result.estimationHaute} EUR`,
                  `Confiance: ${result.confiance}`,
                  `Ajustements: ${result.ajustements.map((a) => `${tv(a.labelKey)} ${a.pct > 0 ? "+" : ""}${a.pct}%`).join(", ")}`,
                ].filter(Boolean).join("\n")}
                prompt="Analyse cette estimation immobilière au Luxembourg. Commente le niveau de prix par rapport au marché actuel, la pertinence des ajustements, et donne un avis professionnel sur la confiance du résultat. Si pertinent, mentionne des facteurs locaux spécifiques à cette commune."
              />

              {/* Profil commune */}
              {selectedResult && (() => {
                const demo = getDemographics(selectedResult.commune.commune);
                if (!demo) return null;
                return (
                  <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-3">{t("profilCommune", { commune: demo.commune })}</h3>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3">
                      <div>
                        <div className="text-[10px] text-muted uppercase tracking-wide">{t("population")}</div>
                        <div className="font-semibold font-mono">{demo.population.toLocaleString("fr-LU")}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted uppercase tracking-wide">{t("croissance")}</div>
                        <div className="font-semibold font-mono">+{demo.croissancePct}%<span className="text-[10px] text-muted font-normal ml-1">{t("croissancePeriode")}</span></div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted uppercase tracking-wide">{t("densite")}</div>
                        <div className="font-semibold font-mono">{demo.densiteHabKm2.toLocaleString("fr-LU")} {t("densiteUnit")}</div>
                      </div>
                      {demo.revenuMedian && (
                        <div>
                          <div className="text-[10px] text-muted uppercase tracking-wide">{t("revenuMedian")}</div>
                          <div className="font-semibold font-mono">{formatEUR(demo.revenuMedian)}/{t("an")}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-[10px] text-muted uppercase tracking-wide">{t("pctEtrangers")}</div>
                        <div className="font-semibold font-mono">{demo.pctEtrangers}%</div>
                      </div>
                      {demo.tauxEmploi && (
                        <div>
                          <div className="text-[10px] text-muted uppercase tracking-wide">{t("tauxEmploi")}</div>
                          <div className="font-semibold font-mono">{demo.tauxEmploi}%</div>
                        </div>
                      )}
                    </div>
                    <p className="mt-3 text-[10px] text-muted">{t("sourcesDemographiques")}</p>
                  </div>
                );
              })()}

              {/* Estimation rénovation si classe énergie faible */}
              {classeEnergie >= "E" && (() => {
                const reno = estimerCoutsRenovation(classeEnergie, "B", surface);
                if (reno.postes.length === 0) return null;
                return (
                  <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-2">{t("renovationTitle", { classeFrom: classeEnergie, classeTo: "B" })}</h3>
                    <div className="space-y-1 text-xs">
                      {reno.postes.map((p) => (
                        <div key={p.labelKey} className="flex justify-between">
                          <span className="text-muted">{tv(p.labelKey)}</span>
                          <span className="font-mono">{formatEUR(p.coutMin)} – {formatEUR(p.coutMax)}</span>
                        </div>
                      ))}
                      <div className="flex justify-between font-semibold border-t border-card-border pt-1 mt-1">
                        <span>{t("totalRenovation")}</span>
                        <span className="font-mono">{formatEUR(reno.totalAvecHonoraires)}</span>
                      </div>
                    </div>
                    <p className="mt-2 text-[10px] text-muted">{t("renovationDisclaimer")}</p>
                  </div>
                );
              })()}

              {/* Transactions comparables */}
              {comparables.length > 0 && (
                <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-1">{t("comparablesTitle")}</h3>
                  <p className="text-[10px] text-muted mb-3">
                    {t("comparablesSubtitle", { commune: selectedResult?.commune.commune ?? "", periode: selectedResult?.commune.periode ?? "" })}
                  </p>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {comparables.map((c) => (
                      <div key={c.id} className="rounded-lg border border-card-border bg-background p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-navy">{c.type === "appartement" ? t("typeBienAppartement") : t("typeBienMaison")}</span>
                          <span className="text-[10px] text-muted">{c.date}</span>
                        </div>
                        <div className="text-lg font-bold text-navy">{formatEUR(c.prixTotal)}</div>
                        <div className="flex items-center justify-between mt-1 text-[11px] text-muted">
                          <span>{c.surface} m²</span>
                          <span className="font-mono">{formatEUR(c.prixM2)}/m²</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted">
                    {t("comparablesDisclaimer")}
                  </p>
                </div>
              )}

              {/* Graphique évolution prix commune */}
              {communeChartData.length > 0 && (
                <div className="rounded-xl border border-card-border bg-card p-4 shadow-sm">
                  <div className="mb-3">
                    <h3 className="text-sm font-semibold text-navy">
                      {t("chartTitle", { commune: selectedResult?.commune.commune ?? "" })}
                    </h3>
                    <p className="text-[10px] text-muted">
                      {t("chartSource")}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={communeChartData} margin={{ top: 5, right: 5, bottom: 0, left: -10 }}>
                      <defs>
                        <linearGradient id="colorCommune" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B2A4A" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#1B2A4A" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="annee" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis
                        tick={{ fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                        domain={["auto", "auto"]}
                      />
                      <Tooltip
                        formatter={(value) => [formatEUR(Number(value)), t("tooltipPrixM2")]}
                        labelFormatter={(label) => t("tooltipAnnee", { annee: label })}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e5e2db" }}
                      />
                      <Area
                        type="monotone"
                        dataKey="commune"
                        stroke="#1B2A4A"
                        fill="url(#colorCommune)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: "#1B2A4A" }}
                        name={selectedResult?.commune.commune}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Prix par quartier */}
              {selectedResult?.commune.quartiers && selectedResult.commune.quartiers.length > 0 && (() => {
                const quartiers = selectedResult.commune.quartiers!;
                const sorted = [...quartiers].sort((a, b) => b.prixM2 - a.prixM2);
                const minPrix = Math.min(...sorted.map((q) => q.prixM2));
                const maxPrix = Math.max(...sorted.map((q) => q.prixM2));
                const range = maxPrix - minPrix || 1;
                const closestIdx = sorted.reduce((best, q, i) =>
                  Math.abs(q.prixM2 - result.prixM2Ajuste) < Math.abs(sorted[best].prixM2 - result.prixM2Ajuste) ? i : best, 0);
                return (
                  <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-navy mb-3">
                      {t("quartierTitle", { commune: selectedResult.commune.commune })}
                    </h3>
                    <div className="space-y-2">
                      {sorted.map((q, i) => {
                        const barPct = ((q.prixM2 - minPrix) / range) * 100;
                        const isClosest = i === closestIdx;
                        return (
                          <div
                            key={q.nom}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${isClosest ? "bg-navy/5 ring-1 ring-navy/20" : ""}`}
                          >
                            <div className="w-[38%] min-w-0 shrink-0">
                              <span className={`truncate block ${isClosest ? "font-semibold text-navy" : "text-foreground"}`}>
                                {q.nom}
                              </span>
                              <span className="block text-[10px] text-muted truncate">{q.note}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="h-3 rounded-full bg-navy/10 overflow-hidden">
                                <div
                                  className="h-full rounded-full bg-navy/60 transition-all"
                                  style={{ width: `${Math.max(barPct, 8)}%` }}
                                />
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="font-mono text-xs font-semibold w-[72px] text-right">
                                {formatEUR(q.prixM2)}/m²
                              </span>
                              <span className={`text-[10px] font-medium leading-none ${
                                q.tendance === "hausse" ? "text-green-600" : q.tendance === "baisse" ? "text-red-500" : "text-muted"
                              }`}>
                                {q.tendance === "hausse" ? "▲" : q.tendance === "baisse" ? "▼" : "—"}
                                {" "}{t(q.tendance === "hausse" ? "quartierHausse" : q.tendance === "baisse" ? "quartierBaisse" : "quartierStable")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-[10px] text-muted">{t("quartierSource")}</p>
                  </div>
                );
              })()}

              {/* Détail */}
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-navy">{t("detailTitle")}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">{t("prixBaseM2")}</span>
                    <span className="font-mono font-semibold">{formatEUR(result.prixM2Base)}</span>
                  </div>
                  <div className="text-xs text-muted pl-2">{result.sourceBase} — {selectedResult?.commune.periode}</div>

                  {result.ajustements.length > 0 && (
                    <div className="border-t border-card-border pt-2 mt-2 space-y-1">
                      {result.ajustements.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted">{a.labelParams ? tv(a.labelKey, a.labelParams) : tv(a.labelKey)}</span>
                          <span className={`font-mono ${a.pct > 0 ? "text-success" : a.pct < 0 ? "text-error" : "text-muted"}`}>
                            {a.pct > 0 ? "+" : ""}{a.pct}%
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1">
                        <span>{t("totalAjustements")}</span>
                        <span className={result.totalAjustements > 0 ? "text-success" : result.totalAjustements < 0 ? "text-error" : ""}>
                          {result.totalAjustements > 0 ? "+" : ""}{result.totalAjustements}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold border-t border-card-border pt-2 mt-2">
                    <span className="text-navy">{t("prixAjusteM2")}</span>
                    <span className="text-navy font-mono">{formatEUR(result.prixM2Ajuste)}</span>
                  </div>
                </div>
              </div>
              </AuthGate>

              {/* Partager */}
              <div className="flex justify-center gap-2">
                <ShareButton
                  label={t("copierLien")}
                  params={{
                    c: communeSearch,
                    s: surface,
                    ch: nbChambres,
                    et: etage,
                    ea: etat,
                    ex: exterieur,
                    p: parking ? "1" : "0",
                    e: classeEnergie,
                    n: estNeuf ? "1" : "0",
                  }}
                />
                <SaveButton
                  onClick={() => {
                    sauvegarderEvaluation({
                      nom: `${selectedResult?.commune.commune || communeSearch} — ${surface} m²`,
                      type: "estimation",
                      commune: selectedResult?.commune.commune,
                      valeurPrincipale: result.estimationCentrale,
                      data: { communeSearch, surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf },
                    });
                  }}
                  label={t("sauvegarder")}
                  successLabel={t("evaluationSauvegardee")}
                />
                <PdfButton
                  label="PDF"
                  filename={`estimation-${(selectedResult?.commune.commune || communeSearch).toLowerCase()}-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                  generateBlob={() =>
                    generateEstimationPdfBlob({
                      commune: selectedResult?.commune.commune || communeSearch,
                      typeBien: t("typeBienAppartement"),
                      surface,
                      chambres: nbChambres,
                      prixBas: result.estimationBasse,
                      prixMoyen: result.estimationCentrale,
                      prixHaut: result.estimationHaute,
                      prixM2: result.prixM2Ajuste,
                      adjustments: result.ajustements.map((a) => ({
                        label: a.labelParams ? tv(a.labelKey, a.labelParams) : tv(a.labelKey),
                        impact: `${a.pct > 0 ? "+" : ""}${a.pct}%`,
                      })),
                    })
                  }
                />
                <ShareLinkButton
                  toolType="estimation"
                  defaultTitle={`Estimation ${selectedResult?.commune.commune || communeSearch} — ${surface} m²`}
                  payload={{
                    inputs: {
                      commune: selectedResult?.commune.commune || communeSearch,
                      quartier: selectedResult?.quartier?.nom,
                      surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf,
                    },
                    results: {
                      estimationBasse: result.estimationBasse,
                      estimationCentrale: result.estimationCentrale,
                      estimationHaute: result.estimationHaute,
                      prixM2Ajuste: result.prixM2Ajuste,
                      confiance: result.confiance,
                      ajustements: result.ajustements.map((a) => ({
                        label: a.labelParams ? tv(a.labelKey, a.labelParams) : tv(a.labelKey),
                        pct: a.pct,
                      })),
                    },
                  }}
                />
              </div>

              <RelatedTools keys={["frais", "achatLocation", "loyer"]} />

              {/* Disclaimer */}
              <p className="text-xs text-muted text-center leading-relaxed">
                {t("disclaimer")}{" "}
                <a href="/valorisation" className="text-navy font-medium hover:underline">{t("disclaimerLink")}</a>.
              </p>
            </div>
          )}

          {!selectedResult && (
            <div className="text-center py-8 text-muted text-sm">
              {t("selectCommune")}
            </div>
          )}
        </div>
      </div>

    </div>

    <SEOContent
      ns="estimation"
      sections={[
        { titleKey: "contextTitle", contentKey: "contextContent" },
        { titleKey: "methodeTitle", contentKey: "methodeContent" },
        { titleKey: "facteursTitle", contentKey: "facteursContent" },
        { titleKey: "exempleTitle", contentKey: "exempleContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/carte", labelKey: "carte" },
        { href: "/hedonique", labelKey: "hedonique" },
        { href: "/valorisation", labelKey: "valorisation" },
      ]}
    />
    </>
  );
}
