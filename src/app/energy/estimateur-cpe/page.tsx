"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";

/* ── Class colors (same as impact / renovation pages) ── */
const CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white",
  B: "bg-green-500 text-white",
  C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900",
  E: "bg-orange-400 text-white",
  F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white",
  H: "bg-red-700 text-white",
  I: "bg-red-900 text-white",
};

const CLASS_BG: Record<string, string> = {
  A: "border-green-600 bg-green-50",
  B: "border-green-500 bg-green-50",
  C: "border-lime-500 bg-lime-50",
  D: "border-yellow-400 bg-yellow-50",
  E: "border-orange-400 bg-orange-50",
  F: "border-orange-600 bg-orange-50",
  G: "border-red-600 bg-red-50",
  H: "border-red-700 bg-red-50",
  I: "border-red-900 bg-red-50",
};

/* ── Questions & scoring ── */

interface Option {
  label: string;
  points: number;
}

interface Step {
  title: string;
  key: string;
  options: Option[];
}

/* ── Score -> class mapping ── */
function scoreToClass(score: number): string {
  if (score >= 67) return "A";
  if (score >= 59) return "B";
  if (score >= 51) return "C";
  if (score >= 43) return "D";
  if (score >= 35) return "E";
  if (score >= 27) return "F";
  if (score >= 19) return "G";
  if (score >= 11) return "H";
  return "I";
}

/* ── Score -> estimated consumption (kWh/m²/an) ── */
function scoreToConsumption(score: number): { min: number; central: number; max: number } {
  if (score >= 67) return { min: 0, central: 35, max: 45 };      // A
  if (score >= 59) return { min: 45, central: 60, max: 75 };     // B
  if (score >= 51) return { min: 75, central: 93, max: 110 };    // C
  if (score >= 43) return { min: 110, central: 130, max: 160 };  // D
  if (score >= 35) return { min: 160, central: 180, max: 220 };  // E
  if (score >= 27) return { min: 220, central: 255, max: 310 };  // F
  if (score >= 19) return { min: 310, central: 350, max: 420 };  // G
  if (score >= 11) return { min: 420, central: 450, max: 520 };  // H
  return { min: 520, central: 550, max: 650 };                    // I
}

/* ── Price per kWh (LU mix 2026) ── */
const PRIX_KWH = 0.22;
/* ── CO₂ factor kg/kWh ── */
const CO2_FACTOR = 0.300;

/* ── Component ── */

export default function EstimateurCpePage() {
  const t = useTranslations("energy.estimateurCpe");

  const STEPS: Step[] = [
    {
      title: t("stepTypeTitle"),
      key: "type",
      options: [
        { label: t("optAppartement"), points: 5 },
        { label: t("optMaisonMitoyenne"), points: 3 },
        { label: t("optMaisonIndividuelle"), points: 0 },
      ],
    },
    {
      title: t("stepAnneeTitle"),
      key: "annee",
      options: [
        { label: t("optAvant1945"), points: 0 },
        { label: t("opt1945_1970"), points: 2 },
        { label: t("opt1970_1990"), points: 5 },
        { label: t("opt1990_2005"), points: 10 },
        { label: t("opt2005_2015"), points: 15 },
        { label: t("optApres2015"), points: 20 },
      ],
    },
    {
      title: t("stepChauffageTitle"),
      key: "chauffage",
      options: [
        { label: t("optFioul"), points: 0 },
        { label: t("optElectriqueDirect"), points: 2 },
        { label: t("optGazNaturel"), points: 5 },
        { label: t("optBoisPellets"), points: 8 },
        { label: t("optChauffageUrbain"), points: 10 },
        { label: t("optPompeAChaleur"), points: 15 },
      ],
    },
    {
      title: t("stepIsolationTitle"),
      key: "isolation",
      options: [
        { label: t("optAucuneIsolation"), points: 0 },
        { label: t("optIsolationPartielle"), points: 5 },
        { label: t("optBonneIsolation"), points: 10 },
        { label: t("optExcellenteIsolation"), points: 15 },
      ],
    },
    {
      title: t("stepFenetresTitle"),
      key: "fenetres",
      options: [
        { label: t("optSimpleVitrage"), points: 0 },
        { label: t("optDoubleVitrageAncien"), points: 3 },
        { label: t("optDoubleVitrageRecent"), points: 8 },
        { label: t("optTripleVitrage"), points: 12 },
      ],
    },
    {
      title: t("stepVentilationTitle"),
      key: "ventilation",
      options: [
        { label: t("optVentilationNaturelle"), points: 0 },
        { label: t("optVmcSimpleFlux"), points: 5 },
        { label: t("optVmcDoubleFlux"), points: 10 },
      ],
    },
  ];

  const TOTAL_STEPS = STEPS.length;

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [surface, setSurface] = useState(100);

  const isFinished = step >= TOTAL_STEPS;

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const estimatedClass = scoreToClass(totalScore);
  const conso = scoreToConsumption(totalScore);

  /* Handlers */
  function selectOption(key: string, points: number) {
    setAnswers((prev) => ({ ...prev, [key]: points }));
    setStep((s) => s + 1);
  }

  function goBack() {
    if (step > 0) {
      const prevKey = STEPS[step - 1].key;
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[prevKey];
        return next;
      });
      setStep((s) => s - 1);
    }
  }

  function restart() {
    setStep(0);
    setAnswers({});
  }

  /* ── Progress bar ── */
  const progressPct = isFinished ? 100 : (step / TOTAL_STEPS) * 100;

  return (
    <>
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("description")}
          </p>
        </div>

        {/* Surface input — always visible */}
        <div className="mb-6 rounded-2xl border border-card-border bg-card p-4 sm:p-5 shadow-sm">
          <label
            htmlFor="surface"
            className="block text-sm font-semibold text-foreground mb-2"
          >
            {t("surfaceLabel")} ({t("surfaceUnit")})
          </label>
          <div className="flex items-center gap-3">
            <input
              id="surface"
              type="number"
              min={10}
              max={1000}
              step={1}
              value={surface}
              onChange={(e) => setSurface(Math.max(1, Number(e.target.value) || 1))}
              className="w-32 rounded-xl border-2 border-card-border bg-card px-4 py-2.5 text-sm font-medium text-foreground focus:border-energy focus:ring-1 focus:ring-energy outline-none transition-all"
            />
            <span className="text-sm text-muted">{t("surfaceUnit")}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {isFinished
                ? t("result")
                : t("stepProgress", { current: step + 1, total: TOTAL_STEPS })}
            </span>
            <span className="text-sm text-muted">
              {Math.round(progressPct)}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
            <div
              className="h-full rounded-full bg-energy transition-all duration-500 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* ── Question step ── */}
        {!isFinished && (
          <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 shadow-sm">
            <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-1">
              {STEPS[step].title}
            </h2>
            <p className="text-sm text-muted mb-6">
              {t("selectInstruction")}
            </p>

            <div className="grid gap-3">
              {STEPS[step].options.map((opt) => {
                const isSelected = answers[STEPS[step].key] === opt.points;
                return (
                  <button
                    key={opt.label}
                    onClick={() => selectOption(STEPS[step].key, opt.points)}
                    className={`w-full text-left rounded-xl border-2 px-5 py-4 transition-all ${
                      isSelected
                        ? "border-energy bg-energy/5 ring-1 ring-energy"
                        : "border-card-border bg-card hover:border-energy/40 hover:bg-energy/5"
                    }`}
                  >
                    <span className="text-sm sm:text-base font-medium text-foreground">
                      {opt.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Navigation */}
            {step > 0 && (
              <button
                onClick={goBack}
                className="mt-6 inline-flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition-colors"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t("previousQuestion")}
              </button>
            )}
          </div>
        )}

        {/* ── Result ── */}
        {isFinished && (
          <div className="space-y-6">
            {/* Class badge */}
            <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 shadow-sm text-center">
              <p className="text-sm text-muted mb-4">
                {t("estimatedClassLabel")}
              </p>
              <div className="flex justify-center mb-4">
                <div
                  className={`inline-flex items-center justify-center w-28 h-28 rounded-2xl text-6xl font-black shadow-lg ${CLASS_COLORS[estimatedClass]}`}
                >
                  {estimatedClass}
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">
                {t("classLabel", { classe: estimatedClass })}
              </p>
              <p className="text-sm text-muted mb-2">
                {t("scoreLabel", { score: totalScore })}
              </p>

              {/* Score detail */}
              <div className="mt-6 rounded-xl border border-card-border bg-gray-50 p-4 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  {t("scoreDetail")}
                </h3>
                <div className="space-y-2">
                  {STEPS.map((s) => {
                    const pts = answers[s.key] ?? 0;
                    const maxPts = Math.max(...s.options.map((o) => o.points));
                    const chosen = s.options.find((o) => o.points === pts);
                    return (
                      <div
                        key={s.key}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted">{s.title}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted">
                            {chosen?.label}
                          </span>
                          <span className="font-mono font-semibold text-foreground">
                            {pts}/{maxPts}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scale bar */}
              <div className="mt-6">
                <div className="flex gap-1">
                  {["A", "B", "C", "D", "E", "F", "G", "H", "I"].map((c) => (
                    <div
                      key={c}
                      className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
                        c === estimatedClass
                          ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy scale-110`
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {c}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Consumption breakdown ── */}
            <div className="rounded-2xl border border-card-border bg-card p-6 sm:p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-foreground mb-5">
                {t("consoEstimee")}
              </h3>

              {/* Central value */}
              <div className="text-center mb-4">
                <span className="text-4xl sm:text-5xl font-black text-energy">
                  {conso.central}
                </span>
                <span className="ml-2 text-lg text-muted">kWh/m²/an</span>
              </div>
              <p className="text-center text-sm text-muted mb-6">
                {t("consoFourchette", { min: conso.min, max: conso.max })}
              </p>

              {/* Consumption scale bar */}
              <div className="mb-6">
                <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-green-500 via-yellow-400 via-orange-400 to-red-700">
                  <div
                    className="absolute top-0 h-full w-1 bg-white shadow-md border border-gray-800 rounded-full"
                    style={{
                      left: `${Math.min(Math.max((conso.central / 650) * 100, 2), 98)}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-xs text-muted">A</span>
                  <span className="text-xs text-muted">I</span>
                </div>
              </div>

              {/* Detail grid */}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-card-border bg-gray-50 p-4 text-center">
                  <p className="text-xs text-muted mb-1">{t("consoTotale")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {(conso.central * surface).toLocaleString("fr-LU")}
                  </p>
                  <p className="text-xs text-muted">kWh/an</p>
                  <p className="text-[11px] text-muted mt-1">
                    ({surface} {t("surfaceUnit")})
                  </p>
                </div>
                <div className="rounded-xl border border-card-border bg-gray-50 p-4 text-center">
                  <p className="text-xs text-muted mb-1">{t("coutEstime")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {Math.round(conso.central * surface * PRIX_KWH).toLocaleString("fr-LU")}
                  </p>
                  <p className="text-xs text-muted">&euro;/an</p>
                  <p className="text-[11px] text-muted mt-1">{t("prixKwh")}</p>
                </div>
                <div className="rounded-xl border border-card-border bg-gray-50 p-4 text-center">
                  <p className="text-xs text-muted mb-1">{t("emissionsCO2")}</p>
                  <p className="text-xl font-bold text-foreground">
                    {(conso.central * surface * CO2_FACTOR / 1000).toLocaleString("fr-LU", { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </p>
                  <p className="text-xs text-muted">tonnes/an</p>
                </div>
              </div>
            </div>

            {/* Confidence indicator */}
            <div
              className={`rounded-2xl border-2 ${CLASS_BG[estimatedClass]} p-5`}
            >
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">
                  <svg
                    className="w-5 h-5 text-amber-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {t("disclaimerTitle")}
                  </p>
                  <p className="text-sm text-muted mt-1">
                    {t("disclaimerText")}
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {t("exploreTitle")}
              </h3>
              <p className="text-xs text-muted mb-4">
                {t("exploreDescription", { classe: estimatedClass })}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href={`/impact?classe=${estimatedClass}`}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-card-border bg-card px-4 py-5 text-center transition-all hover:border-energy hover:bg-energy/5"
                >
                  <svg
                    className="w-7 h-7 text-energy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t("linkImpactTitle")}
                  </span>
                  <span className="text-xs text-muted">
                    {t("linkImpactSub")}
                  </span>
                </Link>
                <Link
                  href={`/renovation?classe=${estimatedClass}`}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-card-border bg-card px-4 py-5 text-center transition-all hover:border-energy hover:bg-energy/5"
                >
                  <svg
                    className="w-7 h-7 text-energy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t("linkRenovationTitle")}
                  </span>
                  <span className="text-xs text-muted">
                    {t("linkRenovationSub")}
                  </span>
                </Link>
                <Link
                  href={`/epbd?classe=${estimatedClass}`}
                  className="flex flex-col items-center gap-2 rounded-xl border-2 border-card-border bg-card px-4 py-5 text-center transition-all hover:border-energy hover:bg-energy/5"
                >
                  <svg
                    className="w-7 h-7 text-energy"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-foreground">
                    {t("linkEpbdTitle")}
                  </span>
                  <span className="text-xs text-muted">
                    {t("linkEpbdSub")}
                  </span>
                </Link>
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Pré-estimation CPE (sans audit) — Luxembourg`,
                `Surface déclarée: ${surface} m²`,
                `Score total: ${totalScore} points sur 80+`,
                `Classe énergétique estimée: ${estimatedClass}`,
                `Consommation estimée: min ${conso.min} / central ${conso.central} / max ${conso.max} kWh/m²/an`,
                `Détail réponses: ${Object.entries(answers).map(([k, v]) => `${k}=${v}pts`).join(" · ")}`,
              ].join("\n")}
              prompt="Interprète cette pré-estimation CPE luxembourgeoise (non officielle). Livre : (1) fiabilité de l'estimation vs un vrai CPE agréé myenergy — marge d'incertitude typique, (2) positionnement de la classe estimée vs moyenne nationale et commune de l'utilisateur, (3) leviers rapides d'amélioration d'une classe (poste le plus impactant : isolation / fenêtres / chauffage / ventilation), (4) quand faire un vrai CPE (obligation légale avant vente/location, déclenchement Klimabonus), (5) coût et délai pour obtenir un CPE officiel. Concret, pédagogique pour un propriétaire."
            />

            {/* Restart */}
            <div className="text-center">
              <button
                onClick={restart}
                className="inline-flex items-center gap-2 rounded-xl border border-card-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow-sm transition-all hover:bg-gray-50 hover:border-energy"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                {t("restart")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>

    <SEOContent
      ns="energy.estimateurCpe"
      sections={[
        { titleKey: "estimerTitle", contentKey: "estimerContent" },
        { titleKey: "criteresTitle", contentKey: "criteresContent" },
        { titleKey: "fiabiliteTitle", contentKey: "fiabiliteContent" },
        { titleKey: "apresEstimationTitle", contentKey: "apresEstimationContent" },
      ]}
      faq={[
        { questionKey: "faq1q", answerKey: "faq1a" },
        { questionKey: "faq2q", answerKey: "faq2a" },
        { questionKey: "faq3q", answerKey: "faq3a" },
        { questionKey: "faq4q", answerKey: "faq4a" },
      ]}
      relatedLinks={[
        { href: "/energy/impact", labelKey: "energyImpact" },
        { href: "/energy/renovation", labelKey: "energyRenovation" },
        { href: "/energy/lenoz", labelKey: "energyLenoz" },
      ]}
    />
    </>
  );
}
