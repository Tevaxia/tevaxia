"use client";

import { useState } from "react";
import Link from "next/link";

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

const STEPS: Step[] = [
  {
    title: "Type de bien",
    key: "type",
    options: [
      { label: "Appartement", points: 5 },
      { label: "Maison mitoyenne", points: 3 },
      { label: "Maison individuelle", points: 0 },
    ],
  },
  {
    title: "Année de construction",
    key: "annee",
    options: [
      { label: "Avant 1945", points: 0 },
      { label: "1945–1970", points: 2 },
      { label: "1970–1990", points: 5 },
      { label: "1990–2005", points: 10 },
      { label: "2005–2015", points: 15 },
      { label: "Après 2015", points: 20 },
    ],
  },
  {
    title: "Type de chauffage",
    key: "chauffage",
    options: [
      { label: "Fioul / mazout", points: 0 },
      { label: "Électrique direct", points: 2 },
      { label: "Gaz naturel", points: 5 },
      { label: "Bois / pellets", points: 8 },
      { label: "Chauffage urbain", points: 10 },
      { label: "Pompe à chaleur", points: 15 },
    ],
  },
  {
    title: "Isolation façade",
    key: "isolation",
    options: [
      { label: "Aucune isolation", points: 0 },
      { label: "Isolation partielle (< 8 cm)", points: 5 },
      { label: "Bonne isolation (8–15 cm)", points: 10 },
      { label: "Excellente isolation (> 15 cm / ITE récente)", points: 15 },
    ],
  },
  {
    title: "Type de fenêtres",
    key: "fenetres",
    options: [
      { label: "Simple vitrage", points: 0 },
      { label: "Double vitrage (avant 2000)", points: 3 },
      { label: "Double vitrage récent", points: 8 },
      { label: "Triple vitrage", points: 12 },
    ],
  },
  {
    title: "Ventilation",
    key: "ventilation",
    options: [
      { label: "Ventilation naturelle (fenêtres)", points: 0 },
      { label: "VMC simple flux", points: 5 },
      { label: "VMC double flux", points: 10 },
    ],
  },
];

const TOTAL_STEPS = STEPS.length;

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

/* ── Component ── */

export default function EstimateurCpePage() {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const isFinished = step >= TOTAL_STEPS;

  const totalScore = Object.values(answers).reduce((a, b) => a + b, 0);
  const estimatedClass = scoreToClass(totalScore);

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
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Estimez votre classe énergie
          </h1>
          <p className="mt-2 text-muted">
            Répondez à 6 questions simples pour obtenir une estimation de la classe
            énergétique (CPE) de votre bien immobilier au Luxembourg.
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">
              {isFinished
                ? "Résultat"
                : `Étape ${step + 1} / ${TOTAL_STEPS}`}
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
              Sélectionnez la réponse qui correspond le mieux à votre bien.
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
                Question précédente
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
                Classe énergétique estimée de votre bien
              </p>
              <div className="flex justify-center mb-4">
                <div
                  className={`inline-flex items-center justify-center w-28 h-28 rounded-2xl text-6xl font-black shadow-lg ${CLASS_COLORS[estimatedClass]}`}
                >
                  {estimatedClass}
                </div>
              </div>
              <p className="text-lg font-semibold text-foreground mb-1">
                Classe {estimatedClass}
              </p>
              <p className="text-sm text-muted mb-2">
                Score : {totalScore} / 77 points
              </p>

              {/* Score detail */}
              <div className="mt-6 rounded-xl border border-card-border bg-gray-50 p-4 text-left">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Détail du score
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
                    Estimation indicative
                  </p>
                  <p className="text-sm text-muted mt-1">
                    Seul un passeport énergétique officiel (CPE) établi par un
                    expert agréé fait foi. Cette estimation se base sur des
                    paramètres génériques et ne remplace pas un audit
                    énergétique.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-foreground mb-1">
                Explorez les simulateurs avec votre classe estimée
              </h3>
              <p className="text-xs text-muted mb-4">
                Classe {estimatedClass} sélectionnée automatiquement dans
                chaque simulateur.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Link
                  href="/impact"
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
                    Impact sur la valeur
                  </span>
                  <span className="text-xs text-muted">
                    Green premium &amp; brown discount
                  </span>
                </Link>
                <Link
                  href="/renovation"
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
                    Simuler une rénovation
                  </span>
                  <span className="text-xs text-muted">
                    Coûts, aides &amp; rentabilité
                  </span>
                </Link>
                <Link
                  href="/epbd"
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
                    Timeline EPBD
                  </span>
                  <span className="text-xs text-muted">
                    Échéances réglementaires
                  </span>
                </Link>
              </div>
            </div>

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
                Recommencer l&apos;estimation
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
