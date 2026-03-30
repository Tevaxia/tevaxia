"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { estimer } from "@/lib/estimation";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";
import { AJUST_ETAGE, AJUST_ETAT, AJUST_EXTERIEUR } from "@/lib/adjustments";
import { formatEUR } from "@/lib/calculations";
import ConfidenceGauge from "@/components/ConfidenceGauge";
import { PriceEvolutionChart } from "@/components/PriceChart";

export default function Estimation() {
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState("2ème–3ème étage (réf.)");
  const [etat, setEtat] = useState("Bon état (réf.)");
  const [exterieur, setExterieur] = useState("Balcon standard (réf.)");
  const [parking, setParking] = useState(true);
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [estNeuf, setEstNeuf] = useState(false);

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

  const confianceColor = result?.confiance === "forte" ? "text-success" : result?.confiance === "moyenne" ? "text-warning" : "text-error";
  const confianceBg = result?.confiance === "forte" ? "bg-green-50 border-green-200" : result?.confiance === "moyenne" ? "bg-amber-50 border-amber-200" : "bg-red-50 border-red-200";

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Estimation immobilière
          </h1>
          <p className="mt-2 text-muted">
            Estimation guidée par les données publiques luxembourgeoises
          </p>
        </div>

        {/* Formulaire */}
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
                        <><span className="font-medium">{r.matchedOn}</span><span className="text-muted ml-1">— {r.quartier ? "quartier" : "commune"} de {r.commune.commune}</span></>
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
              <div className="mt-2 text-xs text-muted">
                {selectedResult.quartier
                  ? `${selectedResult.quartier.nom} — ${selectedResult.quartier.note}`
                  : `${selectedResult.commune.commune} (${selectedResult.commune.canton})`
                }
              </div>
            )}
          </div>

          {/* Caractéristiques */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">Caractéristiques du bien</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <InputField label="Surface habitable" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" min={10} max={500} />
              <InputField label="Nombre de chambres" value={nbChambres} onChange={(v) => setNbChambres(Number(v))} min={0} max={10} />
              <InputField
                label="Étage"
                type="select"
                value={etage}
                onChange={setEtage}
                options={AJUST_ETAGE.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="État du bien"
                type="select"
                value={etat}
                onChange={setEtat}
                options={AJUST_ETAT.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="Extérieur"
                type="select"
                value={exterieur}
                onChange={setExterieur}
                options={AJUST_EXTERIEUR.map((a) => ({ value: a.label, label: `${a.label} (${a.value > 0 ? "+" : ""}${a.value}%)` }))}
              />
              <InputField
                label="Classe énergie (CPE)"
                type="select"
                value={classeEnergie}
                onChange={setClasseEnergie}
                options={[
                  { value: "A", label: "A — Très performant (+5%)" },
                  { value: "B", label: "B — Performant (+3%)" },
                  { value: "C", label: "C — Assez performant (+1%)" },
                  { value: "D", label: "D — Moyen (réf.)" },
                  { value: "E", label: "E — Peu performant (-3%)" },
                  { value: "F", label: "F — Très peu performant (-6%)" },
                  { value: "G", label: "G — Extrêmement peu performant (-10%)" },
                ]}
              />
            </div>
            <div className="mt-4 space-y-3">
              <ToggleField label="Parking inclus" checked={parking} onChange={setParking} hint="+4% en moyenne" />
              <ToggleField label="Bien neuf (VEFA)" checked={estNeuf} onChange={setEstNeuf} hint="Prix de référence VEFA au lieu d'existant" />
            </div>
          </div>

          {/* Résultat */}
          {result && (
            <div className="space-y-4">
              {/* Estimation principale */}
              <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white text-center shadow-lg">
                <div className="text-sm text-white/60">Estimation centrale</div>
                <div className="mt-2 text-5xl font-bold">{formatEUR(result.estimationCentrale)}</div>
                <div className="mt-3 flex items-center justify-center gap-6 text-sm text-white/70">
                  <div>
                    <div className="text-white/40 text-xs">Basse</div>
                    <div className="font-semibold">{formatEUR(result.estimationBasse)}</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div>
                    <div className="text-white/40 text-xs">Haute</div>
                    <div className="font-semibold">{formatEUR(result.estimationHaute)}</div>
                  </div>
                </div>
                <div className="mt-3 text-xs text-white/50">
                  {result.prixM2Ajuste} €/m² × {surface} m²
                </div>
              </div>

              {/* Confiance */}
              <ConfidenceGauge level={result.confiance} note={result.confianceNote} />

              {/* Graphique évolution prix */}
              <PriceEvolutionChart />

              {/* Détail */}
              <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-navy">Détail de l'estimation</h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted">Prix de base /m²</span>
                    <span className="font-mono font-semibold">{formatEUR(result.prixM2Base)}</span>
                  </div>
                  <div className="text-xs text-muted pl-2">{result.sourceBase} — {selectedResult?.commune.periode}</div>

                  {result.ajustements.length > 0 && (
                    <div className="border-t border-card-border pt-2 mt-2 space-y-1">
                      {result.ajustements.map((a, i) => (
                        <div key={i} className="flex justify-between text-xs">
                          <span className="text-muted">{a.label}</span>
                          <span className={`font-mono ${a.pct > 0 ? "text-success" : a.pct < 0 ? "text-error" : "text-muted"}`}>
                            {a.pct > 0 ? "+" : ""}{a.pct}%
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between text-xs font-semibold border-t border-card-border pt-1">
                        <span>Total ajustements</span>
                        <span className={result.totalAjustements > 0 ? "text-success" : result.totalAjustements < 0 ? "text-error" : ""}>
                          {result.totalAjustements > 0 ? "+" : ""}{result.totalAjustements}%
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between text-sm font-semibold border-t border-card-border pt-2 mt-2">
                    <span className="text-navy">Prix ajusté /m²</span>
                    <span className="text-navy font-mono">{formatEUR(result.prixM2Ajuste)}</span>
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-muted text-center leading-relaxed">
                Estimation indicative basée sur les données publiques de l'Observatoire de l'Habitat
                et les coefficients d'ajustement statistiques. Ne constitue pas une évaluation professionnelle.
                Pour une expertise conforme EVS 2025, utilisez le{" "}
                <a href="/valorisation" className="text-navy font-medium hover:underline">module de valorisation</a>.
              </p>
            </div>
          )}

          {!selectedResult && (
            <div className="text-center py-8 text-muted text-sm">
              Sélectionnez une commune pour obtenir une estimation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
