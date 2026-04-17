"use client";

import { useState, useMemo, useRef } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import { DEMOGRAPHICS } from "@/lib/demographics";
import { KLIMABONUS_TOPUP_SOCIAL_MULT } from "@/lib/constants";
import ToggleField from "@/components/ToggleField";
import { simulerAides, formatEUR, type AideDetail } from "@/lib/calculations";
import RelatedTools from "@/components/RelatedTools";
import { generateAidesPdfBlob, PdfButton } from "@/components/ToolsPdf";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import AuthGate from "@/components/AuthGate";
import SEOContent from "@/components/SEOContent";

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
          {aide.source && (
            <p className="mt-1 text-[10px] text-muted/50">Source : {aide.source}</p>
          )}
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

// Klimabonus Wunnen 2026 — subventions par mesure (barème standardisé €/m²)
const KLIMA_SUBVENTIONS: Record<string, { parUnite: number; labelKey: string; bonusEco?: number }> = {
  isolation_facade:    { parUnite: 55, labelKey: "klimaSub_isolation_facade", bonusEco: 10 },     // 55 €/m² + 10 €/m² bonus matériaux écologiques
  isolation_toiture:   { parUnite: 45, labelKey: "klimaSub_isolation_toiture", bonusEco: 8 },      // 45 €/m² + 8 €/m² bonus
  fenetres:           { parUnite: 2500, labelKey: "klimaSub_fenetres" },                           // 2 500 €/fenêtre (triple vitrage)
  pac:                { parUnite: 10000, labelKey: "klimaSub_pac" },                               // 10 000 € (PAC)
  vmc:                { parUnite: 3500, labelKey: "klimaSub_vmc" },                                // 3 500 € (VMC double flux)
  pv:                 { parUnite: 500, labelKey: "klimaSub_pv" },                                  // 500 €/kWp (inchangé)
  solaire_thermique:  { parUnite: 3000, labelKey: "klimaSub_solaire_thermique" },                   // 3 000 €
};

interface MesureState {
  active: boolean;
  quantite: number;
}

export default function SimulateurAides() {
  const t = useTranslations("simulateurAides");
  const [typeProjet, setTypeProjet] = useState<"acquisition" | "construction" | "renovation">("acquisition");
  const [prixBien, setPrixBien] = useState(750000);
  const [travauxPrevus, setTravauxPrevus] = useState(false);
  const [montantTravaux, setMontantTravaux] = useState(50000);
  const [klimaMode, setKlimaMode] = useState<"simplifie" | "detaille">("simplifie");
  const [topupSocial, setTopupSocial] = useState(false);
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

  // Compute detailed Klimabonus totals (Wunnen 2026 regime)
  const klimaDetail = useMemo(() => {
    if (klimaMode !== "detaille") return null;
    const mult = topupSocial ? KLIMABONUS_TOPUP_SOCIAL_MULT : 1;
    const lignes: { id: string; labelKey: string; coutTravaux: number; klimabonus: number; bonusEco: number; klimaLabelKey: string }[] = [];
    let totalTravaux = 0;
    let totalKlima = 0;
    let totalBonusEco = 0;
    for (const m of KLIMA_MESURES) {
      const state = mesures[m.id];
      if (!state?.active) continue;
      const qty = m.type === "forfait" ? 1 : state.quantite;
      const coutTravaux = m.unitPrix * qty;
      const sub = KLIMA_SUBVENTIONS[m.id];
      const baseKlima = sub ? sub.parUnite * qty : coutTravaux * 0.5;
      const bonusEco = sub?.bonusEco ? sub.bonusEco * qty : 0;
      const klimabonus = (baseKlima + bonusEco) * mult;
      totalTravaux += coutTravaux;
      totalKlima += klimabonus;
      totalBonusEco += bonusEco * mult;
      lignes.push({
        id: m.id,
        labelKey: m.labelKey,
        coutTravaux,
        klimabonus,
        bonusEco: bonusEco * mult,
        klimaLabelKey: sub?.labelKey || "klimaSub_default",
      });
    }
    return { lignes, totalTravaux, totalKlima, totalBonusEco };
  }, [klimaMode, mesures, topupSocial]);

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
        montantTravaux: (typeProjet === "renovation" || travauxPrevus) ? montantTravauxEffectif : undefined,
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
    [typeProjet, prixBien, montantTravauxEffectif, travauxPrevus, revenuMenage, nbEmprunteurs, nbEnfants, typeBien, residencePrincipale, estNeuf, montantPret, epargneReguliere3ans, commune]
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
    <>
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
          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[11px] text-emerald-800">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
            {t("lastVerif", { date: "17/04/2026" })}
          </div>
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
                {typeProjet !== "renovation" && (
                  <div className="rounded-lg border border-energy/30 bg-energy/5 p-4">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={travauxPrevus}
                        onChange={(e) => setTravauxPrevus(e.target.checked)}
                        className="rounded border-input-border text-energy focus:ring-energy h-4 w-4"
                      />
                      <div>
                        <span className="text-sm font-medium text-foreground">Travaux de rénovation énergétique prévus ?</span>
                        <p className="text-xs text-muted mt-0.5">Isolation, fenêtres, chauffage, PV... Cochez pour voir les aides Klimabonus, Klimaprêt, TVA 3% et Enoprimes disponibles.</p>
                      </div>
                    </label>
                  </div>
                )}
                {(typeProjet === "renovation" || travauxPrevus) && (
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
                        <div className="text-[10px] font-medium text-teal/80 mb-1">{t("klimabonusRegime")}</div>
                        <div className="text-xs font-medium text-navy">{t("mesuresRenovation")}</div>
                        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={topupSocial}
                              onChange={(e) => setTopupSocial(e.target.checked)}
                              className="rounded border-input-border text-amber-600 focus:ring-amber-500 h-4 w-4"
                            />
                            <div>
                              <span className="text-sm font-medium text-foreground">{t("topupSocial")}</span>
                              <p className="text-[10px] text-amber-700 mt-0.5">{t("topupSocialHint")}</p>
                            </div>
                          </label>
                        </div>
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
                            <div className="text-xs font-semibold text-teal mb-2">
                              {t("recapKlimabonus")}
                              {topupSocial && <span className="ml-2 text-[10px] font-normal text-amber-600">(x1.5 Topup social)</span>}
                            </div>
                            {klimaDetail.lignes.map((l) => (
                              <div key={l.id} className="text-xs py-0.5">
                                <div className="flex justify-between">
                                  <span className="text-muted">{t(l.labelKey)} <span className="text-teal/70">({t(l.klimaLabelKey)})</span></span>
                                  <span className="font-mono font-medium text-teal">{formatEUR(l.klimabonus)}</span>
                                </div>
                                {l.bonusEco > 0 && (
                                  <div className="ml-4 text-[10px] text-emerald-600">{t("bonusEco")} : {formatEUR(l.bonusEco)}</div>
                                )}
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
                            <div className="mt-3 pt-3 border-t border-teal/20 flex justify-end">
                              <button
                                type="button"
                                onClick={async () => {
                                  const { generateKlimabonusDossierPdfBlob } = await import("@/components/KlimabonusDossierPdf");
                                  const lignes = klimaDetail.lignes.map((l) => ({
                                    label: t(l.labelKey),
                                    coutTravaux: l.coutTravaux,
                                    klimabonus: l.klimabonus,
                                    bonusEco: l.bonusEco,
                                  }));
                                  const blob = await generateKlimabonusDossierPdfBlob({
                                    lignes,
                                    totalTravaux: klimaDetail.totalTravaux,
                                    totalKlima: klimaDetail.totalKlima,
                                    totalBonusEco: klimaDetail.totalBonusEco,
                                    topupSocial,
                                    labels: {
                                      title: t("klimaPdfTitle"),
                                      subtitle: t("klimaPdfSubtitle"),
                                      dateLabel: t("klimaPdfDate"),
                                      applicantTitle: t("klimaPdfApplicantTitle"),
                                      applicantName: t("klimaPdfName"),
                                      applicantNif: t("klimaPdfNif"),
                                      applicantAddress: t("klimaPdfAddress"),
                                      applicantEmail: t("klimaPdfEmail"),
                                      applicantPhone: t("klimaPdfPhone"),
                                      workTitle: t("klimaPdfWorkTitle"),
                                      propertyAddress: t("klimaPdfPropertyAddress"),
                                      propertyArea: t("klimaPdfPropertyArea"),
                                      propertyYear: t("klimaPdfPropertyYear"),
                                      propertyCpe: t("klimaPdfPropertyCpe"),
                                      measuresTitle: t("klimaPdfMeasuresTitle"),
                                      colMeasure: t("klimaPdfColMeasure"),
                                      colCost: t("klimaPdfColCost"),
                                      colSubsidy: t("klimaPdfColSubsidy"),
                                      colBonusEco: t("klimaPdfColBonusEco"),
                                      totalLabel: t("klimaPdfTotal"),
                                      bonusEcoLabel: t("klimaPdfBonusEco"),
                                      socialTopup: t("klimaPdfSocialTopup"),
                                      socialTopupActive: t("klimaPdfSocialActive"),
                                      checklistTitle: t("klimaPdfChecklistTitle"),
                                      checklistIntro: t("klimaPdfChecklistIntro"),
                                      checklist: [
                                        t("klimaPdfCheck1"),
                                        t("klimaPdfCheck2"),
                                        t("klimaPdfCheck3"),
                                        t("klimaPdfCheck4"),
                                        t("klimaPdfCheck5"),
                                        t("klimaPdfCheck6"),
                                        t("klimaPdfCheck7"),
                                      ],
                                      nextSteps: t("klimaPdfNextSteps"),
                                      nextStepsBody: t("klimaPdfNextStepsBody"),
                                      disclaimer: t("klimaPdfDisclaimer"),
                                      footer: t("klimaPdfFooter"),
                                    },
                                  });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `dossier-klimabonus-${new Date().toLocaleDateString("fr-LU").replace(/\//g, "-")}.pdf`;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                                className="inline-flex items-center gap-2 rounded-lg bg-teal px-3 py-1.5 text-xs font-semibold text-white hover:bg-teal/90"
                              >
                                <svg className="h-3.5 w-3.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                                {t("klimaPdfDownload")}
                              </button>
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
                    const communeAides: Record<string, { description: string; source: string }> = {
                      "Luxembourg": {
                        description: "Prime construction/acquisition : 7 200 € (+1 200 €/enfant). Rénovation énergie : 50% de l'aide étatique (isolation, fenêtres). Remplacement électroménager haute efficacité : 50% du prix (max 100 €/appareil). Réparation : 75% des coûts (max 200 €/ménage/an).",
                        source: "vdl.lu — Règlement communal du 17/10/2022"
                      },
                      "Esch-sur-Alzette": {
                        description: "Rénovation logement : 25% de la prime étatique. Efficacité énergétique (depuis 02/2016) : isolation murs/toiture 20%, fenêtres 50%, VMC 10% (max 600 €), capteurs solaires 30%, PV 10%, PAC 10%, conseil énergétique 20% — de l'aide étatique.",
                        source: "administration.esch.lu — Règlement efficience énergétique"
                      },
                      "Differdange": {
                        description: "40% de la subvention étatique pour les mesures énergétiques (photovoltaïque et autres). Règlement communal du 08/03/2016.",
                        source: "differdange.lu — Règlement communal subventions"
                      },
                      "Dudelange": {
                        description: "Construction durable : 10% aide étatique. Isolation/fenêtres/VMC : 25%. Solaire/PV/PAC/bois : 25%. Électroménager : 15% du prix (classe A-C). Vélo : 50% aide étatique (max 150 €). Véhicule électrique : max 500 €. Borne recharge : 25%.",
                        source: "dudelange.lu — Service écologique, Maison Verte"
                      },
                      "Bertrange": {
                        description: "Prime acquisition : 50% aide étatique. Efficacité énergétique/renouvelable : 25% aide étatique. Rénovation façade : 5% du coût (max 2 000 €, bâtiment 40+ ans). Eau de pluie : 30% (max 1 000 €). Toiture végétalisée : 100-300 €. Véhicule électrique : 500 € forfait.",
                        source: "bertrange.lu — Subsides & allocations"
                      },
                      "Hesperange": {
                        description: "Prime construction/acquisition : 1 500 € (+500 €/enfant, max 3 000 €). Subventions écologiques : 35% de l'aide étatique (max 8 500 €). Conditions : résidence principale 10 ans min.",
                        source: "hesperange.lu — Règlement subventions écologiques"
                      },
                      "Bettembourg": {
                        description: "Construction durable : 10% aide étatique. Conseil énergétique immeuble : 20% (max 560 €). Check chauffage : 50% (max 50 €). Pompe circulation HE : 50% (max 100 €). Eau de pluie : 50% aide étatique (max 500 €). Pacte Climat Gold (81,3%).",
                        source: "bettembourg.lu — Développement durable"
                      },
                      "Mamer": {
                        description: "30% de l'aide étatique pour PV et rénovations (max 7 200 €). Subvention d'intérêt pour construction/acquisition. Récupération eau de pluie.",
                        source: "mamer.lu — Grants"
                      },
                      "Strassen": {
                        description: "Subvention loyer : 75% de l'aide étatique. Allocation vie chère : 30% de l'allocation étatique FNS. Subventions assainissement énergétique, énergies renouvelables et récupération eau de pluie.",
                        source: "strassen.lu — Subsides & allocations"
                      },
                      "Lintgen": {
                        description: "Rénovation énergétique : 50% de l'aide étatique (max 1 500 €). Aides spécifiques chauffage biomasse et récupération eau de pluie.",
                        source: "bauerenergie.lu / lu.solution-energie.com"
                      },
                      "Beckerich": {
                        description: "Commune modèle développement durable — European Energy Award Gold (84,6%). Réseau chaleur biogaz. Suppléments Klimapakt+ pour rénovation et énergie renouvelable. Pacte Climat Gold (81,7%).",
                        source: "beckerich.lu — Pacte Climat"
                      },
                      "Junglinster": {
                        description: "Conseil énergétique : 75% aide étatique. Isolation/fenêtres : 20% (matériaux écologiques requis pour toiture). PAC géothermique : 50%. Solaire thermique chauffage : 40%. PV : 20% (max 500 €). Toiture végétalisée : 20% (max 1 500 €). Certificat LENOZ : 100%.",
                        source: "junglinster.lu — Subventions environnement"
                      },
                      "Sandweiler": {
                        description: "Prime construction : 50% aide étatique (max 2 479 €). Énergie/renouvelable : 30% aide étatique (max 7 200 €). Eau de pluie : 75% (max 750 €). Pompe circulation : 100 €. Électroménager basse conso : 100 €. E-bike : 10% (max 200 €).",
                        source: "sandweiler.lu — Subsides & allocations"
                      },
                      "Kayl": {
                        description: "Isolation (art.3) : 10% aide étatique. Renouvelables (art.4) : 25% aide étatique. Circulateur HE : 50% (max 100 €). Eau de pluie : 50% aide étatique (max 800 €). Demande dans les 6 mois après aide État.",
                        source: "kayl.lu — Règlement développement durable"
                      },
                      "Pétange": {
                        description: "Montant fixe de 500 € pour travaux liés à l'énergie et au logement. Condition : aide étatique obtenue préalablement.",
                        source: "bauerenergie.lu"
                      },
                      "Schifflange": {
                        description: "Aide financière logement individuel. Subvention conseil énergétique. Aides vélos/trottinettes électriques. Pacte Climat Gold (86,5%). CO₂ réduit de 50% depuis 2000.",
                        source: "schifflange.lu — Pacte Climat"
                      },
                      "Wiltz": {
                        description: "Mesures efficacité énergétique et utilisation rationnelle de l'énergie. Allocation de compensation mensuelle (5,41 €/personne). Pacte Climat certifié.",
                        source: "wiltz.lu — Aides financières"
                      },
                      "Diekirch": {
                        description: "Service Énergies & Environnement actif. Fait partie du réseau Nordenergie (avec Ettelbruck). Contacter directement pour montants.",
                        source: "diekirch.lu — Service Énergies"
                      },
                      "Ettelbruck": {
                        description: "Fait partie de la Nordstad. Accompagnement logement via Nordstad. Contacter directement pour les aides spécifiques.",
                        source: "ettelbruck.lu"
                      },
                    };
                    const aide = communeAides[commune];
                    return aide ? (
                      <>
                        <p>{aide.description}</p>
                        <p className="text-xs text-emerald-500 mt-2 italic">
                          Source : {aide.source}
                        </p>
                        <p className="text-xs text-emerald-600 mt-1">
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

    <SEOContent
      ns="simulateurAides"
      sections={[
        { titleKey: "panoramaTitle", contentKey: "panoramaContent" },
        { titleKey: "acquisitionTitle", contentKey: "acquisitionContent" },
        { titleKey: "renovationTitle", contentKey: "renovationContent" },
        { titleKey: "conditionsTitle", contentKey: "conditionsContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
        { questionKey: "faq5q", answerKey: "faq5a" },
      ]}
      relatedLinks={[
        { href: "/frais-acquisition", labelKey: "frais" },
        { href: "/energy/renovation", labelKey: "energyRenovation" },
        { href: "/achat-vs-location", labelKey: "achatLocation" },
      ]}
    />
    </>
  );
}
