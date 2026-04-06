"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { DEMOGRAPHICS } from "@/lib/demographics";
import ToggleField from "@/components/ToggleField";
import { simulerAides, formatEUR, type AideDetail } from "@/lib/calculations";
import RelatedTools from "@/components/RelatedTools";
import { generateAidesPdfBlob, PdfButton } from "@/components/ToolsPdf";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import AuthGate from "@/components/AuthGate";

const ALL_COMMUNES = Object.keys(DEMOGRAPHICS).sort();

function CommuneAutocomplete({ label, value, onChange, hint }: { label: string; value: string; onChange: (v: string) => void; hint: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search) return ALL_COMMUNES.slice(0, 15);
    const q = search.toLowerCase();
    return ALL_COMMUNES.filter((c) => c.toLowerCase().includes(q)).slice(0, 15);
  }, [search]);

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-slate mb-1">{label}</label>
      <input
        type="text"
        value={open ? search : value}
        onFocus={() => { setOpen(true); setSearch(value); }}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Rechercher une commune..."
        className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-2 text-sm shadow-sm focus:border-navy focus:outline-none focus:ring-2 focus:ring-navy/20"
      />
      {open && filtered.length > 0 && (
        <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-lg border border-card-border bg-card shadow-lg">
          {filtered.map((c) => (
            <button key={c} type="button"
              onMouseDown={() => { onChange(c); setSearch(c); setOpen(false); }}
              className={`block w-full text-left px-3 py-2 text-sm hover:bg-navy/5 ${c === value ? "bg-navy/10 font-semibold text-navy" : "text-slate"}`}
            >
              {c}
              <span className="ml-2 text-xs text-muted">{DEMOGRAPHICS[c]?.canton}</span>
            </button>
          ))}
        </div>
      )}
      <p className="text-xs text-muted mt-0.5">{hint}</p>
    </div>
  );
}

function AideCard({ aide, t }: { aide: AideDetail; t: (key: string) => string }) {
  const CATEGORIE_LABELS: Record<string, { color: string; bg: string }> = {
    etatique_acquisition: { color: "text-navy", bg: "bg-navy/5 border-navy/20" },
    etatique_energie: { color: "text-teal", bg: "bg-teal/5 border-teal/20" },
    privee: { color: "text-gold-dark", bg: "bg-gold/5 border-gold/20" },
    communale: { color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    patrimoine: { color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  };

  const NATURE_COLORS: Record<string, string> = {
    directe: "bg-green-100 text-green-700",
    economie: "bg-blue-100 text-blue-700",
    garantie: "bg-gray-100 text-gray-700",
  };

  const cat = CATEGORIE_LABELS[aide.categorie] || { color: "text-slate", bg: "bg-gray-50" };
  const natureColor = NATURE_COLORS[aide.nature] || NATURE_COLORS.directe;
  const natureKey = `nature_${aide.nature}` as string;

  return (
    <div className={`rounded-lg border p-4 ${cat.bg}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h4 className={`text-sm font-semibold ${cat.color}`}>{aide.nom}</h4>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${natureColor}`}>
              {t(natureKey)}
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

// --- Klimabonus mesures détaillées ---
interface KlimaMesure {
  id: string;
  labelKey: string;
  type: "surface" | "count" | "kwp" | "forfait";
  unitLabelKey?: string;
  unitPrix: number; // €/unité ou forfait
  klimaPct: number; // % Klimabonus (50% par défaut)
}

const KLIMA_MESURES: KlimaMesure[] = [
  { id: "isolation_facade", labelKey: "klima_isolation_facade", type: "surface", unitLabelKey: "unitM2", unitPrix: 150, klimaPct: 50 },
  { id: "isolation_toiture", labelKey: "klima_isolation_toiture", type: "surface", unitLabelKey: "unitM2", unitPrix: 120, klimaPct: 50 },
  { id: "fenetres", labelKey: "klima_fenetres", type: "count", unitLabelKey: "unitFenetres", unitPrix: 5000, klimaPct: 50 },
  { id: "pac", labelKey: "klima_pac", type: "forfait", unitPrix: 25000, klimaPct: 50 },
  { id: "vmc", labelKey: "klima_vmc", type: "forfait", unitPrix: 8000, klimaPct: 50 },
  { id: "pv", labelKey: "klima_pv", type: "kwp", unitLabelKey: "unitKwp", unitPrix: 1800, klimaPct: 50 },
  { id: "solaire_thermique", labelKey: "klima_solaire_thermique", type: "forfait", unitPrix: 8000, klimaPct: 50 },
];

// Klimabonus par mesure (subventions spécifiques)
const KLIMA_SUBVENTIONS: Record<string, { parUnite: number; labelKey: string }> = {
  isolation_facade: { parUnite: 50, labelKey: "klimaSub_isolation_facade" },
  isolation_toiture: { parUnite: 40, labelKey: "klimaSub_isolation_toiture" },
  fenetres: { parUnite: 2000, labelKey: "klimaSub_fenetres" },
  pac: { parUnite: 8000, labelKey: "klimaSub_pac" },
  vmc: { parUnite: 3000, labelKey: "klimaSub_vmc" },
  pv: { parUnite: 500, labelKey: "klimaSub_pv" },
  solaire_thermique: { parUnite: 2500, labelKey: "klimaSub_solaire_thermique" },
};

interface MesureState {
  active: boolean;
  quantite: number;
}

export default function SimulateurAides() {
  const t = useTranslations("simulateurAides");
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

  // Category labels (using t())
  const CATEGORIE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
    etatique_acquisition: { label: t("cat_etatique_acquisition"), color: "text-navy", bg: "bg-navy/5 border-navy/20" },
    etatique_energie: { label: t("cat_etatique_energie"), color: "text-teal", bg: "bg-teal/5 border-teal/20" },
    privee: { label: t("cat_privee"), color: "text-gold-dark", bg: "bg-gold/5 border-gold/20" },
    communale: { label: t("cat_communale"), color: "text-emerald-700", bg: "bg-emerald-50 border-emerald-200" },
    patrimoine: { label: t("cat_patrimoine"), color: "text-purple-700", bg: "bg-purple-50 border-purple-200" },
  };

  // Compute detailed Klimabonus totals
  const klimaDetail = useMemo(() => {
    if (klimaMode !== "detaille") return null;
    const lignes: { id: string; labelKey: string; coutTravaux: number; klimabonus: number; klimaLabelKey: string }[] = [];
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
        labelKey: m.labelKey,
        coutTravaux,
        klimabonus,
        klimaLabelKey: sub?.labelKey || "klimaSub_default",
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
              {t("title")}
            </h1>
            <span className="rounded-full bg-gold/20 px-3 py-0.5 text-xs font-semibold text-gold-dark">
              {t("badge")}
            </span>
          </div>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-5">
          {/* Inputs - 2 cols */}
          <div className="space-y-6 lg:col-span-2">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionProjet")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("typeProjet")}
                  type="select"
                  value={typeProjet}
                  onChange={(v) => setTypeProjet(v as "acquisition" | "construction" | "renovation")}
                  options={[
                    { value: "acquisition", label: t("typeAcquisition") },
                    { value: "construction", label: t("typeConstruction") },
                    { value: "renovation", label: t("typeRenovation") },
                  ]}
                />
                <InputField
                  label={t("prixBien")}
                  value={prixBien}
                  onChange={(v) => setPrixBien(Number(v))}
                  suffix="€"
                />
                {typeProjet === "renovation" && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-muted">{t("klimaModeLabel")}</span>
                      <button
                        onClick={() => setKlimaMode("simplifie")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${klimaMode === "simplifie" ? "bg-navy text-white" : "bg-background text-muted border border-card-border"}`}
                      >
                        {t("klimaSimplifie")}
                      </button>
                      <button
                        onClick={() => setKlimaMode("detaille")}
                        className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${klimaMode === "detaille" ? "bg-navy text-white" : "bg-background text-muted border border-card-border"}`}
                      >
                        {t("klimaDetaille")}
                      </button>
                    </div>

                    {klimaMode === "simplifie" ? (
                      <InputField
                        label={t("montantTravaux")}
                        value={montantTravaux}
                        onChange={(v) => setMontantTravaux(Number(v))}
                        suffix="€"
                        hint={t("montantTravauxHint")}
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="text-xs font-medium text-navy">{t("mesuresRenovation")}</div>
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
                                <span className="text-sm font-medium text-foreground flex-1">{t(m.labelKey)}</span>
                                <span className="text-[10px] text-teal font-medium">{sub ? t(sub.labelKey) : ""}</span>
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
                                  <span className="text-xs text-muted">{m.unitLabelKey ? t(m.unitLabelKey) : ""}</span>
                                  <span className="text-xs text-muted ml-auto">
                                    {t("travauxLabel")} <span className="font-mono">{formatEUR(m.unitPrix * state.quantite)}</span>
                                  </span>
                                </div>
                              )}
                              {state.active && m.type === "forfait" && (
                                <div className="mt-1 ml-6 text-xs text-muted">
                                  {t("travauxEstimes")} <span className="font-mono">{formatEUR(m.unitPrix)}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        {klimaDetail && klimaDetail.lignes.length > 0 && (
                          <div className="rounded-lg border border-teal/30 bg-teal/5 p-3 mt-2">
                            <div className="text-xs font-semibold text-teal mb-2">{t("recapKlimabonus")}</div>
                            {klimaDetail.lignes.map((l) => (
                              <div key={l.id} className="flex justify-between text-xs py-0.5">
                                <span className="text-muted">{t(l.labelKey)} <span className="text-teal/70">({t(l.klimaLabelKey)})</span></span>
                                <span className="font-mono font-medium text-teal">{formatEUR(l.klimabonus)}</span>
                              </div>
                            ))}
                            <div className="flex justify-between text-xs font-semibold border-t border-teal/20 pt-1 mt-1">
                              <span className="text-foreground">{t("totalTravaux")}</span>
                              <span className="font-mono">{formatEUR(klimaDetail.totalTravaux)}</span>
                            </div>
                            <div className="flex justify-between text-xs font-semibold">
                              <span className="text-teal">{t("totalKlimabonus")}</span>
                              <span className="font-mono text-teal">{formatEUR(klimaDetail.totalKlima)}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <InputField
                  label={t("typeBien")}
                  type="select"
                  value={typeBien}
                  onChange={(v) => setTypeBien(v as typeof typeBien)}
                  options={[
                    { value: "appartement", label: t("typeBienAppartement") },
                    { value: "maison_rangee", label: t("typeBienMaisonRangee") },
                    { value: "maison_jumelee", label: t("typeBienMaisonJumelee") },
                    { value: "maison_isolee", label: t("typeBienMaisonIsolee") },
                  ]}
                />
                <ToggleField
                  label={t("residencePrincipale")}
                  checked={residencePrincipale}
                  onChange={setResidencePrincipale}
                />
                {typeProjet === "construction" && (
                  <ToggleField
                    label={t("bienNeuf")}
                    checked={estNeuf}
                    onChange={setEstNeuf}
                    hint={t("bienNeufHint")}
                  />
                )}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionProfil")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("revenuMenage")}
                  value={revenuMenage}
                  onChange={(v) => setRevenuMenage(Number(v))}
                  suffix="€"
                />
                <InputField
                  label={t("nbEmprunteurs")}
                  type="select"
                  value={String(nbEmprunteurs)}
                  onChange={(v) => setNbEmprunteurs(Number(v) as 1 | 2)}
                  options={[
                    { value: "1", label: t("emprunteur1") },
                    { value: "2", label: t("emprunteur2") },
                  ]}
                />
                <InputField
                  label={t("nbEnfants")}
                  value={nbEnfants}
                  onChange={(v) => setNbEnfants(Number(v))}
                  min={0}
                  max={10}
                />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionFinancement")}</h2>
              <div className="space-y-4">
                <InputField
                  label={t("montantPret")}
                  value={montantPret}
                  onChange={(v) => setMontantPret(Number(v))}
                  suffix="€"
                />
                <ToggleField
                  label={t("epargneReguliere")}
                  checked={epargneReguliere3ans}
                  onChange={setEpargneReguliere3ans}
                  hint={t("epargneReguliereHint")}
                />
                <CommuneAutocomplete
                  label={t("commune")}
                  value={commune}
                  onChange={setCommune}
                  hint={t("communeHint")}
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
                  <div className="text-xs text-white/50 uppercase tracking-wider">{t("aidesDirectes")}</div>
                  <div className="mt-1 text-3xl font-bold">{formatEUR(result.totalAidesDirectes)}</div>
                  <div className="mt-1 text-xs text-white/50">{t("aidesDirectesDesc")}</div>
                </div>
                <div>
                  <div className="text-xs text-white/50 uppercase tracking-wider">{t("economiesEstimees")}</div>
                  <div className="mt-1 text-3xl font-bold text-gold-light">{formatEUR(result.totalEconomies)}</div>
                  <div className="mt-1 text-xs text-white/50">{t("economiesEstimeesDesc")}</div>
                </div>
              </div>
              {result.garantieEtat && (
                <div className="mt-4 rounded-lg bg-white/10 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium">{t("garantieEtat")}</div>
                      <div className="text-xs text-white/60">
                        {t("garantieEtatDesc", { montant: formatEUR(result.garantieEtat.montantGaranti) })}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-white/50">{t("economieReelle")}</div>
                      <div className="text-lg font-bold text-gold-light">
                        ~{formatEUR(result.garantieEtat.economieEstimee)}
                      </div>
                      <div className="text-[10px] text-white/40">{t("garantiePct")}</div>
                    </div>
                  </div>
                </div>
              )}
              <div className="mt-4 border-t border-white/20 pt-3 flex items-center justify-between">
                <span className="text-sm text-white/70">{t("beneficeTotal")}</span>
                <span className="text-2xl font-bold">{formatEUR(result.totalGeneral)}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <SaveButton
                onClick={() => {
                  sauvegarderEvaluation({
                    nom: `Aides — ${typeProjet} — ${formatEUR(prixBien)}`,
                    type: "aides",
                    valeurPrincipale: result.totalGeneral,
                    data: { typeProjet, prixBien, montantTravaux, revenuMenage, nbEmprunteurs, nbEnfants, typeBien, residencePrincipale, estNeuf, montantPret, epargneReguliere3ans, commune },
                  });
                }}
                label="Sauvegarder"
                successLabel="Sauvegardé !"
              />
              <PdfButton
                label="PDF"
                filename={`aides-logement-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                generateBlob={() =>
                  generateAidesPdfBlob({
                    profil: typeProjet === "acquisition" ? "Acquisition" : typeProjet === "construction" ? "Construction" : "Renovation",
                    revenus: `${formatEUR(revenuMenage)}/an`,
                    aides: result.aides.map((a) => ({
                      label: a.nom,
                      montant: a.montant,
                      description: a.description,
                    })),
                    totalAides: result.totalAidesDirectes,
                    economiesFiscales: result.totalEconomies > 0 ? result.totalEconomies : undefined,
                    totalAvantage: result.totalGeneral > 0 ? result.totalGeneral : undefined,
                  })
                }
              />
            </div>

            {!residencePrincipale && (
              <div className="rounded-xl border-2 border-warning/30 bg-amber-50 p-6">
                <h3 className="text-base font-semibold text-warning">{t("residenceRequiseTitle")}</h3>
                <p className="mt-1 text-sm text-amber-700">
                  {t("residenceRequiseText")}
                </p>
              </div>
            )}

            {/* Aides grouped by category */}
            <AuthGate>
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
                    <AideCard key={i} aide={aide} t={t} />
                  ))}
                </div>
              </div>
            ))}
            </AuthGate>

            {/* Aides communales dynamiques */}
            {commune && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
                <h3 className="mb-3 text-base font-semibold text-emerald-800">
                  Aides communales — {commune}
                </h3>
                <div className="text-sm text-emerald-700 space-y-2">
                  {(() => {
                    const communeAides: Record<string, string> = {
                      "Luxembourg": "Subvention rénovation de façade : 750 à 20 000 € par immeuble en secteur protégé, +10% en zone UNESCO. Prime énergie communale complémentaire.",
                      "Esch-sur-Alzette": "Subventions façade en zones de rénovation urbaine. Complément communal aux aides étatiques pour la rénovation énergétique.",
                      "Differdange": "Prime communale rénovation énergétique. Aide complémentaire pour l'installation de panneaux photovoltaïques.",
                      "Dudelange": "Subventions façade en zones de rénovation urbaine. Prime mobilité douce.",
                      "Sanem": "Complément communal ~50% de l'aide étatique (plafond variable). Prime énergie renouvelable.",
                      "Bertrange": "Complément communal ~50% de l'aide étatique (plafond variable). Prime isolation.",
                      "Hesperange": "Prime communale énergie renouvelable. Subvention bornes de recharge.",
                      "Bettembourg": "Aide complémentaire rénovation. Prime panneaux solaires thermiques.",
                      "Lintgen": "50% de l'aide étatique, plafonnée à 1 500 €. Prime Klimapakt.",
                      "Beckerich": "Suppléments énergie renouvelable et rénovation (commune Klimapakt). Prime mobilité électrique.",
                      "Mersch": "Complément communal rénovation énergétique. Prime vélo électrique.",
                      "Mamer": "Aide communale acquisition résidence principale. Prime énergie.",
                      "Strassen": "Subvention isolation façade. Complément Klimabonus communal.",
                      "Schifflange": "Prime rénovation urbaine. Aide complémentaire énergie.",
                      "Pétange": "Subvention rénovation façade. Prime énergie renouvelable communale.",
                      "Käerjeng": "Complément Klimapakt. Prime panneaux photovoltaïques.",
                      "Mondercange": "Aide communale rénovation. Prime mobilité douce.",
                      "Steinsel": "Subvention énergie renouvelable. Aide complémentaire isolation.",
                      "Walferdange": "Prime communale rénovation. Subvention bornes de recharge.",
                      "Niederanven": "Complément communal énergie. Prime véhicule électrique.",
                      "Sandweiler": "Aide communale Klimapakt. Prime isolation.",
                      "Contern": "Subvention énergie renouvelable. Aide rénovation.",
                      "Junglinster": "Complément communal rénovation énergétique. Prime Klimapakt.",
                      "Echternach": "Subvention rénovation façade en secteur protégé. Prime patrimoine historique.",
                      "Diekirch": "Aide communale rénovation. Prime énergie.",
                      "Ettelbruck": "Subvention rénovation urbaine. Complément Klimabonus.",
                      "Wiltz": "Aide rénovation urbaine. Prime énergie (commune Klimapakt Gold).",
                      "Clervaux": "Complément communal rénovation. Aide énergie renouvelable.",
                      "Vianden": "Subvention rénovation patrimoine. Prime énergie.",
                      "Remich": "Aide communale rénovation façade. Prime énergie.",
                      "Grevenmacher": "Subvention rénovation. Complément communal énergie.",
                    };
                    const aide = communeAides[commune];
                    return aide ? (
                      <>
                        <p>{aide}</p>
                        <p className="text-xs text-emerald-600 mt-2">
                          Contactez le service urbanisme/logement de {commune} pour les montants exacts et les conditions en vigueur.
                        </p>
                      </>
                    ) : (
                      <p className="text-emerald-600">
                        Aucune donnée spécifique pour {commune}. Contactez le service urbanisme/logement de votre commune pour connaître les aides locales disponibles — la plupart des communes luxembourgeoises offrent des compléments aux aides étatiques.
                      </p>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="mb-3 text-base font-semibold text-navy">{t("importantTitle")}</h3>
              <div className="space-y-2 text-sm text-muted leading-relaxed">
                <p>
                  <strong className="text-slate">{t("estimationsTitle")}</strong> — {t("estimationsText")}
                </p>
                <p>
                  <strong className="text-slate">{t("aidesCommunalesTitle")}</strong> — {t("aidesCommunalesText")}
                </p>
                <ul className="list-disc pl-5 space-y-1 text-xs text-muted mt-1">
                  <li><strong>Luxembourg-Ville</strong> — {t("communeLuxVille")}</li>
                  <li><strong>Lintgen</strong> — {t("communeLintgen")}</li>
                  <li><strong>Bertrange</strong> — {t("communeBertrange")}</li>
                  <li><strong>Beckerich</strong> — {t("communeBeckerich")}</li>
                  <li><strong>Esch-sur-Alzette / Dudelange</strong> — {t("communeEschDudelange")}</li>
                </ul>
                <p className="mt-2 text-xs text-muted">
                  {t("contactCommune")}
                </p>
                <p>
                  <strong className="text-slate">{t("cumulTitle")}</strong> — {t("cumulText")}
                </p>
              </div>
            </div>

            <RelatedTools keys={["frais", "estimation", "vefa"]} />
          </div>
        </div>
      </div>

    </div>
  );
}
