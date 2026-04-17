"use client";

import { useState, useMemo, Fragment } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatPct } from "@/lib/calculations";
import { generateConstructionPdfBlob, PdfButton } from "@/components/ToolsPdf";
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOContent from "@/components/SEOContent";

/* ------------------------------------------------------------------ */
/*  STATEC classification — corps de métier                           */
/* ------------------------------------------------------------------ */

interface CorpsMetier {
  id: string;
  nomKey: string;
  categorie: "gros_oeuvre" | "toiture" | "fermeture" | "installations" | "parachevement";
  pctPoids: number;
  coutM2Min: number;
  coutM2Max: number;
  coutM2Defaut: number;
  indiceSTATEC: number;
  descKey: string;
}

const CORPS_METIER: CorpsMetier[] = [
  // GROS OEUVRE (37% du total)
  { id: "terrassement", nomKey: "tradeTerrassement", categorie: "gros_oeuvre", pctPoids: 8, coutM2Min: 80, coutM2Max: 200, coutM2Defaut: 120, indiceSTATEC: -0.6, descKey: "tradeDescTerrassement" },
  { id: "maconnerie", nomKey: "tradeMaconnerie", categorie: "gros_oeuvre", pctPoids: 29, coutM2Min: 350, coutM2Max: 650, coutM2Defaut: 480, indiceSTATEC: 1.2, descKey: "tradeDescMaconnerie" },

  // TOITURE (6.6% du total)
  { id: "charpente", nomKey: "tradeCharpente", categorie: "toiture", pctPoids: 3, coutM2Min: 40, coutM2Max: 100, coutM2Defaut: 65, indiceSTATEC: 1.3, descKey: "tradeDescCharpente" },
  { id: "couverture", nomKey: "tradeCouverture", categorie: "toiture", pctPoids: 2.5, coutM2Min: 35, coutM2Max: 80, coutM2Defaut: 55, indiceSTATEC: 1.0, descKey: "tradeDescCouverture" },
  { id: "zinguerie", nomKey: "tradeZinguerie", categorie: "toiture", pctPoids: 1.1, coutM2Min: 15, coutM2Max: 40, coutM2Defaut: 25, indiceSTATEC: 1.0, descKey: "tradeDescZinguerie" },

  // FERMETURE DU BATIMENT (16.2% du total)
  { id: "menuiserie_ext", nomKey: "tradeMenuiserieExt", categorie: "fermeture", pctPoids: 10, coutM2Min: 120, coutM2Max: 280, coutM2Defaut: 180, indiceSTATEC: 1.2, descKey: "tradeDescMenuiserieExt" },
  { id: "facade", nomKey: "tradeFacade", categorie: "fermeture", pctPoids: 6.2, coutM2Min: 80, coutM2Max: 200, coutM2Defaut: 130, indiceSTATEC: 0.3, descKey: "tradeDescFacade" },

  // INSTALLATIONS TECHNIQUES (18.4% du total)
  { id: "sanitaire", nomKey: "tradeSanitaire", categorie: "installations", pctPoids: 5, coutM2Min: 60, coutM2Max: 150, coutM2Defaut: 95, indiceSTATEC: 1.0, descKey: "tradeDescSanitaire" },
  { id: "chauffage", nomKey: "tradeChauffage", categorie: "installations", pctPoids: 7.4, coutM2Min: 90, coutM2Max: 250, coutM2Defaut: 150, indiceSTATEC: 1.1, descKey: "tradeDescChauffage" },
  { id: "electricite", nomKey: "tradeElectricite", categorie: "installations", pctPoids: 6, coutM2Min: 70, coutM2Max: 180, coutM2Defaut: 110, indiceSTATEC: 1.9, descKey: "tradeDescElectricite" },

  // PARACHEVEMENT (21.8% du total)
  { id: "platrerie", nomKey: "tradePlatrerie", categorie: "parachevement", pctPoids: 4, coutM2Min: 45, coutM2Max: 100, coutM2Defaut: 65, indiceSTATEC: 0.1, descKey: "tradeDescPlatrerie" },
  { id: "chapes", nomKey: "tradeChapes", categorie: "parachevement", pctPoids: 2.8, coutM2Min: 30, coutM2Max: 65, coutM2Defaut: 45, indiceSTATEC: 0.0, descKey: "tradeDescChapes" },
  { id: "carrelage", nomKey: "tradeCarrelage", categorie: "parachevement", pctPoids: 3.5, coutM2Min: 40, coutM2Max: 120, coutM2Defaut: 70, indiceSTATEC: 0.3, descKey: "tradeDescCarrelage" },
  { id: "revetements", nomKey: "tradeRevetements", categorie: "parachevement", pctPoids: 2.5, coutM2Min: 30, coutM2Max: 100, coutM2Defaut: 55, indiceSTATEC: 1.0, descKey: "tradeDescRevetements" },
  { id: "menuiserie_int", nomKey: "tradeMenuiserieInt", categorie: "parachevement", pctPoids: 4, coutM2Min: 50, coutM2Max: 130, coutM2Defaut: 80, indiceSTATEC: 1.0, descKey: "tradeDescMenuiserieInt" },
  { id: "peinture", nomKey: "tradePeinture", categorie: "parachevement", pctPoids: 3, coutM2Min: 25, coutM2Max: 60, coutM2Defaut: 40, indiceSTATEC: 1.0, descKey: "tradeDescPeinture" },
  { id: "marbrerie", nomKey: "tradeMarbrerie", categorie: "parachevement", pctPoids: 2, coutM2Min: 15, coutM2Max: 50, coutM2Defaut: 25, indiceSTATEC: 0.4, descKey: "tradeDescMarbrerie" },
];

type CategorieId = "gros_oeuvre" | "toiture" | "fermeture" | "installations" | "parachevement";

const CATEGORIES: { id: CategorieId; nomKey: string; couleur: string }[] = [
  { id: "gros_oeuvre", nomKey: "catGrosOeuvre", couleur: "#1e3a5f" },
  { id: "toiture", nomKey: "catToiture", couleur: "#b8860b" },
  { id: "fermeture", nomKey: "catFermeture", couleur: "#2c7a7b" },
  { id: "installations", nomKey: "catInstallations", couleur: "#4a90d9" },
  { id: "parachevement", nomKey: "catParachevement", couleur: "#6b7280" },
];

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
  const t = useTranslations("estimateurConstruction");
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
        <Breadcrumbs />
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ============ INPUTS ============ */}
          <div className="space-y-6">
            {/* --- Projet --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionProjet")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("surfaceBrute")}
                  value={surfaceBrute}
                  onChange={(v) => setSurfaceBrute(Number(v))}
                  suffix="m&sup2;"
                  min={50}
                  max={5000}
                  step={10}
                  hint={t("surfaceBruteHint")}
                />
                <InputField
                  label={t("typeBatiment")}
                  type="select"
                  value={typeBatiment}
                  onChange={(v) => setTypeBatiment(v as TypeBatiment)}
                  options={[
                    { value: "maison_individuelle", label: t("maisonIndividuelle") },
                    { value: "maison_jumelee", label: t("maisonJumelee") },
                    { value: "maison_rangee", label: t("maisonRangee") },
                    { value: "immeuble_collectif", label: t("immeubleCollectif") },
                  ]}
                />
                <InputField
                  label={t("nbNiveaux")}
                  value={nbNiveaux}
                  onChange={(v) => setNbNiveaux(Math.max(1, Math.min(10, Number(v))))}
                  min={1}
                  max={10}
                  step={1}
                />
                <InputField
                  label={t("classeEnergetique")}
                  type="select"
                  value={classeEnergetique}
                  onChange={(v) => setClasseEnergetique(v as ClasseEnergetique)}
                  options={[
                    { value: "AAA", label: t("classeAAA") },
                    { value: "A+", label: "A+" },
                    { value: "A", label: "A" },
                    { value: "B", label: "B" },
                    { value: "C", label: "C" },
                  ]}
                  hint={t("classeEnergetiqueHint")}
                />
                <InputField
                  label={t("niveauFinition")}
                  type="select"
                  value={niveauFinition}
                  onChange={(v) => setNiveauAndReset(v as NiveauFinition)}
                  options={[
                    { value: "standard", label: t("finitionStandard") },
                    { value: "moyen", label: t("finitionMoyen") },
                    { value: "haut_de_gamme", label: t("finitionHautDeGamme") },
                    { value: "luxe", label: t("finitionLuxe") },
                  ]}
                  hint={t("niveauFinitionHint")}
                />
              </div>
            </div>

            {/* --- Corps de métier sliders --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">
                {t("sectionCorpsMetier")}
              </h2>
              <p className="mb-4 text-xs text-muted">
                {t("sectionCorpsMetierHint")}
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
                      <h3 className="text-sm font-semibold text-slate">{t(cat.nomKey)}</h3>
                    </div>
                    <div className="space-y-4 pl-5">
                      {trades.map((cm) => (
                        <SliderField
                          key={cm.id}
                          label={t(cm.nomKey)}
                          value={sliderDefault(cm)}
                          onChange={(v) => setTradeCost(cm.id, v)}
                          min={cm.coutM2Min}
                          max={cm.coutM2Max}
                          step={5}
                          suffix="&euro;/m&sup2;"
                          hint={`${t(cm.descKey)} | STATEC oct. 2025 : ${cm.indiceSTATEC >= 0 ? "+" : ""}${cm.indiceSTATEC.toFixed(1)} %`}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* --- Frais annexes --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFraisAnnexes")}</h2>
              <div className="space-y-4">
                <SliderField
                  label={t("honorairesArchitecte")}
                  value={honorairesArchitecte}
                  onChange={setHonorairesArchitecte}
                  min={6}
                  max={14}
                  step={0.5}
                  suffix="%"
                  hint={t("honorairesArchitecteHint")}
                />
                <SliderField
                  label={t("honorairesBET")}
                  value={honorairesBET}
                  onChange={setHonorairesBET}
                  min={2}
                  max={6}
                  step={0.5}
                  suffix="%"
                  hint={t("honorairesBETHint")}
                />
                <SliderField
                  label={t("etudesSol")}
                  value={etudesSol}
                  onChange={setEtudesSol}
                  min={800}
                  max={3000}
                  step={100}
                  suffix="&euro;"
                />
                <SliderField
                  label={t("raccordements")}
                  value={raccordements}
                  onChange={setRaccordements}
                  min={5000}
                  max={35000}
                  step={500}
                  suffix="&euro;"
                  hint={t("raccordementsHint")}
                />
                <SliderField
                  label={t("amenagementExt")}
                  value={amenagementExt}
                  onChange={setAmenagementExt}
                  min={0}
                  max={80000}
                  step={1000}
                  suffix="&euro;"
                  hint={t("amenagementExtHint")}
                />
                <SliderField
                  label={t("aleas")}
                  value={aleas}
                  onChange={setAleas}
                  min={3}
                  max={10}
                  step={0.5}
                  suffix="%"
                  hint={t("aleasHint")}
                />
              </div>
            </div>
          </div>

          {/* ============ RESULTS ============ */}
          <div className="space-y-6">
            {/* --- Hero: coût total --- */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">{t("budgetTotalProjet")}</div>
              <div className="mt-2 text-4xl font-bold sm:text-5xl">{formatEUR(result.totalProjet)}</div>
              <div className="mt-2 text-sm text-white/60">
                {t("soitParM2Brut", { montant: formatEUR(result.coutM2Total) })}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-center">
              <PdfButton
                label="PDF"
                filename={`estimateur-construction-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() => generateConstructionPdfBlob({
                  surfaceBrute,
                  typeBatiment,
                  classeEnergetique,
                  niveauFinition,
                  categories: result.totalParCategorie.map(c => ({ nom: t(c.nomKey), total: c.total, pct: c.pct })),
                  totalConstruction: result.totalConstruction,
                  coutM2Construction: result.coutM2Construction,
                  fraisArchitecte: result.fraisArchitecte,
                  fraisBET: result.fraisBET,
                  etudesSol,
                  raccordements,
                  amenagementExt,
                  fraisAleas: result.fraisAleas,
                  totalFraisAnnexes: result.totalFraisAnnexes,
                  totalProjet: result.totalProjet,
                  coutM2Total: result.coutM2Total,
                })}
              />
              <button
                onClick={() => {
                  // Bordereau Excel/CSV : 1 ligne par poste, prêt à envoyer aux entreprises
                  const sep = ";"; // Excel FR
                  const lines: string[] = [];
                  lines.push(["Catégorie","Corps de métier","Prix €/m²","Quantité m²","Total €","% du total"].join(sep));
                  for (const cat of result.totalParCategorie) {
                    lines.push([t(cat.nomKey),"","","",Math.round(cat.total).toString(),`${(cat.pct*100).toFixed(1)}%`].join(sep));
                    for (const tr of cat.trades) {
                      const pct = result.totalConstruction > 0 ? tr.total / result.totalConstruction : 0;
                      lines.push([
                        "",
                        t(tr.nomKey),
                        tr.coutAjuste.toString(),
                        surfaceBrute.toString(),
                        Math.round(tr.total).toString(),
                        `${(pct*100).toFixed(1)}%`,
                      ].join(sep));
                    }
                  }
                  lines.push(["","","","Total construction",Math.round(result.totalConstruction).toString(),""].join(sep));
                  lines.push(["","","","Honoraires architecte",Math.round(result.fraisArchitecte).toString(),""].join(sep));
                  lines.push(["","","","Honoraires BET",Math.round(result.fraisBET).toString(),""].join(sep));
                  lines.push(["","","","Études sol",etudesSol.toString(),""].join(sep));
                  lines.push(["","","","Raccordements",raccordements.toString(),""].join(sep));
                  lines.push(["","","","Aménagements ext.",amenagementExt.toString(),""].join(sep));
                  lines.push(["","","","Aléas",Math.round(result.fraisAleas).toString(),""].join(sep));
                  lines.push(["","","","TOTAL PROJET",Math.round(result.totalProjet).toString(),"100%"].join(sep));
                  const csv = "\uFEFF" + lines.join("\n"); // BOM for Excel
                  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `bordereau-construction-${new Date().toLocaleDateString("fr-LU")}.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="rounded-lg border border-card-border bg-card px-3 py-2 text-sm font-medium text-navy hover:bg-slate-50 inline-flex items-center gap-1.5"
                title={t("bordereauHint")}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
                {t("exporterBordereau")}
              </button>
            </div>

            {/* --- Coût de construction --- */}
            <ResultPanel
              title={t("resultCoutConstruction")}
              lines={[
                ...result.totalParCategorie.map((cat) => ({
                  label: `${t(cat.nomKey)} (${formatPct(cat.pct)})`,
                  value: formatEUR(cat.total),
                })),
                { label: t("totalConstruction"), value: formatEUR(result.totalConstruction), highlight: true, large: true },
                { label: t("coutM2Construction"), value: `${formatEUR(result.coutM2Construction)}/m²`, sub: true },
              ]}
            />

            {/* --- Stacked bar --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">{t("repartitionCategorie")}</h3>
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
                    title={`${t(cat.nomKey)}: ${formatPct(cat.pct)}`}
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
                    <span>{t(cat.nomKey)} {formatPct(cat.pct)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* --- Détail par corps de métier --- */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">{t("detailCorpsMetier")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border text-left">
                      <th className="py-2 pr-3 font-semibold text-slate">{t("thCorpsMetier")}</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">&euro;/m&sup2;</th>
                      <th className="py-2 px-3 font-semibold text-slate text-right">{t("thCout")}</th>
                      <th className="py-2 pl-3 font-semibold text-slate text-right">{t("thPctTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.totalParCategorie.map((cat) => (
                      <Fragment key={cat.id}>
                        <tr className="border-b border-card-border">
                          <td colSpan={4} className="py-2 font-semibold text-white text-xs px-2 rounded-sm" style={{ backgroundColor: cat.couleur }}>
                            {t(cat.nomKey)} &mdash; {formatEUR(cat.total)} ({formatPct(cat.pct)})
                          </td>
                        </tr>
                        {cat.trades.map((trade) => {
                          const pct = result.totalConstruction > 0 ? trade.total / result.totalConstruction : 0;
                          return (
                            <tr key={trade.id} className="border-b border-card-border/50">
                              <td className="py-1.5 pr-3 pl-4 text-slate">{t(trade.nomKey)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-muted">{formatEUR(trade.coutAjuste)}</td>
                              <td className="py-1.5 px-3 text-right font-mono text-foreground">{formatEUR(trade.total)}</td>
                              <td className="py-1.5 pl-3 text-right font-mono text-muted">{formatPct(pct)}</td>
                            </tr>
                          );
                        })}
                      </Fragment>
                    ))}
                    <tr className="border-t-2 border-navy">
                      <td className="py-2 pr-3 font-semibold text-navy">{t("total")}</td>
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
              title={t("resultFraisAnnexes")}
              lines={[
                { label: t("resultArchitecte", { pct: honorairesArchitecte }), value: formatEUR(result.fraisArchitecte) },
                { label: t("resultBET", { pct: honorairesBET }), value: formatEUR(result.fraisBET) },
                { label: t("etudesSol"), value: formatEUR(etudesSol) },
                { label: t("raccordements"), value: formatEUR(raccordements) },
                { label: t("amenagementExt"), value: formatEUR(amenagementExt) },
                { label: t("resultAleas", { pct: aleas }), value: formatEUR(result.fraisAleas) },
                { label: t("totalFraisAnnexes"), value: formatEUR(result.totalFraisAnnexes), highlight: true },
              ]}
            />

            {/* --- Budget total --- */}
            <ResultPanel
              title={t("resultBudgetTotal")}
              lines={[
                { label: t("totalConstruction"), value: formatEUR(result.totalConstruction) },
                { label: t("totalFraisAnnexes"), value: formatEUR(result.totalFraisAnnexes) },
                { label: t("budgetTotal"), value: formatEUR(result.totalProjet), highlight: true, large: true },
                { label: t("coutTotalM2"), value: `${formatEUR(result.coutM2Total)}/m²`, sub: true },
                { label: t("partConstruction"), value: formatPct(result.partConstruction), sub: true },
                { label: t("partFraisAnnexes"), value: formatPct(result.partFrais), sub: true },
              ]}
            />

            {/* --- Sources --- */}
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
              <p className="text-xs text-amber-800 leading-relaxed">
                <strong>{t("sourcesLabel")}</strong> {t("sourcesText")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <SEOContent
        ns="estimateurConstruction"
        sections={[
          { titleKey: "estimerTitle", contentKey: "estimerContent" },
          { titleKey: "prixM2Title", contentKey: "prixM2Content" },
          { titleKey: "facteursTitle", contentKey: "facteursContent" },
          { titleKey: "normesTitle", contentKey: "normesContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/bilan-promoteur", labelKey: "bilanPromoteur" },
          { href: "/calculateur-vrd", labelKey: "calculateurVrd" },
        ]}
      />
    </div>
  );
}
