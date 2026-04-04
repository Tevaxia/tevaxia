"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ToggleField from "@/components/ToggleField";
import { simulerAides, formatEUR, type AideDetail } from "@/lib/calculations";

const CATEGORIE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  etatique_acquisition: { label: "State aids (acquisition)", color: "text-navy", bg: "bg-navy/5 border-navy/20" },
  etatique_energie: { label: "State aids (energy)", color: "text-teal", bg: "bg-teal/5 border-teal/20" },
  privee: { label: "Private aids", color: "text-gold-dark", bg: "bg-gold/5 border-gold/20" },
  communale: { label: "Municipal aids", color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
  patrimoine: { label: "Equity", color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
};

const NATURE_LABELS: Record<string, { label: string; color: string }> = {
  directe: { label: "Direct aid", color: "bg-green-100 text-green-700" },
  economie: { label: "Estimated saving", color: "bg-blue-100 text-blue-700" },
  garantie: { label: "Guarantee", color: "bg-gray-100 text-gray-700" },
};

function AideCard({ aide }: { aide: AideDetail }) {
  const cat = CATEGORIE_LABELS[aide.categorie] || { label: aide.categorie, color: "text-slate", bg: "bg-gray-50" };
  const nature = NATURE_LABELS[aide.nature] || NATURE_LABELS.directe;
  return (
    <div className={`rounded-lg border p-4 ${cat.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold ${cat.color}`}>{aide.nom}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${nature.color}`}>
              {nature.label}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted">{aide.description}</p>
          <p className="mt-1 text-xs text-muted/70 italic">{aide.conditions}</p>
        </div>
        <span className="shrink-0 font-mono text-lg font-bold text-foreground">
          {formatEUR(aide.montant)}
        </span>
      </div>
    </div>
  );
}

// --- Detailed Klimabonus measures ---
interface KlimaMesure {
  id: string;
  label: string;
  type: "surface" | "count" | "kwp" | "forfait";
  unitLabel?: string;
  unitPrix: number; // EUR/unit or flat rate
  klimaPct: number; // % Klimabonus (50% by default)
}

const KLIMA_MESURES: KlimaMesure[] = [
  { id: "isolation_facade", label: "Facade insulation", type: "surface", unitLabel: "m²", unitPrix: 150, klimaPct: 50 },
  { id: "isolation_toiture", label: "Roof insulation", type: "surface", unitLabel: "m²", unitPrix: 120, klimaPct: 50 },
  { id: "fenetres", label: "Windows", type: "count", unitLabel: "windows", unitPrix: 5000, klimaPct: 50 },
  { id: "pac", label: "Heat pump", type: "forfait", unitPrix: 25000, klimaPct: 50 },
  { id: "vmc", label: "Dual-flow ventilation (VMC)", type: "forfait", unitPrix: 8000, klimaPct: 50 },
  { id: "pv", label: "Photovoltaic panels", type: "kwp", unitLabel: "kWp", unitPrix: 1800, klimaPct: 50 },
  { id: "solaire_thermique", label: "Solar thermal panels", type: "forfait", unitPrix: 8000, klimaPct: 50 },
];

// Klimabonus per measure (specific subsidies)
const KLIMA_SUBVENTIONS: Record<string, { parUnite: number; label: string }> = {
  isolation_facade: { parUnite: 50, label: "EUR 50/m²" },
  isolation_toiture: { parUnite: 40, label: "EUR 40/m²" },
  fenetres: { parUnite: 2000, label: "EUR 2,000/window" },
  pac: { parUnite: 8000, label: "EUR 8,000 flat" },
  vmc: { parUnite: 3000, label: "EUR 3,000 flat" },
  pv: { parUnite: 500, label: "EUR 500/kWp" },
  solaire_thermique: { parUnite: 2500, label: "EUR 2,500 flat" },
};

interface MesureState {
  active: boolean;
  quantite: number;
}

export default function SimulateurAides() {
  const [typeProjet, setTypeProjet] = useState<"acquisition" | "construction" | "renovation">("acquisition");
  const [prixBien, setPrixBien] = useState(750000);
  const [montantTravaux, setMontantTravaux] = useState(50000);
  const [klimaMode, setKlimaMode] = useState<"simplifie" | "detaille">("simplifie");
  const [mesures, setMesures] = useState<Record<string, MesureState>>(() => {
    const init: Record<string, MesureState> = {};
    for (const m of KLIMA_MESURES) {
      init[m.id] = { active: false, quantite: m.type === "forfait" ? 1 : m.type === "surface" ? 100 : m.type === "kwp" ? 5 : 4 };
    }
    return init;
  });

  // Compute detailed Klimabonus totals
  const klimaDetail = useMemo(() => {
    if (klimaMode !== "detaille") return null;
    const lignes: { id: string; label: string; coutTravaux: number; klimabonus: number; klimaLabel: string }[] = [];
    let totalTravaux = 0;
    let totalKlima = 0;
    for (const m of KLIMA_MESURES) {
      const state = mesures[m.id];
      if (!state?.active) continue;
      const qty = m.type === "forfait" ? 1 : state.quantite;
      const coutTravaux = m.unitPrix * qty;
      const sub = KLIMA_SUBVENTIONS[m.id];
      const klimabonus = sub ? sub.parUnite * qty : coutTravaux * 0.5;
      totalTravaux += coutTravaux;
      totalKlima += klimabonus;
      lignes.push({
        id: m.id,
        label: m.label,
        coutTravaux,
        klimabonus,
        klimaLabel: sub?.label || "50%",
      });
    }
    return { lignes, totalTravaux, totalKlima };
  }, [klimaMode, mesures]);

  // In detailed mode, use calculated total as montantTravaux for the simulation
  const montantTravauxEffectif = klimaMode === "detaille" && klimaDetail ? klimaDetail.totalTravaux : montantTravaux;
  const [revenuMenage, setRevenuMenage] = useState(80000);
  const [nbEmprunteurs, setNbEmprunteurs] = useState<1 | 2>(2);
  const [nbEnfants, setNbEnfants] = useState(1);
  const [typeBien, setTypeBien] = useState<"appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee">("appartement");
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [estNeuf, setEstNeuf] = useState(false);
  const [montantPret, setMontantPret] = useState(600000);
  const [epargneReguliere3ans, setEpargneReguliere3ans] = useState(true);
  const [commune, setCommune] = useState("Luxembourg-Ville");

  const result = useMemo(
    () =>
      simulerAides({
        typeProjet,
        prixBien,
        montantTravaux: typeProjet === "renovation" ? montantTravauxEffectif : undefined,
        revenuMenage,
        nbEmprunteurs,
        nbEnfants,
        typeBien,
        residencePrincipale,
        estNeuf,
        montantPret,
        epargneReguliere3ans,
        commune,
      }),
    [typeProjet, prixBien, montantTravauxEffectif, revenuMenage, nbEmprunteurs, nbEnfants, typeBien, residencePrincipale, estNeuf, montantPret, epargneReguliere3ans, commune]
  );

  // Group aides by category
  const aidesByCategorie = useMemo(() => {
    const groups: Record<string, AideDetail[]> = {};
    for (const aide of result.aides) {
      if (!groups[aide.categorie]) groups[aide.categorie] = [];
      groups[aide.categorie].push(aide);
    }
    return groups;
  }, [result.aides]);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-navy sm:text-3xl">
              Aid Simulator
            </h1>
            <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-semibold text-gold-dark">
              5 aid layers
            </span>
          </div>
          <p className="mt-2 text-muted">
            State acquisition + energy renovation + private + municipal + equity — the most comprehensive simulator in Luxembourg
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Inputs - 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Project</h2>
              <div className="space-y-4">
                <InputField
                  label="Project type"
                  type="select"
                  value={typeProjet}
                  onChange={(v) => setTypeProjet(v as "acquisition" | "construction" | "renovation")}
                  options={[
                    { value: "acquisition", label: "Acquisition (existing)" },
                    { value: "construction", label: "Construction / VEFA (new)" },
                    { value: "renovation", label: "Energy renovation" },
                  ]}
                />
                <InputField
                  label="Property price"
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="EUR"
                />
                {typeProjet === "renovation" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted">Klimabonus mode:</span>
                      <button
                        onClick={() => setKlimaMode("simplifie")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${klimaMode === "simplifie" ? "bg-navy text-white" : "bg-background text-muted border border-card-border"}`}
                      >
                        Simplified
                      </button>
                      <button
                        onClick={() => setKlimaMode("detaille")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${klimaMode === "detaille" ? "bg-navy text-white" : "bg-background text-muted border border-card-border"}`}
                      >
                        Detailed by measure
                      </button>
                    </div>

                    {klimaMode === "simplifie" ? (
                      <InputField
                        label="Works amount"
                        value={montantTravaux}
                        onChange={(v) => setMontantTravaux(Number(v))}
                        suffix="EUR"
                        hint="Energy renovation works"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-navy">Renovation measures</div>
                        {KLIMA_MESURES.map((m) => {
                          const state = mesures[m.id];
                          const sub = KLIMA_SUBVENTIONS[m.id];
                          return (
                            <div key={m.id} className={`rounded-lg border p-3 transition-colors ${state.active ? "border-navy/30 bg-navy/5" : "border-card-border bg-background"}`}>
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={state.active}
                                  onChange={(e) => setMesures((prev) => ({ ...prev, [m.id]: { ...prev[m.id], active: e.target.checked } }))}
                                  className="h-4 w-4 rounded border-gray-300 text-navy focus:ring-navy"
                                />
                                <span className="text-sm font-medium text-foreground flex-1">{m.label}</span>
                                <span className="text-[10px] text-teal font-medium">{sub?.label}</span>
                              </div>
                              {state.active && m.type !== "forfait" && (
                                <div className="mt-2 ml-6 flex items-center gap-2">
                                  <input
                                    type="number"
                                    value={state.quantite}
                                    onChange={(e) => setMesures((prev) => ({ ...prev, [m.id]: { ...prev[m.id], quantite: Math.max(1, Number(e.target.value)) } }))}
                                    className="w-20 rounded border border-input-border bg-input-bg px-2 py-1 text-sm text-right font-mono focus:border-navy focus:outline-none focus:ring-1 focus:ring-navy/20"
                                    min={1}
                                  />
                                  <span className="text-xs text-muted">{m.unitLabel}</span>
                                  <span className="text-xs text-muted ml-auto">
                                    Works: <span className="font-mono">{formatEUR(m.unitPrix * state.quantite)}</span>
                                  </span>
                                </div>
                              )}
                              {state.active && m.type === "forfait" && (
                                <div className="mt-1 ml-6 text-xs text-muted">
                                  Estimated works: <span className="font-mono">{formatEUR(m.unitPrix)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {klimaDetail && klimaDetail.lignes.length > 0 && (
                          <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 mt-2">
                            <div className="text-xs font-semibold text-teal mb-2">Klimabonus summary</div>
                            {klimaDetail.lignes.map((l) => (
                              <div key={l.id} className="flex justify-between text-xs py-0.5">
                                <span className="text-muted">{l.label} <span className="text-teal/70">({l.klimaLabel})</span></span>
                                <span className="font-mono font-medium text-teal">{formatEUR(l.klimabonus)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs font-semibold border-t border-teal/20 pt-1 mt-1">
                              <span className="text-foreground">Total works</span>
                              <span className="font-mono">{formatEUR(klimaDetail.totalTravaux)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-teal">Estimated total Klimabonus</span>
                              <span className="font-mono text-teal">{formatEUR(klimaDetail.totalKlima)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <InputField
                  label="Property type"
                  type="select"
                  value={typeBien}
                  onChange={(v) => setTypeBien(v as typeof typeBien)}
                  options={[
                    { value: "appartement", label: "Apartment / condominium (+40%)" },
                    { value: "maison_rangee", label: "Terraced house (+40%)" },
                    { value: "maison_jumelee", label: "Semi-detached house (+15%)" },
                    { value: "maison_isolee", label: "Detached house" },
                  ]}
                />
                <ToggleField
                  label="Primary residence"
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                />
                {typeProjet === "construction" && (
                  <ToggleField
                    label="New build"
                    checked={estNeuf}
                    onChange={setEstNeuf}
                    hint="Super-reduced VAT 3%"
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Profile</h2>
              <div className="space-y-4">
                <InputField
                  label="Annual household income"
                  value={revenuMenage}
                  onChange={(v) => setRevenuMenage(Number(v))}
                  suffix="EUR"
                />
                <InputField
                  label="Number of borrowers"
                  type="select"
                  value={String(nbEmprunteurs)}
                  onChange={(v) => setNbEmprunteurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: "1 borrower" },
                    { value: "2", label: "2 borrowers" },
                  ]}
                />
                <InputField
                  label="Number of dependent children"
                  value={nbEnfants}
                  onChange={(v) => setNbEnfants(Number(v))}
                  min={0}
                  max={10}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Financing</h2>
              <div className="space-y-4">
                <InputField
                  label="Loan amount"
                  value={montantPret}
                  onChange={(v) => setMontantPret(Number(v))}
                  suffix="EUR"
                />
                <ToggleField
                  label="Regular savings >= 3 years"
                  checked={epargneReguliere3ans}
                  onChange={setEpargneReguliere3ans}
                  hint="EUR 1,000/year min. — required for State guarantee and savings bonus"
                />
                <InputField
                  label="Municipality"
                  type="text"
                  value={commune}
                  onChange={setCommune}
                  hint="For specific municipal aids"
                />
              </div>
            </div>
          </div>

          {/* Results - 3 cols */}
          <div className="space-y-6 lg:col-span-3">
            {/* Total banner */}
            <div className="rounded-xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Direct aids</div>
                  <div className="mt-1 text-3xl font-bold">{formatEUR(result.totalAidesDirectes)}</div>
                  <div className="mt-1 text-xs text-white/50">Cash received or tax saved</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">Estimated savings</div>
                  <div className="mt-1 text-3xl font-bold text-gold-light">{formatEUR(result.totalEconomies)}</div>
                  <div className="mt-1 text-xs text-white/50">Interest avoided over the loan term</div>
                </div>
              </div>
              {result.garantieEtat && (
                <div className="mt-4 rounded-lg bg-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">State guarantee</div>
                      <div className="text-xs text-white/60">
                        Public surety of {formatEUR(result.garantieEtat.montantGaranti)} — this is not cash,
                        it is a guarantee that replaces private bank surety
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">Actual saving</div>
                      <div className="text-lg font-bold text-gold-light">
                        ~{formatEUR(result.garantieEtat.economieEstimee)}
                      </div>
                      <div className="text-[10px] text-white/40">~1.5% of guaranteed amount</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 border-t border-white/20 pt-3 flex items-center justify-between">
                <span className="text-sm text-white/70">Total estimated benefit</span>
                <span className="text-2xl font-bold">{formatEUR(result.totalGeneral)}</span>
              </div>
            </div>

            {!residencePrincipale && (
              <div className="rounded-xl border-2 border-warning/30 bg-amber-50 p-6">
                <h3 className="text-base font-semibold text-warning">Primary residence required</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Nearly all Luxembourg housing aids are conditional on occupying the property as a
                  primary residence. Enable this option to see the available aids.
                </p>
              </div>
            )}

            {/* Aides grouped by category */}
            {Object.entries(aidesByCategorie).map(([categorie, aides]) => (
              <div key={categorie}>
                <h3 className={`mb-3 text-sm font-semibold uppercase tracking-wider ${CATEGORIE_LABELS[categorie]?.color || "text-slate"}`}>
                  {CATEGORIE_LABELS[categorie]?.label || categorie}
                  <span className="ml-2 text-xs font-normal text-muted">
                    ({formatEUR(result.totalParCategorie[categorie] || 0)})
                  </span>
                </h3>
                <div className="space-y-3">
                  {aides.map((aide, i) => (
                    <AideCard key={i} aide={aide} />
                  ))}
                </div>
              </div>
            ))}

            {/* Disclaimer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">Important</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">Estimates</strong> — The amounts shown are estimates
                  based on official scales. Actual aids depend on the review of your application
                  by the Ministry of Housing and relevant agencies.
                </p>
                <p>
                  <strong className="text-slate">Municipal aids</strong> — Each municipality votes its own
                  aids through municipal regulations. They are cumulative with State aids. Documented examples:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted mt-1">
                  <li><strong>Luxembourg-Ville</strong> — Facade renovation subsidy: EUR 750 to 20,000 per
                  building in a protected area, +10% in the UNESCO zone (Urbanisme department)</li>
                  <li><strong>Lintgen</strong> — 50% of the State aid, capped at EUR 1,500</li>
                  <li><strong>Bertrange</strong> — Municipal complement ~50% of State aid (variable cap)</li>
                  <li><strong>Beckerich</strong> — Renewable energy and renovation supplements (Klimapakt municipality)</li>
                  <li><strong>Esch-sur-Alzette / Dudelange</strong> — Facade subsidies in urban renewal zones</li>
                </ul>
                <p className="mt-2 text-xs text-muted">
                  Contact the urbanisme/housing department of your municipality for the exact amounts currently in force.
                  Regulations are voted by the municipal council and may change.
                </p>
                <p>
                  <strong className="text-slate">Stacking</strong> — The 5 aid layers are in principle
                  cumulative, up to an overall cap of EUR 35,000 for capital bonuses.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
