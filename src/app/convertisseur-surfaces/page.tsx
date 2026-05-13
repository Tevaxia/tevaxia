"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import SliderField from "@/components/SliderField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR } from "@/lib/calculations";
import { PdfButton } from "@/components/PdfButton";
const _lazy_generateSurfacesPdfBlob = async (...args: Parameters<typeof import("@/components/ToolsPdf")["generateSurfacesPdfBlob"]>): Promise<Blob> => (await import("@/components/ToolsPdf")).generateSurfacesPdfBlob(...args);
import Breadcrumbs from "@/components/Breadcrumbs";
import SEOContent from "@/components/SEOContent";
import { ZONES_PAG } from "@/lib/pag-pap";

/* ------------------------------------------------------------------ */
/*  ACT coefficients for weighted accessories                         */
/* ------------------------------------------------------------------ */
const ACT_COEFFICIENTS = {
  balcons:    { base: 0.40, reduced: 0.30, seuil: 20 },
  terrasses:  { base: 0.40, reduced: 0.30, seuil: 20 },
  terrassesVerdure: { base: 0.20, reduced: 0.10, seuil: 20 },
  caves:      { base: 0.50, reduced: 0.50, seuil: Infinity },
  garages:    { base: 0.50, reduced: 0.50, seuil: Infinity },
  loggias:    { base: 0.50, reduced: 0.50, seuil: Infinity },
} as const;

/** Weighted surface with ACT degressive rule */
function weightedSurface(surface: number, coeff: typeof ACT_COEFFICIENTS[keyof typeof ACT_COEFFICIENTS]): number {
  if (surface <= 0) return 0;
  if (surface <= coeff.seuil) return surface * coeff.base;
  return coeff.seuil * coeff.base + (surface - coeff.seuil) * coeff.reduced;
}

/** Effective average coefficient after degressive rule */
function effectiveCoeff(surface: number, coeff: typeof ACT_COEFFICIENTS[keyof typeof ACT_COEFFICIENTS]): number {
  if (surface <= 0) return coeff.base;
  return weightedSurface(surface, coeff) / surface;
}

/* ------------------------------------------------------------------ */
/*  Formatting helpers                                                */
/* ------------------------------------------------------------------ */
function fmtM2(v: number): string {
  return `${v.toLocaleString("fr-LU", { maximumFractionDigits: 1 })} m²`;
}

function fmtPct(v: number): string {
  return `${(v * 100).toLocaleString("fr-LU", { maximumFractionDigits: 1 })} %`;
}

/* ------------------------------------------------------------------ */
/*  COS/CMU parsing for PAG zones                                     */
/* ------------------------------------------------------------------ */
function parseCoeffRange(raw: string): { min: number; max: number } | null {
  if (!raw) return null;
  const match = raw.match(/(\d+[.,]?\d*)\s*[-–]\s*(\d+[.,]?\d*)/);
  if (match) {
    return {
      min: parseFloat(match[1].replace(",", ".")),
      max: parseFloat(match[2].replace(",", ".")),
    };
  }
  const single = raw.match(/(\d+[.,]?\d*)/);
  if (single) {
    const v = parseFloat(single[1].replace(",", "."));
    return { min: v, max: v };
  }
  return null;
}

interface TerrainResult {
  surfaceNette: number;
  empriseMin: number;
  empriseMax: number;
  plancherMin: number;
  plancherMax: number;
  logementsMin: number;
  logementsMax: number;
  cos: { min: number; max: number } | null;
  cmu: { min: number; max: number } | null;
}

function computeTerrain(params: {
  surfaceCadastrale: number;
  retraitVoirie: number;
  espaceVertPct: number;
  zoneCode: string;
  surfaceMoyenneLogement: number;
}): TerrainResult {
  const { surfaceCadastrale, retraitVoirie, espaceVertPct, zoneCode, surfaceMoyenneLogement } = params;
  const zone = ZONES_PAG.find((z) => z.code === zoneCode);
  const cos = zone ? parseCoeffRange(zone.cosTypique) : null;
  const cmu = zone ? parseCoeffRange(zone.cmuTypique) : null;

  const surfaceNette = Math.max(0, surfaceCadastrale - retraitVoirie) * (1 - espaceVertPct / 100);

  const empriseMin = cos ? surfaceNette * cos.min : 0;
  const empriseMax = cos ? surfaceNette * cos.max : 0;
  const plancherMin = cmu ? surfaceNette * cmu.min : 0;
  const plancherMax = cmu ? surfaceNette * cmu.max : 0;
  const logementsMin = surfaceMoyenneLogement > 0 ? Math.floor(plancherMin / surfaceMoyenneLogement) : 0;
  const logementsMax = surfaceMoyenneLogement > 0 ? Math.floor(plancherMax / surfaceMoyenneLogement) : 0;

  return {
    surfaceNette,
    empriseMin,
    empriseMax,
    plancherMin,
    plancherMax,
    logementsMin,
    logementsMax,
    cos,
    cmu,
  };
}

function TerrainSection() {
  const t = useTranslations("convertisseurSurfaces");
  const [surfaceCadastrale, setSurfaceCadastrale] = useState(800);
  const [retraitVoirie, setRetraitVoirie] = useState(0);
  const [espaceVertPct, setEspaceVertPct] = useState(0);
  const [zoneCode, setZoneCode] = useState("HAB-2");
  const [surfaceMoyenneLogement, setSurfaceMoyenneLogement] = useState(90);

  const zonesConstructibles = ZONES_PAG.filter((z) => z.constructible);
  const zoneSelected = ZONES_PAG.find((z) => z.code === zoneCode);

  const result = useMemo(
    () => computeTerrain({ surfaceCadastrale, retraitVoirie, espaceVertPct, zoneCode, surfaceMoyenneLogement }),
    [surfaceCadastrale, retraitVoirie, espaceVertPct, zoneCode, surfaceMoyenneLogement]
  );

  return (
    <div className="mt-10 grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("terrainSectionTitle")}</h2>
          <p className="mb-4 text-xs text-muted">{t("terrainSectionSubtitle")}</p>
          <div className="space-y-4">
            <InputField
              label={t("terrainSurfaceCadastrale")}
              value={surfaceCadastrale}
              onChange={(v) => setSurfaceCadastrale(Number(v))}
              suffix="m²"
              min={0}
              hint={t("terrainSurfaceCadastraleHint")}
            />
            <InputField
              label={t("terrainZonePag")}
              value={zoneCode}
              onChange={(v) => setZoneCode(String(v))}
              type="select"
              options={zonesConstructibles.map((z) => ({
                value: z.code,
                label: `${z.code} — ${z.nom}`,
              }))}
              hint={t("terrainZonePagHint")}
            />
            <InputField
              label={t("terrainRetraitVoirie")}
              value={retraitVoirie}
              onChange={(v) => setRetraitVoirie(Number(v))}
              suffix="m²"
              min={0}
              hint={t("terrainRetraitVoirieHint")}
            />
            <SliderField
              label={t("terrainEspaceVert")}
              value={espaceVertPct}
              onChange={setEspaceVertPct}
              min={0}
              max={40}
              step={1}
              suffix="%"
              hint={t("terrainEspaceVertHint")}
            />
            <InputField
              label={t("terrainSurfaceLogement")}
              value={surfaceMoyenneLogement}
              onChange={(v) => setSurfaceMoyenneLogement(Number(v))}
              suffix="m²"
              min={30}
              max={300}
              hint={t("terrainSurfaceLogementHint")}
            />
          </div>
        </div>

        {zoneSelected && (
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-navy">
              {zoneSelected.code} — {zoneSelected.nom}
            </h3>
            <p className="mb-3 text-xs text-muted">{zoneSelected.description}</p>
            <dl className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <dt className="text-muted">{t("terrainCos")}</dt>
                <dd className="font-mono text-navy">{zoneSelected.cosTypique}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("terrainCmu")}</dt>
                <dd className="font-mono text-navy">{zoneSelected.cmuTypique}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">{t("terrainHauteur")}</dt>
                <dd className="font-mono text-navy">{zoneSelected.hauteurMax}</dd>
              </div>
            </dl>
            <p className="mt-3 text-[11px] text-muted italic">{zoneSelected.observations}</p>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
          <div className="text-sm text-white/60">{t("terrainHeroLabel")}</div>
          <div className="mt-2 text-4xl font-bold">
            {result.plancherMin === result.plancherMax
              ? fmtM2(result.plancherMax)
              : `${fmtM2(result.plancherMin)} – ${fmtM2(result.plancherMax)}`}
          </div>
          <div className="mt-2 text-xs text-white/60">
            {t("terrainHeroDetail", {
              min: result.logementsMin,
              max: result.logementsMax,
            })}
          </div>
        </div>

        <ResultPanel
          title={t("terrainResultSurfaces")}
          lines={[
            { label: t("terrainSurfaceNette"), value: fmtM2(result.surfaceNette), highlight: true },
            {
              label: t("terrainEmprise"),
              value: result.cos
                ? `${fmtM2(result.empriseMin)} – ${fmtM2(result.empriseMax)}`
                : "N/A",
            },
            {
              label: t("terrainPlancher"),
              value: result.cmu
                ? `${fmtM2(result.plancherMin)} – ${fmtM2(result.plancherMax)}`
                : "N/A",
              highlight: true,
            },
            {
              label: t("terrainLogements"),
              value: result.logementsMin === result.logementsMax
                ? `${result.logementsMax}`
                : `${result.logementsMin} – ${result.logementsMax}`,
              sub: true,
            },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold text-navy">{t("terrainMethodTitle")}</h3>
          <ul className="space-y-1.5 text-xs text-muted">
            <li>{t("terrainMethod1")}</li>
            <li>{t("terrainMethod2")}</li>
            <li>{t("terrainMethod3")}</li>
            <li>{t("terrainMethod4")}</li>
          </ul>
        </div>

        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-900">{t("terrainDisclaimer")}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page component                                                    */
/* ------------------------------------------------------------------ */
export default function ConvertisseurSurfaces() {
  const t = useTranslations("convertisseurSurfaces");

  // --- Surface de référence ---
  const [surfaceReference, setSurfaceReference] = useState(2500);
  const [typeSurface, setTypeSurface] = useState<"scb" | "scp" | "su" | "shab">("scb");
  const [nbNiveaux, setNbNiveaux] = useState(3);

  // --- Épaisseurs structurelles ---
  const [epaisseurMursExt, setEpaisseurMursExt] = useState(35);
  const [epaisseurMursPorteurs, setEpaisseurMursPorteurs] = useState(20);
  const [partiesCommunes, setPartiesCommunes] = useState(12);

  // --- Accessoires ---
  const [surfaceBalcons, setSurfaceBalcons] = useState(0);
  const [surfaceTerrasses, setSurfaceTerrasses] = useState(0);
  const [surfaceTerrassesVerdure, setSurfaceTerrassesVerdure] = useState(0);
  const [surfaceCaves, setSurfaceCaves] = useState(0);
  const [surfaceGarages, setSurfaceGarages] = useState(0);
  const [surfaceLoggias, setSurfaceLoggias] = useState(0);

  // --- Paramètres ---
  const [typeBatiment, setTypeBatiment] = useState<"immeuble" | "maison_individuelle" | "maison_jumelee">("immeuble");
  const [hauteurMinCounting, setHauteurMinCounting] = useState(2.0);
  const [pctSousHauteur, setPctSousHauteur] = useState(3);

  // --- Projection financière ---
  const [prixM2, setPrixM2] = useState(8500);

  /* ================================================================ */
  /*  Calculations                                                     */
  /* ================================================================ */
  const result = useMemo(() => {
    // ------ Conversion ratios derived from structural parameters ------
    // SCB → SCP
    let scbToScp: number;
    switch (typeBatiment) {
      case "immeuble":
        scbToScp = 0.85 + (50 - epaisseurMursExt) * 0.002;
        break;
      case "maison_individuelle":
        scbToScp = 0.88 + (50 - epaisseurMursExt) * 0.002;
        break;
      case "maison_jumelee":
        scbToScp = 0.87 + (50 - epaisseurMursExt) * 0.002;
        break;
    }

    // SCP → SU
    const scpToSu =
      typeBatiment === "immeuble"
        ? 1 - partiesCommunes / 100 - epaisseurMursPorteurs * 0.003
        : 1 - epaisseurMursPorteurs * 0.003;

    // SU → SHAB
    const suToShab = 1 - pctSousHauteur / 100;

    // Composite ratios
    const scbToSu = scbToScp * scpToSu;
    const scbToShab = scbToSu * suToShab;
    const scpToShab = scpToSu * suToShab;

    // ------ Reverse-compute all surfaces from the reference ------
    let scb: number, scp: number, su: number, shab: number;
    switch (typeSurface) {
      case "scb":
        scb = surfaceReference;
        scp = scb * scbToScp;
        su = scp * scpToSu;
        shab = su * suToShab;
        break;
      case "scp":
        scp = surfaceReference;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        su = scp * scpToSu;
        shab = su * suToShab;
        break;
      case "su":
        su = surfaceReference;
        scp = scpToSu > 0 ? su / scpToSu : 0;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        shab = su * suToShab;
        break;
      case "shab":
        shab = surfaceReference;
        su = suToShab > 0 ? shab / suToShab : 0;
        scp = scpToSu > 0 ? su / scpToSu : 0;
        scb = scbToScp > 0 ? scp / scbToScp : 0;
        break;
    }

    // ------ ACT weighted accessories ------
    const wBalcons = weightedSurface(surfaceBalcons, ACT_COEFFICIENTS.balcons);
    const wTerrasses = weightedSurface(surfaceTerrasses, ACT_COEFFICIENTS.terrasses);
    const wTerrassesVerdure = weightedSurface(surfaceTerrassesVerdure, ACT_COEFFICIENTS.terrassesVerdure);
    const wCaves = weightedSurface(surfaceCaves, ACT_COEFFICIENTS.caves);
    const wGarages = weightedSurface(surfaceGarages, ACT_COEFFICIENTS.garages);
    const wLoggias = weightedSurface(surfaceLoggias, ACT_COEFFICIENTS.loggias);
    const totalWeighted = wBalcons + wTerrasses + wTerrassesVerdure + wCaves + wGarages + wLoggias;

    // ------ Surface vendable ------
    const surfaceVendable = shab + totalWeighted;

    // ------ Projection financière ------
    const caVendable = surfaceVendable * prixM2;
    const caHabitable = shab * prixM2;
    const ecart = caVendable - caHabitable;
    const ratioVendableSCB = scb > 0 ? surfaceVendable / scb : 0;

    // ------ Surface per level ------
    const surfaceParNiveau = nbNiveaux > 0 ? scb / nbNiveaux : scb;

    return {
      // Ratios
      scbToScp,
      scpToSu,
      suToShab,
      scbToSu,
      scbToShab,
      scpToShab,
      // Surfaces
      scb,
      scp,
      su,
      shab,
      surfaceParNiveau,
      // Accessories
      wBalcons,
      wTerrasses,
      wTerrassesVerdure,
      wCaves,
      wGarages,
      wLoggias,
      totalWeighted,
      // Vendable
      surfaceVendable,
      // Financier
      caVendable,
      caHabitable,
      ecart,
      ratioVendableSCB,
    };
  }, [
    surfaceReference, typeSurface, nbNiveaux,
    epaisseurMursExt, epaisseurMursPorteurs, partiesCommunes,
    surfaceBalcons, surfaceTerrasses, surfaceTerrassesVerdure,
    surfaceCaves, surfaceGarages, surfaceLoggias,
    typeBatiment, pctSousHauteur,
    prixM2,
  ]);

  /* ================================================================ */
  /*  Render                                                           */
  /* ================================================================ */
  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Breadcrumbs />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* ======================== INPUTS ======================== */}
          <div className="space-y-6">
            {/* Surface de référence */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionReference")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("surfaceConnue")}
                  value={surfaceReference}
                  onChange={(v) => setSurfaceReference(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("surfaceConnueHint")}
                />
                <InputField
                  label={t("typeSurface")}
                  value={typeSurface}
                  onChange={(v) => setTypeSurface(v as "scb" | "scp" | "su" | "shab")}
                  type="select"
                  options={[
                    { value: "scb", label: t("optionScb") },
                    { value: "scp", label: t("optionScp") },
                    { value: "su", label: t("optionSu") },
                    { value: "shab", label: t("optionShab") },
                  ]}
                  hint={t("typeSurfaceHint")}
                />
                <InputField
                  label={t("nbNiveaux")}
                  value={nbNiveaux}
                  onChange={(v) => setNbNiveaux(Math.max(1, Math.min(20, Number(v))))}
                  min={1}
                  max={20}
                  hint={t("nbNiveauxHint")}
                />
              </div>
            </div>

            {/* Épaisseurs structurelles */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionStructure")}</h2>
              <div className="space-y-5">
                <SliderField
                  label={t("mursExterieurs")}
                  value={epaisseurMursExt}
                  onChange={setEpaisseurMursExt}
                  min={20}
                  max={50}
                  step={1}
                  suffix="cm"
                  hint={t("mursExterieursHint")}
                />
                <SliderField
                  label={t("mursPorteurs")}
                  value={epaisseurMursPorteurs}
                  onChange={setEpaisseurMursPorteurs}
                  min={15}
                  max={35}
                  step={1}
                  suffix="cm"
                  hint={t("mursPorteursHint")}
                />
                <SliderField
                  label={t("partiesCommunes")}
                  value={partiesCommunes}
                  onChange={setPartiesCommunes}
                  min={5}
                  max={25}
                  step={0.5}
                  suffix="%"
                  hint={t("partiesCommunesHint")}
                />
              </div>
            </div>

            {/* Accessoires (pondération ACT) */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionAccessoires")}</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label={t("balcons")}
                  value={surfaceBalcons}
                  onChange={(v) => setSurfaceBalcons(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff040")}
                />
                <InputField
                  label={t("terrasses")}
                  value={surfaceTerrasses}
                  onChange={(v) => setSurfaceTerrasses(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff040")}
                />
                <InputField
                  label={t("terrassesVerdure")}
                  value={surfaceTerrassesVerdure}
                  onChange={(v) => setSurfaceTerrassesVerdure(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff020")}
                />
                <InputField
                  label={t("caves")}
                  value={surfaceCaves}
                  onChange={(v) => setSurfaceCaves(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff050")}
                />
                <InputField
                  label={t("garages")}
                  value={surfaceGarages}
                  onChange={(v) => setSurfaceGarages(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff050")}
                />
                <InputField
                  label={t("loggias")}
                  value={surfaceLoggias}
                  onChange={(v) => setSurfaceLoggias(Number(v))}
                  suffix="m²"
                  min={0}
                  hint={t("hintCoeff050")}
                />
              </div>
            </div>

            {/* Paramètres */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionParams")}</h2>
              <div className="space-y-5">
                <InputField
                  label={t("typeBatiment")}
                  value={typeBatiment}
                  onChange={(v) => setTypeBatiment(v as "immeuble" | "maison_individuelle" | "maison_jumelee")}
                  type="select"
                  options={[
                    { value: "immeuble", label: t("optionImmeuble") },
                    { value: "maison_individuelle", label: t("optionMaisonIndiv") },
                    { value: "maison_jumelee", label: t("optionMaisonJumelee") },
                  ]}
                  hint={t("typeBatimentHint")}
                />
                <SliderField
                  label={t("hauteurMin")}
                  value={hauteurMinCounting}
                  onChange={setHauteurMinCounting}
                  min={1.8}
                  max={2.2}
                  step={0.1}
                  suffix="m"
                  hint={t("hauteurMinHint")}
                />
                <SliderField
                  label={t("pctSousHauteur")}
                  value={pctSousHauteur}
                  onChange={setPctSousHauteur}
                  min={0}
                  max={15}
                  step={1}
                  suffix="%"
                  hint={t("pctSousHauteurHint")}
                />
              </div>
            </div>

            {/* Projection financière */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFinancial")}</h2>
              <SliderField
                label={t("prixM2")}
                value={prixM2}
                onChange={setPrixM2}
                min={4000}
                max={15000}
                step={100}
                suffix="€"
                hint={t("prixM2Hint")}
              />
            </div>
          </div>

          {/* ======================== RESULTS ======================== */}
          <div className="space-y-6">
            {/* Hero: Surface vendable */}
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-center text-white shadow-lg">
              <div className="text-sm text-white/60">{t("surfaceVendable")}</div>
              <div className="mt-2 text-5xl font-bold">{fmtM2(result.surfaceVendable)}</div>
              <div className="mt-2 text-sm text-white/60">
                {t("heroDetail", { shab: fmtM2(result.shab), weighted: fmtM2(result.totalWeighted) })}
              </div>
            </div>

            <PdfButton
              label="PDF"
              filename={`convertisseur-surfaces-${new Date().toLocaleDateString("fr-LU")}.pdf`}
              generateBlob={() => _lazy_generateSurfacesPdfBlob({
                surfaceReference,
                typeSurface,
                typeBatiment,
                scb: result.scb,
                scp: result.scp,
                su: result.su,
                shab: result.shab,
                surfaceVendable: result.surfaceVendable,
                ratioScpPct: result.scbToScp,
                ratioSuPct: result.scbToSu,
                ratioShabPct: result.scbToShab,
                ratioVendablePct: result.ratioVendableSCB,
                accessoiresPonderes: result.totalWeighted,
                prixM2,
                caVendable: result.caVendable,
                caHabitable: result.caHabitable,
              })}
            />

            {/* Surfaces calculées */}
            <ResultPanel
              title={t("resultSurfaces")}
              lines={[
                {
                  label: t("resultScb"),
                  value: fmtM2(result.scb),
                  highlight: typeSurface === "scb",
                },
                {
                  label: t("resultScpPct", { pct: fmtPct(result.scbToScp) }),
                  value: fmtM2(result.scp),
                  highlight: typeSurface === "scp",
                },
                {
                  label: t("resultSuPct", { pct: fmtPct(result.scbToSu) }),
                  value: fmtM2(result.su),
                  highlight: typeSurface === "su",
                },
                {
                  label: t("resultShabPct", { pct: fmtPct(result.scbToShab) }),
                  value: fmtM2(result.shab),
                  highlight: typeSurface === "shab",
                },
                {
                  label: t("surfaceVendable"),
                  value: fmtM2(result.surfaceVendable),
                  highlight: true,
                  large: true,
                },
                {
                  label: t("surfaceParNiveau"),
                  value: fmtM2(result.surfaceParNiveau),
                  sub: true,
                },
              ]}
            />

            {/* Ratios de conversion */}
            <ResultPanel
              title={t("resultRatios")}
              lines={[
                { label: t("ratioScbScp"), value: fmtPct(result.scbToScp) },
                { label: t("ratioScpSu"), value: fmtPct(result.scpToSu) },
                { label: t("ratioSuShab"), value: fmtPct(result.suToShab) },
                { label: t("ratioScbShab"), value: fmtPct(result.scbToShab), highlight: true },
                { label: t("ratioScpShab"), value: fmtPct(result.scpToShab), sub: true },
              ]}
            />

            {/* Accessoires pondérés (ACT) */}
            <ResultPanel
              title={t("resultAccessoires")}
              lines={[
                ...(surfaceBalcons > 0
                  ? [{
                      label: `${t("balcons")} : ${fmtM2(surfaceBalcons)} × ${effectiveCoeff(surfaceBalcons, ACT_COEFFICIENTS.balcons).toFixed(2)}`,
                      value: fmtM2(result.wBalcons),
                    }]
                  : []),
                ...(surfaceTerrasses > 0
                  ? [{
                      label: `${t("terrasses")} : ${fmtM2(surfaceTerrasses)} × ${effectiveCoeff(surfaceTerrasses, ACT_COEFFICIENTS.terrasses).toFixed(2)}`,
                      value: fmtM2(result.wTerrasses),
                    }]
                  : []),
                ...(surfaceTerrassesVerdure > 0
                  ? [{
                      label: `${t("terrassesVerdure")} : ${fmtM2(surfaceTerrassesVerdure)} × ${effectiveCoeff(surfaceTerrassesVerdure, ACT_COEFFICIENTS.terrassesVerdure).toFixed(2)}`,
                      value: fmtM2(result.wTerrassesVerdure),
                    }]
                  : []),
                ...(surfaceCaves > 0
                  ? [{
                      label: `${t("caves")} : ${fmtM2(surfaceCaves)} × 0,50`,
                      value: fmtM2(result.wCaves),
                    }]
                  : []),
                ...(surfaceGarages > 0
                  ? [{
                      label: `${t("garages")} : ${fmtM2(surfaceGarages)} × 0,50`,
                      value: fmtM2(result.wGarages),
                    }]
                  : []),
                ...(surfaceLoggias > 0
                  ? [{
                      label: `${t("loggias")} : ${fmtM2(surfaceLoggias)} × 0,50`,
                      value: fmtM2(result.wLoggias),
                    }]
                  : []),
                {
                  label: t("totalPondere"),
                  value: fmtM2(result.totalWeighted),
                  highlight: true,
                },
              ]}
            />

            {/* Projection financière */}
            <ResultPanel
              title={t("sectionFinancial")}
              lines={[
                {
                  label: t("caVendable"),
                  value: formatEUR(result.caVendable),
                  highlight: true,
                  large: true,
                },
                {
                  label: t("caHabitable"),
                  value: formatEUR(result.caHabitable),
                },
                {
                  label: t("ecartAccessoires"),
                  value: formatEUR(result.ecart),
                  sub: true,
                },
                {
                  label: t("ratioVendableScb"),
                  value: fmtPct(result.ratioVendableSCB),
                },
              ]}
            />

            {/* Sources */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold text-navy">{t("sourcesTitle")}</h3>
              <p className="text-xs leading-relaxed text-muted">
                {t("sourcesText")}
              </p>
            </div>
          </div>
        </div>

        {/* Onglet terrain / constructibilité PAG */}
        <TerrainSection />
      </div>

      <SEOContent
        ns="convertisseurSurfaces"
        sections={[
          { titleKey: "comprendreTitle", contentKey: "comprendreContent" },
          { titleKey: "normesTitle", contentKey: "normesContent" },
          { titleKey: "ponderationTitle", contentKey: "ponderationContent" },
          { titleKey: "circulaireTitle", contentKey: "circulaireContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/estimation", labelKey: "estimation" },
          { href: "/valorisation", labelKey: "valorisation" },
        ]}
      />
    </div>
  );
}
