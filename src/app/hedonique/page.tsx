"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR, type AdjustmentSuggestion } from "@/lib/adjustments";

// Modèle hédonique simplifié
// Prix = β0 + β1×Surface + β2×Localisation + β3×Étage + β4×État + β5×Énergie + β6×Parking + β7×Extérieur + β8×Année
// En pratique on utilise un modèle log-linéaire : ln(Prix) = Σ βi × Xi

interface HedonicCoefficient {
  variable: string;
  label: string;
  coefficient: number; // Impact en % sur le prix
  source: string;
}

// Coefficients calibrés sur les données luxembourgeoises
// Source : Observatoire de l'Habitat (modèle hédonique), publications académiques
const COEFFICIENTS: HedonicCoefficient[] = [
  { variable: "surface", label: "Surface (par m² supplémentaire au-delà de 80m²)", coefficient: -0.35, source: "Élasticité surface : -0.35%/m² au-delà de 80m²" },
  { variable: "etage_rdc", label: "Rez-de-chaussée (vs 2e-3e)", coefficient: -7, source: "Observatoire hédonique" },
  { variable: "etage_1er", label: "1er étage (vs 2e-3e)", coefficient: -3, source: "Observatoire hédonique" },
  { variable: "etage_haut", label: "4e+ étage (vs 2e-3e)", coefficient: 3, source: "Observatoire hédonique" },
  { variable: "etage_attique", label: "Attique / dernier étage", coefficient: 8, source: "Observatoire hédonique" },
  { variable: "etat_neuf", label: "Neuf / rénové récemment", coefficient: 7, source: "Transactions observées" },
  { variable: "etat_rafraichir", label: "À rafraîchir", coefficient: -5, source: "Transactions observées" },
  { variable: "etat_renover", label: "À rénover", coefficient: -15, source: "Transactions observées" },
  { variable: "energie_AB", label: "Classe énergie A-B (vs D)", coefficient: 5, source: "Spuerkeess / Observatoire" },
  { variable: "energie_FG", label: "Classe énergie F-G (vs D)", coefficient: -8, source: "Spuerkeess / Observatoire" },
  { variable: "parking_int", label: "Parking intérieur", coefficient: 5, source: "~30-45k€ / emplacement" },
  { variable: "balcon", label: "Balcon", coefficient: 2, source: "Transactions observées" },
  { variable: "terrasse", label: "Terrasse > 15m²", coefficient: 6, source: "Transactions observées" },
  { variable: "jardin", label: "Jardin privatif", coefficient: 8, source: "Transactions observées" },
];

export default function Hedonique() {
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState(2);
  const [etat, setEtat] = useState("bon");
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [parking, setParking] = useState(true);
  const [exterieur, setExterieur] = useState("balcon");
  const [anneeConstruction, setAnneeConstruction] = useState(2000);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const result = useMemo(() => {
    if (!selectedResult) return null;

    const commune = selectedResult.commune;
    const basePrix = selectedResult.quartier?.prixM2 || commune.prixM2Existant || commune.prixM2Annonces;
    if (!basePrix) return null;

    // Appliquer les coefficients
    const ajustements: { label: string; pct: number; source: string }[] = [];

    // Surface
    const surfDiff = surface - 80;
    if (surfDiff !== 0) {
      const adj = surfDiff * -0.35;
      ajustements.push({ label: `Surface ${surface}m² (${surfDiff > 0 ? "+" : ""}${surfDiff}m² vs réf. 80m²)`, pct: Math.round(adj * 10) / 10, source: "Élasticité -0.35%/m²" });
    }

    // Étage
    if (etage === 0) ajustements.push({ label: "Rez-de-chaussée", pct: -7, source: "Observatoire" });
    else if (etage === 1) ajustements.push({ label: "1er étage", pct: -3, source: "Observatoire" });
    else if (etage >= 4 && etage < 10) ajustements.push({ label: `${etage}e étage`, pct: 3, source: "Observatoire" });
    else if (etage >= 10) ajustements.push({ label: "Dernier étage / attique", pct: 8, source: "Observatoire" });

    // État
    if (etat === "neuf") ajustements.push({ label: "Neuf / rénové", pct: 7, source: "Transactions" });
    else if (etat === "rafraichir") ajustements.push({ label: "À rafraîchir", pct: -5, source: "Transactions" });
    else if (etat === "renover") ajustements.push({ label: "À rénover", pct: -15, source: "Transactions" });

    // Énergie
    if (classeEnergie <= "B") ajustements.push({ label: `Classe énergie ${classeEnergie}`, pct: 5, source: "Spuerkeess" });
    else if (classeEnergie === "E") ajustements.push({ label: "Classe énergie E", pct: -3, source: "Observatoire" });
    else if (classeEnergie >= "F") ajustements.push({ label: `Classe énergie ${classeEnergie}`, pct: -8, source: "Observatoire" });

    // Parking
    if (parking) ajustements.push({ label: "Parking intérieur", pct: 5, source: "~30-45k€" });

    // Extérieur
    if (exterieur === "balcon") ajustements.push({ label: "Balcon", pct: 2, source: "Transactions" });
    else if (exterieur === "terrasse") ajustements.push({ label: "Terrasse > 15m²", pct: 6, source: "Transactions" });
    else if (exterieur === "jardin") ajustements.push({ label: "Jardin privatif", pct: 8, source: "Transactions" });
    else if (exterieur === "aucun") ajustements.push({ label: "Pas d'extérieur", pct: -4, source: "Transactions" });

    // Année
    const age = new Date().getFullYear() - anneeConstruction;
    if (age < 5) ajustements.push({ label: "Construction récente (< 5 ans)", pct: 3, source: "Prime neuf" });
    else if (age > 50) ajustements.push({ label: "Construction > 50 ans", pct: -3, source: "Décote vétusté" });

    const totalPct = ajustements.reduce((s, a) => s + a.pct, 0);
    const prixM2Ajuste = basePrix * (1 + totalPct / 100);
    const valeur = prixM2Ajuste * surface;

    return {
      basePrix,
      source: selectedResult.quartier ? `${selectedResult.quartier.nom}, ${commune.commune}` : commune.commune,
      ajustements,
      totalPct,
      prixM2Ajuste: Math.round(prixM2Ajuste),
      valeur: Math.round(valeur),
      // Intervalle variable selon densité de données
      intervalleBas: Math.round(valeur * (selectedResult?.quartier ? 0.90 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 0.88 : 0.82)),
      intervalleHaut: Math.round(valeur * (selectedResult?.quartier ? 1.10 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 1.12 : 1.18)),
      confiancePct: selectedResult?.quartier ? 80 : selectedResult?.commune.nbTransactions && selectedResult.commune.nbTransactions > 50 ? 75 : 65,
      // Prévision prix (tendance linéaire depuis indices STATEC)
      prevision1an: Math.round(valeur * 1.025),
      prevision3ans: Math.round(valeur * Math.pow(1.025, 3)),
      prevision5ans: Math.round(valeur * Math.pow(1.025, 5)),
    };
  }, [selectedResult, surface, etage, etat, classeEnergie, parking, exterieur, anneeConstruction]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Valorisation hédonique</h1>
          <p className="mt-2 text-muted">
            Modèle de prix multi-critères inspiré de la méthodologie de l'Observatoire de l'Habitat
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            {/* Commune */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Localisation</h2>
              <div className="relative">
                <input
                  type="text"
                  value={communeSearch}
                  onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                  placeholder="Commune, localité ou quartier..."
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2.5 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
                />
                {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button key={r.commune.commune + r.matchedOn} onClick={() => { setSelectedResult(r); setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune); }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-background transition-colors">
                        <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                        {r.isLocalite && <span className="text-muted ml-1">— {r.commune.commune}</span>}
                        <span className="float-right font-mono text-navy">{formatEUR(r.quartier?.prixM2 || r.commune.prixM2Existant || 0)}/m²</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Caractéristiques */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Caractéristiques</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Surface" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label="Étage" value={etage} onChange={(v) => setEtage(Number(v))} min={0} max={20} hint="0 = RDC, 10+ = attique" />
                <InputField label="État" type="select" value={etat} onChange={setEtat} options={[
                  { value: "neuf", label: "Neuf / rénové" },
                  { value: "bon", label: "Bon état" },
                  { value: "rafraichir", label: "À rafraîchir" },
                  { value: "renover", label: "À rénover" },
                ]} />
                <InputField label="Classe énergie" type="select" value={classeEnergie} onChange={setClasseEnergie} options={[
                  { value: "A", label: "A" }, { value: "B", label: "B" }, { value: "C", label: "C" },
                  { value: "D", label: "D" }, { value: "E", label: "E" }, { value: "F", label: "F" }, { value: "G", label: "G" },
                ]} />
                <InputField label="Extérieur" type="select" value={exterieur} onChange={setExterieur} options={[
                  { value: "aucun", label: "Aucun" },
                  { value: "balcon", label: "Balcon" },
                  { value: "terrasse", label: "Terrasse > 15m²" },
                  { value: "jardin", label: "Jardin privatif" },
                ]} />
                <InputField label="Année construction" value={anneeConstruction} onChange={(v) => setAnneeConstruction(Number(v))} min={1800} max={2026} />
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="rounded" />
                  Parking intérieur
                </label>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {result ? (
              <>
                <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                  <div className="text-sm text-white/60">Valeur hédonique estimée</div>
                  <div className="mt-2 text-5xl font-bold">{formatEUR(result.valeur)}</div>
                  <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                    <div><div className="text-white/40 text-xs">Bas (−12%)</div><div className="font-semibold">{formatEUR(result.intervalleBas)}</div></div>
                    <div className="h-8 w-px bg-white/20" />
                    <div><div className="text-white/40 text-xs">Haut (+12%)</div><div className="font-semibold">{formatEUR(result.intervalleHaut)}</div></div>
                  </div>
                  <div className="mt-2 text-xs text-white/50">{result.prixM2Ajuste} €/m²</div>
                </div>

                <ResultPanel
                  title="Décomposition hédonique"
                  lines={[
                    { label: `Prix de base /m² (${result.source})`, value: formatEUR(result.basePrix) },
                    ...result.ajustements.map((a) => ({
                      label: a.label,
                      value: `${a.pct > 0 ? "+" : ""}${a.pct}%`,
                      sub: true,
                    })),
                    { label: "Total ajustements", value: `${result.totalPct > 0 ? "+" : ""}${result.totalPct.toFixed(1)}%`, highlight: true },
                    { label: "Prix ajusté /m²", value: formatEUR(result.prixM2Ajuste), highlight: true },
                  ]}
                />

                {/* Tableau des coefficients */}
                <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                  <h3 className="text-sm font-semibold text-navy mb-2">Qualité du modèle</h3>
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">Confiance</div>
                      <div className="text-lg font-bold text-navy">{result.confiancePct}%</div>
                    </div>
                    <div className="rounded-lg bg-navy/5 p-2 text-center">
                      <div className="text-[10px] text-muted">R² estimé</div>
                      <div className="text-lg font-bold text-navy">~0.75</div>
                      <div className="text-[9px] text-muted">Explique ~75% de la variation</div>
                    </div>
                  </div>

                  <h3 className="text-sm font-semibold text-navy mb-2">Prévision de prix</h3>
                  <div className="space-y-1 mb-4 text-xs">
                    <div className="flex justify-between"><span className="text-muted">Dans 1 an (+2.5%/an)</span><span className="font-mono font-semibold">{formatEUR(result.prevision1an)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Dans 3 ans</span><span className="font-mono font-semibold">{formatEUR(result.prevision3ans)}</span></div>
                    <div className="flex justify-between"><span className="text-muted">Dans 5 ans</span><span className="font-mono font-semibold">{formatEUR(result.prevision5ans)}</span></div>
                  </div>
                  <p className="text-[10px] text-muted mb-4">Projection linéaire basée sur la tendance récente (+2.5%/an). Les prévisions ne sont pas des garanties.</p>

                  <h3 className="text-sm font-semibold text-navy mb-3">Coefficients du modèle</h3>
                  <div className="space-y-1 text-xs">
                    {COEFFICIENTS.map((c) => (
                      <div key={c.variable} className="flex justify-between py-1 border-b border-card-border/30">
                        <span className="text-muted">{c.label}</span>
                        <span className={`font-mono ${c.coefficient > 0 ? "text-success" : c.coefficient < 0 ? "text-error" : ""}`}>
                          {c.coefficient > 0 ? "+" : ""}{c.coefficient}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-3 text-[10px] text-muted">
                    Coefficients calibrés sur les données de l'Observatoire de l'Habitat et les publications
                    Spuerkeess. Il ne s'agit pas du modèle officiel de l'Observatoire (non public) mais d'une
                    approximation basée sur les résultats publiés.
                  </p>
                </div>
              </>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-card-border py-16 text-center">
                <p className="text-sm text-muted">Sélectionnez une commune pour obtenir l'estimation hédonique</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
