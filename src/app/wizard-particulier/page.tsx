"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import InputField from "@/components/InputField";
import SEOContent from "@/components/SEOContent";
import { estimer, type EstimationResult } from "@/lib/estimation";
import {
  calculerFraisAcquisition,
  simulerAides,
  calculerCapitalInvesti,
  formatEUR,
  formatPct,
  type FraisAcquisitionResult,
  type AidesResult,
  type CapitalInvestiResult,
} from "@/lib/calculations";
import { rechercherCommune, type SearchResult } from "@/lib/market-data";

type Step = 0 | 1 | 2 | 3 | 4;

const STEPS = [
  { n: 1, label: "Estimation", icon: "📍" },
  { n: 2, label: "Frais d'achat", icon: "💶" },
  { n: 3, label: "Aides", icon: "🎯" },
  { n: 4, label: "Loyer légal", icon: "🔑" },
  { n: 5, label: "Récap", icon: "✅" },
];

const AIDES_TYPE_BIEN: Array<{ value: "appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee"; label: string }> = [
  { value: "appartement", label: "Appartement" },
  { value: "maison_rangee", label: "Maison rangée" },
  { value: "maison_jumelee", label: "Maison jumelée" },
  { value: "maison_isolee", label: "Maison isolée" },
];

export default function WizardParticulier() {
  const locale = useLocale();
  const lp = locale === "fr" ? "" : `/${locale}`;

  const [step, setStep] = useState<Step>(0);

  // ---------- Étape 1 : estimation ----------
  const [communeSearch, setCommuneSearch] = useState("");
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [surface, setSurface] = useState(80);
  const [nbChambres, setNbChambres] = useState(2);
  const [etage, setEtage] = useState("entre");
  const [etat, setEtat] = useState("bon");
  const [exterieur, setExterieur] = useState("balcon");
  const [parking, setParking] = useState(true);
  const [classeEnergie, setClasseEnergie] = useState("C");
  const [estNeuf, setEstNeuf] = useState(false);

  const searchResults = useMemo(() => rechercherCommune(communeSearch), [communeSearch]);

  const estimation: EstimationResult | null = useMemo(() => {
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

  // ---------- Étape 2 : frais ----------
  const [prixNegocie, setPrixNegocie] = useState(0);
  const [residencePrincipale, setResidencePrincipale] = useState(true);
  const [nbAcquereurs, setNbAcquereurs] = useState<1 | 2>(2);
  const [montantHypotheque, setMontantHypotheque] = useState(0);

  const prixRetenu = prixNegocie > 0 ? prixNegocie : estimation?.estimationCentrale ?? 0;

  const frais: FraisAcquisitionResult | null = useMemo(() => {
    if (!prixRetenu) return null;
    return calculerFraisAcquisition({
      prixBien: prixRetenu,
      estNeuf,
      residencePrincipale,
      nbAcquereurs,
      montantHypotheque: montantHypotheque > 0 ? montantHypotheque : undefined,
    });
  }, [prixRetenu, estNeuf, residencePrincipale, nbAcquereurs, montantHypotheque]);

  // ---------- Étape 3 : aides ----------
  const [revenuMenage, setRevenuMenage] = useState(90000);
  const [nbEnfants, setNbEnfants] = useState(0);
  const [typeBienAides, setTypeBienAides] = useState<"appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee">("appartement");

  const aides: AidesResult | null = useMemo(() => {
    if (!prixRetenu) return null;
    return simulerAides({
      typeProjet: estNeuf ? "construction" : "acquisition",
      prixBien: prixRetenu,
      revenuMenage,
      nbEmprunteurs: nbAcquereurs,
      nbEnfants,
      typeBien: typeBienAides,
      residencePrincipale,
      commune: selectedResult?.commune.commune,
      estNeuf,
      montantPret: montantHypotheque > 0 ? montantHypotheque : undefined,
    });
  }, [prixRetenu, estNeuf, residencePrincipale, nbAcquereurs, nbEnfants, revenuMenage, typeBienAides, selectedResult, montantHypotheque]);

  // ---------- Étape 4 : loyer légal ----------
  const [envisageLocatif, setEnvisageLocatif] = useState(false);
  const currentYear = new Date().getFullYear();
  const [anneeAcquisition, setAnneeAcquisition] = useState(currentYear);
  const [travauxMontant, setTravauxMontant] = useState(0);
  const [travauxAnnee, setTravauxAnnee] = useState(currentYear);

  const loyer: CapitalInvestiResult | null = useMemo(() => {
    if (!envisageLocatif || !prixRetenu) return null;
    return calculerCapitalInvesti({
      prixAcquisition: prixRetenu,
      anneeAcquisition,
      travauxMontant,
      travauxAnnee,
      anneeBail: currentYear,
      surfaceHabitable: surface,
      appliquerVetuste: true,
      tauxVetusteAnnuel: 1,
    });
  }, [envisageLocatif, prixRetenu, anneeAcquisition, travauxMontant, travauxAnnee, currentYear, surface]);

  // ---------- Sauvegarde brouillon (localStorage) ----------
  const [restored, setRestored] = useState(false);
  const DRAFT_KEY = "tevaxia_wizard_particulier_draft";

  useEffect(() => {
    // 1) URL params (mode conseiller) — prioritaire sur le localStorage
    const params = new URLSearchParams(window.location.search);
    if (params.has("c") || params.has("s") || params.has("nego")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      const c = params.get("c");
      if (c) {
        setCommuneSearch(c);
        const results = rechercherCommune(c);
        if (results.length > 0) setSelectedResult(results[0]);
      }
      const numParam = (key: string, setter: (n: number) => void) => {
        const v = params.get(key);
        if (v !== null && !isNaN(Number(v))) setter(Number(v));
      };
      const boolParam = (key: string, setter: (b: boolean) => void) => {
        const v = params.get(key);
        if (v !== null) setter(v === "1" || v === "true");
      };
      const strParam = (key: string, setter: (s: string) => void) => {
        const v = params.get(key);
        if (v !== null) setter(v);
      };
      numParam("s", setSurface);
      numParam("ch", setNbChambres);
      strParam("et", setEtage);
      strParam("ea", setEtat);
      strParam("ex", setExterieur);
      boolParam("p", setParking);
      strParam("e", setClasseEnergie);
      boolParam("n", setEstNeuf);
      numParam("nego", setPrixNegocie);
      boolParam("rp", setResidencePrincipale);
      numParam("nb", (v) => setNbAcquereurs((v === 1 || v === 2 ? v : 2) as 1 | 2));
      numParam("h", setMontantHypotheque);
      numParam("rv", setRevenuMenage);
      numParam("en", setNbEnfants);
      strParam("tb", (v) => setTypeBienAides(v as typeof typeBienAides));
      numParam("step", (n) => setStep(Math.max(0, Math.min(4, n)) as Step));
      setRestored(true);
      return;
    }

    // 2) localStorage fallback
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw) as Record<string, unknown>;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (typeof d.step === "number") setStep(d.step as Step);
      if (typeof d.communeSearch === "string") setCommuneSearch(d.communeSearch);
      if (d.selectedResult) setSelectedResult(d.selectedResult as SearchResult);
      if (typeof d.surface === "number") setSurface(d.surface);
      if (typeof d.nbChambres === "number") setNbChambres(d.nbChambres);
      if (typeof d.etage === "string") setEtage(d.etage);
      if (typeof d.etat === "string") setEtat(d.etat);
      if (typeof d.exterieur === "string") setExterieur(d.exterieur);
      if (typeof d.parking === "boolean") setParking(d.parking);
      if (typeof d.classeEnergie === "string") setClasseEnergie(d.classeEnergie);
      if (typeof d.estNeuf === "boolean") setEstNeuf(d.estNeuf);
      if (typeof d.prixNegocie === "number") setPrixNegocie(d.prixNegocie);
      if (typeof d.residencePrincipale === "boolean") setResidencePrincipale(d.residencePrincipale);
      if (d.nbAcquereurs === 1 || d.nbAcquereurs === 2) setNbAcquereurs(d.nbAcquereurs);
      if (typeof d.montantHypotheque === "number") setMontantHypotheque(d.montantHypotheque);
      if (typeof d.revenuMenage === "number") setRevenuMenage(d.revenuMenage);
      if (typeof d.nbEnfants === "number") setNbEnfants(d.nbEnfants);
      if (typeof d.typeBienAides === "string") setTypeBienAides(d.typeBienAides as typeof typeBienAides);
      if (typeof d.envisageLocatif === "boolean") setEnvisageLocatif(d.envisageLocatif);
      if (typeof d.anneeAcquisition === "number") setAnneeAcquisition(d.anneeAcquisition);
      if (typeof d.travauxMontant === "number") setTravauxMontant(d.travauxMontant);
      if (typeof d.travauxAnnee === "number") setTravauxAnnee(d.travauxAnnee);
      setRestored(true);
    } catch { /* ignore */ }
  }, []);

  // Génère une URL shareable avec l'état courant (mode conseiller)
  const buildShareUrl = () => {
    const params = new URLSearchParams();
    if (selectedResult?.commune.commune) params.set("c", selectedResult.commune.commune);
    params.set("s", String(surface));
    params.set("ch", String(nbChambres));
    params.set("et", etage);
    params.set("ea", etat);
    params.set("ex", exterieur);
    params.set("p", parking ? "1" : "0");
    params.set("e", classeEnergie);
    params.set("n", estNeuf ? "1" : "0");
    if (prixNegocie > 0) params.set("nego", String(prixNegocie));
    params.set("rp", residencePrincipale ? "1" : "0");
    params.set("nb", String(nbAcquereurs));
    if (montantHypotheque > 0) params.set("h", String(montantHypotheque));
    params.set("rv", String(revenuMenage));
    params.set("en", String(nbEnfants));
    params.set("tb", typeBienAides);
    params.set("step", "0"); // client démarre à l'étape 1
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  const [copiedUrl, setCopiedUrl] = useState(false);
  const shareConseiller = async () => {
    const url = buildShareUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback : prompt avec l'URL
      prompt("Copiez cette URL :", url);
    }
  };

  useEffect(() => {
    // Sérialise sur tout changement de state — throttling non nécessaire,
    // localStorage.setItem est synchrone et peu coûteux (<10ms pour ~1KB).
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          step, communeSearch, selectedResult, surface, nbChambres, etage, etat,
          exterieur, parking, classeEnergie, estNeuf,
          prixNegocie, residencePrincipale, nbAcquereurs, montantHypotheque,
          revenuMenage, nbEnfants, typeBienAides,
          envisageLocatif, anneeAcquisition, travauxMontant, travauxAnnee,
          savedAt: new Date().toISOString(),
        })
      );
    } catch { /* ignore quota errors */ }
  }, [step, communeSearch, selectedResult, surface, nbChambres, etage, etat, exterieur, parking, classeEnergie, estNeuf, prixNegocie, residencePrincipale, nbAcquereurs, montantHypotheque, revenuMenage, nbEnfants, typeBienAides, envisageLocatif, anneeAcquisition, travauxMontant, travauxAnnee]);

  const resetDraft = () => {
    if (!confirm("Effacer ce brouillon et recommencer depuis le début ?")) return;
    try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ }
    window.location.reload();
  };

  // ---------- Navigation ----------
  const canNext = step === 0
    ? !!estimation
    : step === 1
      ? !!frais
      : step === 2
        ? !!aides
        : true;

  const next = () => setStep((s) => (s < 4 ? (s + 1) as Step : s));
  const prev = () => setStep((s) => (s > 0 ? (s - 1) as Step : s));

  // ---------- Agrégats récap ----------
  const coutTotal = (prixRetenu || 0) + (frais?.totalFrais ?? 0);
  const aidesCash = aides?.totalAidesDirectes ?? 0;
  const coutNetEstime = coutTotal - aidesCash;

  return (
    <div className="bg-background py-8 sm:py-12 min-h-screen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link href={`${lp}/`} className="text-xs text-muted hover:text-navy">← tevaxia.lu</Link>
          <h1 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">Wizard Particulier — votre projet en 4 étapes</h1>
          <p className="mt-2 text-sm text-muted">
            Estimation → frais d&apos;achat → aides de l&apos;État → règle du loyer légal. Tout en un seul parcours guidé.
          </p>
        </div>

        {restored && (
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <span>
              <svg className="inline h-4 w-4 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Brouillon restauré automatiquement (sauvegardé dans votre navigateur).
            </span>
            <button onClick={resetDraft} className="text-xs font-medium text-emerald-800 underline hover:no-underline">
              Recommencer de zéro
            </button>
          </div>
        )}

        {/* Step indicator */}
        <div className="mb-8 rounded-xl border border-card-border bg-card p-4">
          <div className="flex items-center justify-between gap-2">
            {STEPS.map((s, i) => (
              <div key={s.n} className="flex flex-1 items-center">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    i < step
                      ? "bg-emerald-600 text-white"
                      : i === step
                        ? "bg-navy text-white"
                        : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {i < step ? "✓" : s.n}
                </div>
                <div className="ml-2 hidden sm:block">
                  <div className={`text-xs font-medium ${i === step ? "text-navy" : "text-muted"}`}>
                    {s.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mx-2 h-0.5 flex-1 ${i < step ? "bg-emerald-600" : "bg-slate-200"}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Estimation */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Où et quoi ?</h2>
              <p className="mt-1 text-xs text-muted">Recherchez votre commune ou quartier, puis décrivez le bien envisagé.</p>

              <div className="mt-4 relative">
                <input
                  type="text"
                  value={communeSearch}
                  onChange={(e) => { setCommuneSearch(e.target.value); if (!e.target.value) setSelectedResult(null); }}
                  placeholder="Ex. Luxembourg, Belair, Esch-sur-Alzette…"
                  className="w-full rounded-lg border border-input-border bg-input-bg px-3 py-3 text-sm"
                />
                {communeSearch.length >= 2 && searchResults.length > 0 && !selectedResult && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-card-border bg-card shadow-lg max-h-60 overflow-y-auto">
                    {searchResults.map((r) => (
                      <button
                        key={r.commune.commune + r.matchedOn}
                        onClick={() => {
                          setSelectedResult(r);
                          setCommuneSearch(r.isLocalite ? `${r.matchedOn} (${r.commune.commune})` : r.commune.commune);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-background"
                      >
                        <span className="font-medium">{r.isLocalite ? r.matchedOn : r.commune.commune}</span>
                        <span className="text-muted ml-2">({r.commune.canton})</span>
                        <span className="float-right font-mono text-navy">
                          {r.quartier ? formatEUR(r.quartier.prixM2) : r.commune.prixM2Existant ? formatEUR(r.commune.prixM2Existant) : "—"}/m²
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedResult && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField label="Surface habitable" value={surface} onChange={(v) => setSurface(Number(v) || 0)} suffix="m²" min={10} max={500} />
                  <InputField label="Nombre de chambres" value={nbChambres} onChange={(v) => setNbChambres(Number(v) || 0)} min={0} max={10} />
                  <InputField label="Étage" type="select" value={etage} onChange={setEtage} options={[
                    { value: "rdc", label: "Rez-de-chaussée" },
                    { value: "entre", label: "Étage intermédiaire" },
                    { value: "dernier", label: "Dernier étage" },
                    { value: "maison", label: "Maison" },
                  ]} />
                  <InputField label="État" type="select" value={etat} onChange={setEtat} options={[
                    { value: "neuf", label: "Neuf" },
                    { value: "renove", label: "Rénové récent" },
                    { value: "bon", label: "Bon état" },
                    { value: "rafraichir", label: "À rafraîchir" },
                    { value: "renover", label: "À rénover" },
                  ]} />
                  <InputField label="Extérieur" type="select" value={exterieur} onChange={setExterieur} options={[
                    { value: "aucun", label: "Aucun" },
                    { value: "balcon", label: "Balcon" },
                    { value: "terrasse", label: "Terrasse" },
                    { value: "jardin", label: "Jardin" },
                  ]} />
                  <InputField label="Classe énergie" type="select" value={classeEnergie} onChange={setClasseEnergie} options={["A", "B", "C", "D", "E", "F", "G"].map((c) => ({ value: c, label: c }))} />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={parking} onChange={(e) => setParking(e.target.checked)} className="h-4 w-4" />
                    <span>Parking privatif</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={estNeuf} onChange={(e) => setEstNeuf(e.target.checked)} className="h-4 w-4" />
                    <span>Construction neuve (VEFA / moins de 2 ans)</span>
                  </label>
                </div>
              )}
            </div>

            {estimation && (
              <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-6 text-white shadow-lg">
                <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Estimation indicative</div>
                <div className="mt-2 text-3xl sm:text-4xl font-bold">{formatEUR(estimation.estimationCentrale)}</div>
                <div className="mt-1 text-sm text-white/90">
                  Fourchette : {formatEUR(estimation.estimationBasse)} – {formatEUR(estimation.estimationHaute)}
                </div>
                <div className="mt-2 text-xs text-white/80">
                  Prix au m² ajusté : <span className="font-semibold">{formatEUR(estimation.prixM2Ajuste)}</span>
                  {" · Confiance : "}<span className="font-semibold capitalize">{estimation.confiance}</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Frais */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Frais d&apos;acquisition</h2>
              <p className="mt-1 text-xs text-muted">
                Droits d&apos;enregistrement (7 % ou 3,5 % temporaire), crédit Bëllegen Akt, TVA 3 % si neuf + RP, notaire, hypothèque.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Prix négocié (laisser 0 pour utiliser l'estimation)"
                  value={prixNegocie}
                  onChange={(v) => setPrixNegocie(Number(v) || 0)}
                  suffix="€"
                  hint={estimation ? `Estimation centrale : ${formatEUR(estimation.estimationCentrale)}` : undefined}
                />
                <InputField
                  label="Montant hypothèque envisagé"
                  value={montantHypotheque}
                  onChange={(v) => setMontantHypotheque(Number(v) || 0)}
                  suffix="€"
                  hint="Pour estimer les frais d'inscription hypothécaire"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={residencePrincipale} onChange={(e) => setResidencePrincipale(e.target.checked)} className="h-4 w-4" />
                  <span>Résidence principale (→ Bëllegen Akt + TVA 3%)</span>
                </label>
                <InputField
                  label="Nombre d'acquéreurs (crédit Bëllegen Akt)"
                  type="select"
                  value={String(nbAcquereurs)}
                  onChange={(v) => setNbAcquereurs(Number(v) === 2 ? 2 : 1)}
                  options={[{ value: "1", label: "Seul" }, { value: "2", label: "Couple" }]}
                />
              </div>
            </div>

            {frais && (
              <div className="rounded-xl border border-card-border bg-card p-6">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Total des frais</div>
                <div className="mt-1 text-3xl font-bold text-navy">{formatEUR(frais.totalFrais)}</div>
                <div className="mt-1 text-sm text-muted">
                  Soit <span className="font-semibold">{formatPct(frais.totalPourcentage)}</span> du prix · coût total {formatEUR(frais.coutTotalAcquisition)}
                </div>

                <div className="mt-4 divide-y divide-card-border/50 text-sm">
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Droits d&apos;enregistrement + transcription</span>
                    <span className="font-medium">{formatEUR(frais.droitsTotal)}</span>
                  </div>
                  {frais.creditBellegenAkt > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted">- Crédit Bëllegen Akt</span>
                      <span className="font-medium text-emerald-700">- {formatEUR(frais.creditBellegenAkt)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Droits après crédit</span>
                    <span className="font-medium">{formatEUR(frais.droitsApresCredit)}</span>
                  </div>
                  {frais.montantTva > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted">TVA {(frais.tauxTva * 100).toFixed(0)} %{frais.faveurFiscaleTva > 0 ? ` (faveur ${formatEUR(frais.faveurFiscaleTva)})` : ""}</span>
                      <span className="font-medium">{formatEUR(frais.montantTva)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-1.5">
                    <span className="text-muted">Émoluments notaire</span>
                    <span className="font-medium">{formatEUR(frais.emolumentsNotaire)}</span>
                  </div>
                  {frais.fraisHypotheque > 0 && (
                    <div className="flex justify-between py-1.5">
                      <span className="text-muted">Frais hypothécaires</span>
                      <span className="font-medium">{formatEUR(frais.fraisHypotheque)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 3: Aides */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Aides de l&apos;État</h2>
              <p className="mt-1 text-xs text-muted">
                5 couches : aides étatiques, rénovation énergétique, aides privées, communales, patrimoine.
              </p>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Revenu annuel brut du ménage"
                  value={revenuMenage}
                  onChange={(v) => setRevenuMenage(Number(v) || 0)}
                  suffix="€"
                  hint="Plafond selon composition du ménage"
                />
                <InputField
                  label="Nombre d'enfants à charge"
                  value={nbEnfants}
                  onChange={(v) => setNbEnfants(Number(v) || 0)}
                  min={0}
                  max={10}
                />
                <InputField
                  label="Type de bien"
                  type="select"
                  value={typeBienAides}
                  onChange={(v) => setTypeBienAides(v as "appartement" | "maison_rangee" | "maison_jumelee" | "maison_isolee")}
                  options={AIDES_TYPE_BIEN}
                />
              </div>
            </div>

            {aides && (
              <div className="rounded-xl border border-card-border bg-card p-6">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Total aides (cash + économies)</div>
                <div className="mt-1 text-3xl font-bold text-emerald-700">{formatEUR(aides.totalGeneral)}</div>
                <div className="mt-1 text-sm text-muted">
                  Cash direct : {formatEUR(aides.totalAidesDirectes)} · économies : {formatEUR(aides.totalEconomies)}
                </div>

                {aides.aides.length === 0 ? (
                  <p className="mt-4 text-sm text-muted">Aucune aide détectée pour ce profil.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {aides.aides.slice(0, 10).map((a, i) => (
                      <div key={i} className="rounded-lg border border-card-border bg-background p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-semibold text-navy">{a.nom}</div>
                            <div className="mt-0.5 text-xs text-muted">{a.description}</div>
                          </div>
                          <div className="shrink-0 text-sm font-bold text-emerald-700">{formatEUR(a.montant)}</div>
                        </div>
                      </div>
                    ))}
                    {aides.aides.length > 10 && (
                      <p className="text-xs text-muted">+ {aides.aides.length - 10} autres aides détaillées dans le <Link href={`${lp}/simulateur-aides`} className="text-navy underline">simulateur complet</Link>.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Step 4: Loyer légal */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="rounded-xl border border-card-border bg-card p-6">
              <h2 className="text-base font-semibold text-navy">Mise en location future ? — Règle des 5 %</h2>
              <p className="mt-1 text-xs text-muted">
                Au Luxembourg, le loyer annuel maximum = 5 % du capital investi réévalué (avec décote de vétusté). Ignorez cette étape si vous achetez pour vous loger.
              </p>

              <label className="mt-4 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={envisageLocatif} onChange={(e) => setEnvisageLocatif(e.target.checked)} className="h-4 w-4" />
                <span>J&apos;envisage de louer ce bien (estimer le plafond légal)</span>
              </label>

              {envisageLocatif && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField label="Année d'acquisition (réelle ou cible)" value={anneeAcquisition} onChange={(v) => setAnneeAcquisition(Number(v) || currentYear)} min={1960} max={currentYear + 5} />
                  <InputField label="Montant travaux (si applicable)" value={travauxMontant} onChange={(v) => setTravauxMontant(Number(v) || 0)} suffix="€" />
                  {travauxMontant > 0 && (
                    <InputField label="Année des travaux" value={travauxAnnee} onChange={(v) => setTravauxAnnee(Number(v) || currentYear)} min={1960} max={currentYear + 5} />
                  )}
                </div>
              )}
            </div>

            {loyer && envisageLocatif && (
              <div className="rounded-xl border border-card-border bg-card p-6">
                <div className="text-xs uppercase tracking-wider text-muted font-semibold">Loyer mensuel légal maximum</div>
                <div className="mt-1 text-3xl font-bold text-navy">{formatEUR(loyer.loyerMensuelMax)} <span className="text-sm text-muted">/ mois</span></div>
                <div className="mt-1 text-sm text-muted">
                  Soit {formatEUR(loyer.loyerM2Mensuel)}/m²/mois · {formatEUR(loyer.loyerAnnuelMax)} /an
                </div>
                <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                  <div className="flex justify-between"><span className="text-muted">Capital investi réévalué</span><span className="font-medium">{formatEUR(loyer.capitalInvesti)}</span></div>
                  <div className="flex justify-between"><span className="text-muted">Prix réévalué</span><span className="font-medium">{formatEUR(loyer.prixReevalue)}</span></div>
                  {loyer.travauxReevalues > 0 && (
                    <div className="flex justify-between"><span className="text-muted">Travaux réévalués</span><span className="font-medium">{formatEUR(loyer.travauxReevalues)}</span></div>
                  )}
                  <div className="flex justify-between"><span className="text-muted">Décote vétusté</span><span className="font-medium">- {formatEUR(loyer.decoteVetuste)} ({loyer.decoteVetustePct.toFixed(1)} %)</span></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Récap */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 p-6 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/80 font-semibold">Récapitulatif de votre projet</div>
              <div className="mt-2 text-lg font-semibold">
                {selectedResult?.quartier?.nom ?? selectedResult?.commune.commune ?? "—"} · {surface} m² · {nbChambres} ch.
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <div className="text-xs text-white/70">Prix retenu</div>
                  <div className="text-lg font-bold">{formatEUR(prixRetenu)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">+ Frais</div>
                  <div className="text-lg font-bold">{formatEUR(frais?.totalFrais ?? 0)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">- Aides cash</div>
                  <div className="text-lg font-bold">{formatEUR(aidesCash)}</div>
                </div>
                <div>
                  <div className="text-xs text-white/70">Coût net estimé</div>
                  <div className="text-lg font-bold">{formatEUR(coutNetEstime)}</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6">
              <h3 className="text-base font-semibold text-navy">Pour aller plus loin</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <Link href={`${lp}/outils-bancaires`} className="rounded-lg border border-card-border bg-background p-4 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-navy">Capacité d&apos;emprunt &amp; DSCR</div>
                  <div className="mt-1 text-xs text-muted">Vérifiez si votre taux d&apos;effort et votre LTV passent les critères bancaires LU.</div>
                </Link>
                <Link href={`${lp}/simulateur-aides`} className="rounded-lg border border-card-border bg-background p-4 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-navy">Simulateur d&apos;aides détaillé</div>
                  <div className="mt-1 text-xs text-muted">Les 5 couches (étatique, énergie, privée, communale, patrimoine) avec conditions et sources légales.</div>
                </Link>
                <Link href={`${lp}/plus-values`} className="rounded-lg border border-card-border bg-background p-4 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-navy">Plus-value à la revente</div>
                  <div className="mt-1 text-xs text-muted">Simulez l&apos;impôt sur plus-value selon la durée de détention.</div>
                </Link>
                <Link href={`${lp}/carte`} className="rounded-lg border border-card-border bg-background p-4 hover:bg-slate-50">
                  <div className="text-sm font-semibold text-navy">Carte des prix</div>
                  <div className="mt-1 text-xs text-muted">Comparez votre commune aux 100 autres couvertes par l&apos;Observatoire de l&apos;Habitat.</div>
                </Link>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const subject = `Mon projet immobilier — ${selectedResult?.commune.commune ?? "Luxembourg"}`;
                  const lines = [
                    `Récapitulatif estimé via tevaxia.lu`,
                    ``,
                    `Bien : ${selectedResult?.quartier?.nom ?? selectedResult?.commune.commune ?? "—"}`,
                    `Surface : ${surface} m² · ${nbChambres} chambres · classe ${classeEnergie}`,
                    `Type : ${estNeuf ? "Neuf (VEFA)" : "Existant"}`,
                    ``,
                    `— Estimation —`,
                    `Prix estimé : ${formatEUR(estimation?.estimationCentrale ?? 0)}`,
                    `Fourchette : ${formatEUR(estimation?.estimationBasse ?? 0)} — ${formatEUR(estimation?.estimationHaute ?? 0)}`,
                    ``,
                    `— Budget —`,
                    `Prix retenu : ${formatEUR(prixRetenu)}`,
                    `Frais acquisition : ${formatEUR(frais?.totalFrais ?? 0)}`,
                    `Aides cash : ${formatEUR(aidesCash)}`,
                    `Coût net estimé : ${formatEUR(coutNetEstime)}`,
                    ``,
                    envisageLocatif && loyer ? `— Location —` : "",
                    envisageLocatif && loyer ? `Loyer légal max (règle 5 %) : ${formatEUR(loyer.loyerMensuelMax)} / mois` : "",
                    ``,
                    `Source : tevaxia.lu (outils gratuits analyse immo LU) — ${window.location.origin}`,
                  ].filter(Boolean);
                  const body = encodeURIComponent(lines.join("\n"));
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${body}`;
                }}
                className="rounded-lg border border-navy bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-navy/5 inline-flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                </svg>
                Envoyer ce récap par email
              </button>
              <button
                onClick={() => window.print()}
                className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0 1 10.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0 .229 2.523a1.125 1.125 0 0 1-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18" />
                </svg>
                Imprimer / PDF
              </button>
              <button
                onClick={shareConseiller}
                className={`rounded-lg border px-4 py-2 text-sm font-semibold inline-flex items-center gap-2 ${
                  copiedUrl ? "border-emerald-500 bg-emerald-50 text-emerald-900" : "border-navy bg-white text-navy hover:bg-navy/5"
                }`}
                title="Copier une URL pré-remplie (mode agent/conseiller)"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                </svg>
                {copiedUrl ? "URL copiée ✓" : "Partager ce scénario (lien)"}
              </button>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              Estimations indicatives basées sur les données publiques Observatoire de l&apos;Habitat / data.public.lu et les barèmes fiscaux luxembourgeois. Pour un avis formel (banque, succession, expertise judiciaire), faites établir un rapport TEGOVA EVS 2025 par un évaluateur certifié.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={step === 0}
            className="rounded-lg border border-card-border bg-white px-4 py-2 text-sm font-semibold text-navy hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Précédent
          </button>
          {step < 4 ? (
            <button
              onClick={next}
              disabled={!canNext}
              className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Suivant →
            </button>
          ) : (
            <Link
              href={`${lp}/`}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Retour à l&apos;accueil
            </Link>
          )}
        </div>
      </div>

      <SEOContent
        ns="wizardParticulier"
        sections={[
          { titleKey: "contextTitle", contentKey: "contextContent" },
          { titleKey: "etapesTitle", contentKey: "etapesContent" },
          { titleKey: "avantagesTitle", contentKey: "avantagesContent" },
          { titleKey: "limitesTitle", contentKey: "limitesContent" },
        ]}
        faq={[
          { questionKey: "faq1q", answerKey: "faq1a" },
          { questionKey: "faq2q", answerKey: "faq2a" },
          { questionKey: "faq3q", answerKey: "faq3a" },
          { questionKey: "faq4q", answerKey: "faq4a" },
        ]}
        relatedLinks={[
          { href: "/estimation", labelKey: "estimation" },
          { href: "/frais-acquisition", labelKey: "frais" },
          { href: "/simulateur-aides", labelKey: "aides" },
        ]}
      />
    </div>
  );
}
