"use client";

import { useState, useMemo } from "react";

/* ─── Data ─────────────────────────────────────────────────────────── */

interface Option {
  value: number;
  label: string;
}

interface Criterion {
  id: string;
  label: string;
  options: Option[];
}

interface Category {
  key: string;
  title: string;
  maxPts: number;
  criteria: Criterion[];
}

const CATEGORIES: Category[] = [
  {
    key: "A",
    title: "A. Environnement & Énergie",
    maxPts: 12,
    criteria: [
      {
        id: "a1",
        label: "Classe énergie du bâtiment",
        options: [
          { value: 0, label: "F–I" },
          { value: 1, label: "D–E" },
          { value: 2, label: "B–C" },
          { value: 3, label: "A" },
        ],
      },
      {
        id: "a2",
        label: "Production d’énergie renouvelable",
        options: [
          { value: 0, label: "Aucune" },
          { value: 1, label: "Solaire thermique" },
          { value: 2, label: "PV < 5 kWc" },
          { value: 3, label: "PV > 5 kWc" },
        ],
      },
      {
        id: "a3",
        label: "Système de récupération eau de pluie",
        options: [
          { value: 0, label: "Non" },
          { value: 3, label: "Oui" },
        ],
      },
      {
        id: "a4",
        label: "Matériaux écologiques (bois, chanvre…)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorité" },
          { value: 3, label: "100 %" },
        ],
      },
    ],
  },
  {
    key: "B",
    title: "B. Confort & Santé",
    maxPts: 12,
    criteria: [
      {
        id: "b1",
        label: "Ventilation contrôlée (VMC)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Simple flux" },
          { value: 2, label: "Double flux" },
          { value: 3, label: "DF + récupération" },
        ],
      },
      {
        id: "b2",
        label: "Éclairage naturel",
        options: [
          { value: 0, label: "Insuffisant" },
          { value: 1, label: "Moyen" },
          { value: 2, label: "Bon" },
          { value: 3, label: "Excellent" },
        ],
      },
      {
        id: "b3",
        label: "Confort acoustique",
        options: [
          { value: 0, label: "Faible" },
          { value: 1, label: "Moyen" },
          { value: 2, label: "Bon" },
          { value: 3, label: "Excellent" },
        ],
      },
      {
        id: "b4",
        label: "Accessibilité PMR",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Conforme" },
          { value: 3, label: "Labellisé" },
        ],
      },
    ],
  },
  {
    key: "C",
    title: "C. Implantation & Mobilité",
    maxPts: 9,
    criteria: [
      {
        id: "c1",
        label: "Proximité transports en commun",
        options: [
          { value: 0, label: "> 1 km" },
          { value: 1, label: "500 m – 1 km" },
          { value: 2, label: "200 – 500 m" },
          { value: 3, label: "< 200 m" },
        ],
      },
      {
        id: "c2",
        label: "Piste cyclable accessible",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "> 500 m" },
          { value: 2, label: "< 500 m" },
          { value: 3, label: "Directe" },
        ],
      },
      {
        id: "c3",
        label: "Services de proximité (école, commerce)",
        options: [
          { value: 0, label: "> 2 km" },
          { value: 1, label: "1 – 2 km" },
          { value: 2, label: "500 m – 1 km" },
          { value: 3, label: "< 500 m" },
        ],
      },
    ],
  },
  {
    key: "D",
    title: "D. Économie circulaire",
    maxPts: 9,
    criteria: [
      {
        id: "d1",
        label: "Matériaux recyclés / réemployés",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "< 10 %" },
          { value: 2, label: "10 – 30 %" },
          { value: 3, label: "> 30 %" },
        ],
      },
      {
        id: "d2",
        label: "Gestion des déchets de chantier",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorité triée" },
          { value: 3, label: "100 % valorisés" },
        ],
      },
      {
        id: "d3",
        label: "Durabilité des matériaux (garantie 30+ ans)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorité" },
          { value: 3, label: "Tous" },
        ],
      },
    ],
  },
  {
    key: "E",
    title: "E. Biodiversité & Terrain",
    maxPts: 9,
    criteria: [
      {
        id: "e1",
        label: "Surface perméable / végétalisée",
        options: [
          { value: 0, label: "< 10 %" },
          { value: 1, label: "10 – 30 %" },
          { value: 2, label: "30 – 60 %" },
          { value: 3, label: "> 60 %" },
        ],
      },
      {
        id: "e2",
        label: "Toiture ou façade végétalisée",
        options: [
          { value: 0, label: "Non" },
          { value: 3, label: "Oui" },
        ],
      },
      {
        id: "e3",
        label: "Biodiversité (nichoirs, haies, mare)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "1 élément" },
          { value: 2, label: "2 éléments" },
          { value: 3, label: "3+" },
        ],
      },
    ],
  },
  {
    key: "F",
    title: "F. Fonctionnalité & Adaptabilité",
    maxPts: 9,
    criteria: [
      {
        id: "f1",
        label: "Modularité des espaces",
        options: [
          { value: 0, label: "Figé" },
          { value: 1, label: "1 pièce modulable" },
          { value: 2, label: "Plusieurs" },
          { value: 3, label: "Totalement flexible" },
        ],
      },
      {
        id: "f2",
        label: "Pré-câblage smart home",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Basique" },
          { value: 2, label: "Avancé" },
          { value: 3, label: "Complet" },
        ],
      },
      {
        id: "f3",
        label: "Local technique accessible (PAC, batteries)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Difficile" },
          { value: 2, label: "Accessible" },
          { value: 3, label: "Dédié + extensible" },
        ],
      },
    ],
  },
];

const TOTAL_MAX = 60;

interface Rating {
  label: string;
  color: string;
  bg: string;
  border: string;
}

function getRating(score: number): Rating {
  if (score >= 51) return { label: "Platine", color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-300" };
  if (score >= 41) return { label: "Or", color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-400" };
  if (score >= 26) return { label: "Argent", color: "text-gray-500", bg: "bg-gray-100", border: "border-gray-400" };
  if (score >= 16) return { label: "Bronze", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-400" };
  return { label: "Non certifiable", color: "text-gray-400", bg: "bg-gray-50", border: "border-gray-300" };
}

const CAT_COLORS: Record<string, string> = {
  A: "bg-green-500",
  B: "bg-sky-500",
  C: "bg-violet-500",
  D: "bg-amber-500",
  E: "bg-emerald-500",
  F: "bg-rose-500",
};

const CAT_LIGHT_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 border-green-300",
  B: "bg-sky-100 text-sky-800 border-sky-300",
  C: "bg-violet-100 text-violet-800 border-violet-300",
  D: "bg-amber-100 text-amber-800 border-amber-300",
  E: "bg-emerald-100 text-emerald-800 border-emerald-300",
  F: "bg-rose-100 text-rose-800 border-rose-300",
};

/* ─── Component ────────────────────────────────────────────────────── */

export default function LenozPage() {
  const [scores, setScores] = useState<Record<string, number>>({});

  function setScore(id: string, value: number) {
    setScores((prev) => ({ ...prev, [id]: value }));
  }

  const catScores = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.key] = cat.criteria.reduce((sum, cr) => sum + (scores[cr.id] ?? 0), 0);
    }
    return map;
  }, [scores]);

  const totalScore = useMemo(
    () => Object.values(catScores).reduce((a, b) => a + b, 0),
    [catScores],
  );

  const rating = getRating(totalScore);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Scoring LENOZ simplifié
          </h1>
          <p className="mt-2 text-muted max-w-3xl">
            LENOZ est la certification de durabilité luxembourgeoise pour les bâtiments
            résidentiels. La version officielle compte 143 critères répartis en
            6 catégories. Ce simulateur propose une grille simplifiée d&apos;environ
            20 critères clés pour une pré-évaluation rapide.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: Criteria ── */}
          <div className="flex-1 space-y-6 min-w-0">
            {CATEGORIES.map((cat) => {
              const catScore = catScores[cat.key];
              const pct = cat.maxPts > 0 ? (catScore / cat.maxPts) * 100 : 0;
              return (
                <div
                  key={cat.key}
                  className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden"
                >
                  {/* Category header */}
                  <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-foreground">{cat.title}</h2>
                      <span
                        className={`text-sm font-bold px-3 py-1 rounded-full border ${CAT_LIGHT_COLORS[cat.key]}`}
                      >
                        {catScore} / {cat.maxPts}
                      </span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-3 h-2 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${CAT_COLORS[cat.key]}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  {/* Criteria */}
                  <div className="divide-y divide-card-border">
                    {cat.criteria.map((cr) => {
                      const current = scores[cr.id] ?? -1;
                      return (
                        <div key={cr.id} className="px-6 py-4">
                          <div className="text-sm font-medium text-foreground mb-3">
                            {cr.label}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {cr.options.map((opt) => {
                              const selected = current === opt.value;
                              return (
                                <button
                                  key={`${cr.id}-${opt.value}`}
                                  onClick={() => setScore(cr.id, opt.value)}
                                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-all border ${
                                    selected
                                      ? "bg-energy text-white border-energy shadow-sm"
                                      : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                                  }`}
                                >
                                  <span className="font-bold mr-1.5">{opt.value}</span>
                                  {opt.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── Right: Sticky score panel ── */}
          <div className="lg:w-80 shrink-0">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Total score card */}
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                  <h2 className="font-semibold text-foreground">Score global</h2>
                </div>
                <div className="p-6 text-center">
                  <div className="text-5xl font-bold text-foreground tabular-nums">
                    {totalScore}
                  </div>
                  <div className="text-muted text-sm mt-1">/ {TOTAL_MAX} points</div>

                  {/* Rating badge */}
                  <div
                    className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full border-2 text-lg font-bold ${rating.bg} ${rating.border} ${rating.color}`}
                  >
                    {rating.label === "Or" && (
                      <span className="text-xl" role="img" aria-label="Or">&#9733;</span>
                    )}
                    {rating.label === "Platine" && (
                      <span className="text-xl" role="img" aria-label="Platine">&#9830;</span>
                    )}
                    {rating.label}
                  </div>

                  {/* Rating scale */}
                  <div className="mt-4 text-xs text-muted space-y-1">
                    <div className="flex justify-between"><span className="text-gray-400">0 – 15</span><span>Non certifiable</span></div>
                    <div className="flex justify-between"><span className="text-amber-700">16 – 25</span><span>Bronze</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">26 – 40</span><span>Argent</span></div>
                    <div className="flex justify-between"><span className="text-yellow-600">41 – 50</span><span>Or</span></div>
                    <div className="flex justify-between"><span className="text-blue-600">51 – 60</span><span>Platine</span></div>
                  </div>
                </div>
              </div>

              {/* Per-category bar chart */}
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                  <h2 className="font-semibold text-foreground">Par catégorie</h2>
                </div>
                <div className="p-6 space-y-3">
                  {CATEGORIES.map((cat) => {
                    const score = catScores[cat.key];
                    const pct = cat.maxPts > 0 ? (score / cat.maxPts) * 100 : 0;
                    return (
                      <div key={cat.key}>
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="font-medium text-foreground truncate mr-2">
                            {cat.key}. {cat.title.split(". ")[1]}
                          </span>
                          <span className="text-muted tabular-nums shrink-0">
                            {score}/{cat.maxPts}
                          </span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${CAT_COLORS[cat.key]}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Disclaimer */}
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs text-amber-800 leading-relaxed">
                  <span className="font-semibold">Avertissement :</span> Estimation simplifiée
                  — la certification LENOZ officielle requiert un audit complet par un
                  organisme agréé (143 critères). Ce simulateur fournit une indication
                  préliminaire et ne se substitue pas à la démarche officielle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
