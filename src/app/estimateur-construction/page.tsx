"use client";

import { useState, useMemo, Fragment } from "react";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";

/* ------------------------------------------------------------------ */
/*  STATEC classification — corps de métier                           */
/* ------------------------------------------------------------------ */

interface CorpsMetier {
  id: string;
  nom: string;
  categorie: "gros_oeuvre" | "toiture" | "fermeture" | "installations" | "parachevement";
  pctPoids: number;
  coutM2Min: number;
  coutM2Max: number;
  coutM2Defaut: number;
  indiceSTATEC: number;
  description: string;
}

const CORPS_METIER: CorpsMetier[] = [
  // GROS OEUVRE (37% du total)
  { id: "terrassement", nom: "Terrassement", categorie: "gros_oeuvre", pctPoids: 8, coutM2Min: 80, coutM2Max: 200, coutM2Defaut: 120, indiceSTATEC: -0.6, description: "Fouilles, décapage, remblais, évacuation terres" },
  { id: "maconnerie", nom: "Maçonnerie / Béton armé", categorie: "gros_oeuvre", pctPoids: 29, coutM2Min: 350, coutM2Max: 650, coutM2Defaut: 480, indiceSTATEC: 1.2, description: "Fondations, murs porteurs, dalles, structure béton" },

  // TOITURE (6.6% du total)
  { id: "charpente", nom: "Charpente bois", categorie: "toiture", pctPoids: 3, coutM2Min: 40, coutM2Max: 100, coutM2Defaut: 65, indiceSTATEC: 1.3, description: "Structure portante toiture" },
  { id: "couverture", nom: "Couverture", categorie: "toiture", pctPoids: 2.5, coutM2Min: 35, coutM2Max: 80, coutM2Defaut: 55, indiceSTATEC: 1.0, description: "Tuiles, ardoises, étanchéité toiture" },
  { id: "zinguerie", nom: "Ferblanterie / Zinguerie", categorie: "toiture", pctPoids: 1.1, coutM2Min: 15, coutM2Max: 40, coutM2Defaut: 25, indiceSTATEC: 1.0, description: "Gouttières, descentes, noues, solins" },

  // FERMETURE DU BATIMENT (16.2% du total)
  { id: "menuiserie_ext", nom: "Menuiserie extérieure", categorie: "fermeture", pctPoids: 10, coutM2Min: 120, coutM2Max: 280, coutM2Defaut: 180, indiceSTATEC: 1.2, description: "Fenêtres, portes extérieures, volets, baies vitrées" },
  { id: "facade", nom: "Façade / Isolation ext.", categorie: "fermeture", pctPoids: 6.2, coutM2Min: 80, coutM2Max: 200, coutM2Defaut: 130, indiceSTATEC: 0.3, description: "Enduit, bardage, isolation thermique extérieure (ITE)" },

  // INSTALLATIONS TECHNIQUES (18.4% du total)
  { id: "sanitaire", nom: "Installations sanitaires", categorie: "installations", pctPoids: 5, coutM2Min: 60, coutM2Max: 150, coutM2Defaut: 95, indiceSTATEC: 1.0, description: "Plomberie, canalisations, appareils sanitaires" },
  { id: "chauffage", nom: "Chauffage / Ventilation", categorie: "installations", pctPoids: 7.4, coutM2Min: 90, coutM2Max: 250, coutM2Defaut: 150, indiceSTATEC: 1.1, description: "PAC, radiateurs, plancher chauffant, VMC double flux" },
  { id: "electricite", nom: "Installations électriques", categorie: "installations", pctPoids: 6, coutM2Min: 70, coutM2Max: 180, coutM2Defaut: 110, indiceSTATEC: 1.9, description: "Câblage, tableau, prises, éclairage, domotique" },

  // PARACHEVEMENT (21.8% du total)
  { id: "platrerie", nom: "Plâtrerie / Cloisons", categorie: "parachevement", pctPoids: 4, coutM2Min: 45, coutM2Max: 100, coutM2Defaut: 65, indiceSTATEC: 0.1, description: "Cloisons, faux plafonds, doublages" },
  { id: "chapes", nom: "Chapes et enduits", categorie: "parachevement", pctPoids: 2.8, coutM2Min: 30, coutM2Max: 65, coutM2Defaut: 45, indiceSTATEC: 0.0, description: "Chapes béton, enduits intérieurs" },
  { id: "carrelage", nom: "Carrelage", categorie: "parachevement", pctPoids: 3.5, coutM2Min: 40, coutM2Max: 120, coutM2Defaut: 70, indiceSTATEC: 0.3, description: "Carrelage sol et mur, faïence" },
  { id: "revetements", nom: "Revêtements de sol", categorie: "parachevement", pctPoids: 2.5, coutM2Min: 30, coutM2Max: 100, coutM2Defaut: 55, indiceSTATEC: 1.0, description: "Parquet, vinyle, moquette" },
  { id: "menuiserie_int", nom: "Menuiserie int. / Serrurerie", categorie: "parachevement", pctPoids: 4, coutM2Min: 50, coutM2Max: 130, coutM2Defaut: 80, indiceSTATEC: 1.0, description: "Portes intérieures, placards, garde-corps" },
  { id: "peinture", nom: "Peinture / Revêtements muraux", categorie: "parachevement", pctPoids: 3, coutM2Min: 25, coutM2Max: 60, coutM2Defaut: 40, indiceSTATEC: 1.0, description: "Peinture, papier peint, finitions murales" },
  { id: "marbrerie", nom: "Marbrerie", categorie: "parachevement", pctPoids: 2, coutM2Min: 15, coutM2Max: 50, coutM2Defaut: 25, indiceSTATEC: 0.4, description: "Seuils, appuis, escaliers en pierre" },
];

const CATEGORIES = [
  { id: "gros_oeuvre" as const, nom: "Gros œuvre", couleur: "#1e3a5f" },
  { id: "toiture" as const, nom: "Toiture", couleur: "#b8860b" },
  { id: "fermeture" as const, nom: "Fermeture du bâtiment", couleur: "#2c7a7b" },
  { id: "installations" as const, nom: "Installations techniques", couleur: "#4a90d9" },
  { id: "parachevement" as const, nom: "Parachèvement", couleur: "#6b7280" },
] as const;

type NiveauFinition = "standard" | "moyen" | "haut_de_gamme" | "luxe";
type ClasseEnergetique = "AAA" | "A+" | "A" | "B" | "C";
type TypeBatiment = "maison_individuelle" | "maison_jumelee" | "maison_rangee" | "immeuble_collectif";

function getDefaultCost(cm: CorpsMetier, niveau: NiveauFinition): number {
  const range = cm.coutM2Max - cm.coutM2Min;
  switch (niveau) {
    case "standard": return Math.round(cm.coutM2Min + range * 0.2);
    case "moyen": return cm.coutM2Defaut;
    case "haut_de_gamme": return Math.round(cm.coutM2Min + range * 0.75);
    case "luxe": return cm.coutM2Max;
  }
}

function getEnergyFactor(classe: ClasseEnergetique): number {
  switch (classe) {
    case "AAA": return 1.35;
    case "A+": return 1.20;
    case "A": return 1.10;
    case "B": return 1.00;
    case "C": return 0.90;
  }
}

const ENERGY_IDS = new Set(["chauffage", "facade", "menuiserie_ext"]);

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function EstimateurConstruction() {
  // --- Projet ---
  const [surfaceBrute, setSurfaceBrute] = useState(250);
  const [typeBatiment, setTypeBatiment] = useState<TypeBatiment>("maison_individuelle");
  const [nbNiveaux, setNbNiveaux] = useState(2);
  const [classeEnergetique, setClasseEnergetique] = useState<ClasseEnergetique>("A");
  const [niveauFinition, setNiveauFinition] = useState<NiveauFinition>("moyen");

  // --- Costs per trade (overrideable via sliders) ---
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  // Reset overrides when niveauFinition changes
  const setNiveauAndReset = (n: NiveauFinition) => {
    setNiveauFinition(n);
    setOverrides({});
  };

  // --- Frais annexes ---
  const [honorairesArchitecte, setHonorairesArchitecte] = useState(10);
  const [honorairesBET, setHonorairesBET] = useState(3.5);
  const [etudesSol, setEtudesSol] = useState(1500);
  const [raccordements, setRaccordements] = useState(15000);
  const [amenagementExt, setAmenagementExt] = useState(25000);
  const [aleas, setAleas] = useState(5);

  // --- Adjusted cost per trade ---
  const adjustedCosts = useMemo(() => {
    const energyFactor = getEnergyFactor(classeEnergetique);
    const isCollectif = typeBatiment === "immeuble_collectif";

    return CORPS_METIER.map((cm) => {
      const baseCost = overrides[cm.id] ?? getDefaultCost(cm, niveauFinition);
      let adjusted = baseCost;

      // Energy class adjustment
      if (ENERGY_IDS.has(cm.id)) {
        adjusted = Math.round(adjusted * energyFactor);
      }

      // Building type: collectif reduces terrassement & toiture trades
      if (isCollectif && (cm.categorie === "toiture" || cm.id === "terrassement")) {
        adjusted = Math.round(adjusted * 0.6);
      }

      return { ...cm, coutAjuste: adjusted };
    });
  }, [overrides, niveauFinition, classeEnergetique, typeBatiment]);

  // --- Calculations ---
  const result = useMemo(() => {
    const costPerTrade = adjustedCosts.map((cm) => ({
      ...cm,
      total: surfaceBrute * cm.coutAjuste,
    }));

    const totalConstruction = costPerTrade.reduce((s, t) => s + t.total, 0);

    const totalParCategorie = CATEGORIES.map((cat) => {
      const trades = costPerTrade.filter((t) => t.categorie === cat.id);
      const total = trades.reduce((s, t) => s + t.total, 0);
      return { ...cat, total, pct: totalConstruction > 0 ? total / totalConstruction : 0, trades };
    });

    const fraisArchitecte = totalConstruction * (honorairesArchitecte / 100);
    const fraisBET = totalConstruction * (honorairesBET / 100);
    const fraisAleas = totalConstruction * (aleas / 100);
    const totalFraisAnnexes = fraisArchitecte + fraisBET + etudesSol + raccordements + amenagementExt + fraisAleas;

    const totalProjet = totalConstruction + totalFraisAnnexes;
    const coutM2Total = surfaceBrute > 0 ? totalProjet / surfaceBrute : 0;
    const coutM2Construction = surfaceBrute > 0 ? totalConstruction / surfaceBrute : 0;

    const partConstruction = totalProjet > 0 ? totalConstruction / totalProjet : 0;
    const partFrais = totalProjet > 0 ? totalFraisAnnexes / totalProjet : 0;

    return {
      costPerTrade,
      totalConstruction,
      totalParCategorie,
      fraisArchitecte,
      fraisBET,
      fraisAleas,
      totalFraisAnnexes,
      totalProjet,
      coutM2Total,
      coutM2Construction,
      partConstruction,
      partFrais,
    };
  }, [adjustedCosts, surfaceBrute, honorairesArchitecte, honorairesBET, etudesSol, raccordements, amenagementExt, aleas]);

  // --- Helpers ---
  function setTradeCost(id: string, val: number) {
    setOverrides((prev) => ({ ...prev, [id]: val }));
  }

  function sliderDefault(cm: CorpsMetier): number {
    return overrides[cm.id] ?? getDefaultCost(cm, niveauFinition);
  }

  // --- Render ---
  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            Estimateur de co&ucirc;t de construction
          </h1>
          <p className="mt-2 text-muted">
            D&eacute;composition d&eacute;taill&eacute;e par corps de m&eacute;tier &mdash; Classification STATEC Luxembourg
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ============ INPUTS ============ */}
          <div className="space-y-6">
            {/* --- Projet --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Projet</h2>
              <div className="space-y-4">
                <InputField
                  label="Surface construite brute"
                  value={surfaceBrute}
                  onChange={(v) => setSurfaceBrute(Number(v))}
                  suffix="m&sup2;"
                  min={50}
                  max={5000}
                  step={10}
                  hint="Surface hors-tout, tous niveaux confondus"
                />
                <InputField
                  label="Type de b&acirc;timent"
                  type="select"
                  value={typeBatiment}
                  onChange={(v) => setTypeBatiment(v as TypeBatiment)}
                  options={[
                    { value: "maison_individuelle", label: "Maison individuelle" },
                    { value: "maison_jumelee", label: "Maison jumelée" },
                    { value: "maison_rangee", label: "Maison en rangée" },
                    { value: "immeuble_collectif", label: "Immeuble collectif" },
                  ]}
                />
                <InputField
                  label="Nombre de niveaux"
                  value={nbNiveaux}
                  onChange={(v) => setNbNiveaux(Math.max(1, Math.min(10, Number(v))))}
                  min={1}
                  max={10}
                  step={1}
                />
                <InputField
                  label="Classe &eacute;nerg&eacute;tique vis&eacute;e"
                  type="select"
                  value={classeEnergetique}
                  onChange={(v) => setClasseEnergetique(v as ClasseEnergetique)}
                  options={[
                    { value: "AAA", label: "AAA (passif)" },
                    { value: "A+", label: "A+" },
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "C", label: "C" },
                  ]}
                  hint="Impact sur chauffage, façade et menuiseries extérieures"
                />
                <InputField
                  label="Niveau de finition"
                  type="select"
                  value={niveauFinition}
                  onChange={(v) => setNiveauAndReset(v as NiveauFinition)}
                  options={[
                    { value: "standard", label: "Standard" },
                    { value: "moyen", label: "Moyen" },
                    { value: "haut_de_gamme", label: "Haut de gamme" },
                    { value: "luxe", label: "Luxe" },
                  ]}
                  hint="Ajuste les coûts par défaut de chaque corps de métier"
                />
              </div>
            </div>

            {/* --- Corps de métier sliders --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">
                Co&ucirc;ts par corps de m&eacute;tier (&euro;/m&sup2;)
              </h2>
              <p className="mb-4 text-xs text-muted">
                Ajustez chaque poste selon votre projet. Les valeurs par d&eacute;faut correspondent au niveau de finition s&eacute;lectionn&eacute;.
              </p>

              {CATEGORIES.map((cat) => {
                const trades = CORPS_METIER.filter((cm) => cm.categorie === cat.id);
                return (
                  <div key={cat.id} className="mb-6 last:mb-0">
                    <div className="mb-3 flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-sm"
                        style={{ backgroundColor: cat.couleur }}
                      />
                      <h3 className="text-sm font-semibold text-slate">{cat.nom}</h3>
                    </div>
                    <div className="space-y-4 pl-5">
                      {trades.map((cm) => (
                        <SliderField
                          key={cm.id}
                          label={cm.nom}
                          value={sliderDefault(cm)}
                          onChange={(v) => setTradeCost(cm.id, v)}
                          min={cm.coutM2Min}
                          max={cm.coutM2Max}
                          step={5}
                          suffix="&euro;/m&sup2;"
                          hint={`${cm.description} | STATEC oct. 2025 : ${cm.indiceSTATEC >= 0 ? "+" : ""}${cm.indiceSTATEC.toFixed(1)} %`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- Frais annexes --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Frais annexes</h2>
              <div className="space-y-4">
                <SliderField
                  label="Honoraires architecte"
                  value={honorairesArchitecte}
                  onChange={setHonorairesArchitecte}
                  min={6}
                  max={14}
                  step={0.5}
                  suffix="%"
                  hint="Pourcentage du coût de construction"
                />
                <SliderField
                  label="Honoraires BET"
                  value={honorairesBET}
                  onChange={setHonorairesBET}
                  min={2}
                  max={6}
                  step={0.5}
                  suffix="%"
                  hint="Bureau d'études techniques"
                />
                <SliderField
                  label="Études de sol"
                  value={etudesSol}
                  onChange={setEtudesSol}
                  min={800}
                  max={3000}
                  step={100}
                  suffix="&euro;"
                />
                <SliderField
                  label="Raccordements VRD"
                  value={raccordements}
                  onChange={setRaccordements}
                  min={5000}
                  max={35000}
                  step={500}
                  suffix="&euro;"
                  hint="Eau, électricité, gaz, télécom, assainissement"
                />
                <SliderField
                  label="Aménagement extérieur"
                  value={amenagementExt}
                  onChange={setAmenagementExt}
                  min={0}
                  max={80000}
                  step={1000}
                  suffix="&euro;"
                  hint="Terrassement extérieur, clôture, plantations"
                />
                <SliderField
                  label="Aléas / Imprévus"
                  value={aleas}
                  onChange={setAleas}
                  min={3}
                  max={10}
                  step={0.5}
                  suffix="%"
                  hint="Pourcentage du coût de construction"
                />
              </div>
            </div>
          </div>

          {/* ============ RESULTS ============ */}
          <div className="space-y-6">
            {/* --- Hero: coût total --- */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">Budget total projet</div>
              <div className="mt-2 text-4xl font-bold sm:text-5xl">{formatEUR(result.totalProjet)}</div>
              <div className="mt-2 text-sm text-white/60">
                soit {formatEUR(result.coutM2Total)}/m&sup2; brut
              </div>
            </div>

            {/* --- Coût de construction --- */}
            <ResultPanel
              title="Co&ucirc;t de construction"
              lines={[
                ...result.totalParCategorie.map((cat) => ({
                  label: `${cat.nom} (${formatPct(cat.pct)})`,
                  value: formatEUR(cat.total),
                })),
                { label: "Total construction", value: formatEUR(result.totalConstruction), highlight: true, large: true },
                { label: "Coût/m² construction", value: `${formatEUR(result.coutM2Construction)}/m²`, sub: true },
              ]}
            />

            {/* --- Stacked bar --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">R&eacute;partition par cat&eacute;gorie</h3>
              {/* Bar */}
              <div className="flex h-8 w-full overflow-hidden rounded-lg">
                {result.totalParCategorie.map((cat) => (
                  <div
                    key={cat.id}
                    style={{
                      width: `${(cat.pct * 100).toFixed(1)}%`,
                      backgroundColor: cat.couleur,
                      minWidth: cat.pct > 0 ? "2px" : "0",
                    }}
                    title={`${cat.nom}: ${formatPct(cat.pct)}`}
                  />
                ))}
              </div>
              {/* Legend */}
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                {result.totalParCategorie.map((cat) => (
                  <div key={cat.id} className="flex items-center gap-1.5 text-xs text-slate">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ backgroundColor: cat.couleur }}
                    />
                    <span>{cat.nom} {formatPct(cat.pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Détail par corps de métier --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">D&eacute;tail par corps de m&eacute;tier</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border text-left">
                      <th className="py-2 pr-3 font-semibold text-slate">Corps de m&eacute;tier</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">&euro;/m&sup2;</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">Co&ucirc;t</th>
                      <th className="py-2 pl-3 font-semibold text-slate text-right">% total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.totalParCategorie.map((cat) => (
                      <Fragment key={cat.id}>
                        <tr className="border-b border-card-border">
                          <td colSpan={4} className="py-2 font-semibold text-white text-xs px-2 rounded-sm" style={{ backgroundColor: cat.couleur }}>
                            {cat.nom} &mdash; {formatEUR(cat.total)} ({formatPct(cat.pct)})
                          </td>
                        </tr>
                        {cat.trades.map((trade) => {
                          const pct = result.totalConstruction > 0 ? trade.total / result.totalConstruction : 0;
                          return (
                            <tr key={trade.id} className="border-b border-card-border/50">
                              <td className="py-1.5 pr-3 pl-4 text-slate">{trade.nom}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-muted">{formatEUR(trade.coutAjuste)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-foreground">{formatEUR(trade.total)}</td>
                              <td className="py-1.5 pl-3 text-right font-mono text-muted">{formatPct(pct)}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                    <tr className="border-t-2 border-navy">
                      <td className="py-2 pr-3 font-semibold text-navy">Total</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-navy">{formatEUR(result.coutM2Construction)}</td>
                      <td className="py-2 px-3 text-right font-mono font-semibold text-navy">{formatEUR(result.totalConstruction)}</td>
                      <td className="py-2 pl-3 text-right font-mono font-semibold text-navy">100 %</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* --- Frais annexes --- */}
            <ResultPanel
              title="Frais annexes"
              lines={[
                { label: `Architecte (${honorairesArchitecte} %)`, value: formatEUR(result.fraisArchitecte) },
                { label: `BET (${honorairesBET} %)`, value: formatEUR(result.fraisBET) },
                { label: "Études de sol", value: formatEUR(etudesSol) },
                { label: "Raccordements VRD", value: formatEUR(raccordements) },
                { label: "Aménagement extérieur", value: formatEUR(amenagementExt) },
                { label: `Aléas (${aleas} %)`, value: formatEUR(result.fraisAleas) },
                { label: "Total frais annexes", value: formatEUR(result.totalFraisAnnexes), highlight: true },
              ]}
            />

            {/* --- Budget total --- */}
            <ResultPanel
              title="Budget total"
              lines={[
                { label: "Total construction", value: formatEUR(result.totalConstruction) },
                { label: "Total frais annexes", value: formatEUR(result.totalFraisAnnexes) },
                { label: "BUDGET TOTAL", value: formatEUR(result.totalProjet), highlight: true, large: true },
                { label: "Coût total/m²", value: `${formatEUR(result.coutM2Total)}/m²`, sub: true },
                { label: "Part construction", value: formatPct(result.partConstruction), sub: true },
                { label: "Part frais annexes", value: formatPct(result.partFrais), sub: true },
              ]}
            />

            {/* --- Sources --- */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>Sources :</strong> STATEC &mdash; Indice semestriel des prix de la construction (oct. 2025, base 100 = 1970, indice g&eacute;n&eacute;ral 1173,24). Pond&eacute;rations par corps de m&eacute;tier issues du panier STATEC. Fourchettes de prix : moyenne march&eacute; luxembourgeois 2025-2026 (tack.lu, maison.lu, renov.lu).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
