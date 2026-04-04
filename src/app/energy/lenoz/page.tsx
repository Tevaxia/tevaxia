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
    title: "A. Environnement & \u00c9nergie",
    maxPts: 12,
    criteria: [
      {
        id: "a1",
        label: "Classe \u00e9nergie du b\u00e2timent",
        options: [
          { value: 0, label: "F\u2013I" },
          { value: 1, label: "D\u2013E" },
          { value: 2, label: "B\u2013C" },
          { value: 3, label: "A" },
        ],
      },
      {
        id: "a2",
        label: "Production d\u2019\u00e9nergie renouvelable",
        options: [
          { value: 0, label: "Aucune" },
          { value: 1, label: "Solaire thermique" },
          { value: 2, label: "PV < 5 kWc" },
          { value: 3, label: "PV > 5 kWc" },
        ],
      },
      {
        id: "a3",
        label: "Syst\u00e8me de r\u00e9cup\u00e9ration eau de pluie",
        options: [
          { value: 0, label: "Non" },
          { value: 3, label: "Oui" },
        ],
      },
      {
        id: "a4",
        label: "Mat\u00e9riaux \u00e9cologiques (bois, chanvre\u2026)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorit\u00e9" },
          { value: 3, label: "100 %" },
        ],
      },
    ],
  },
  {
    key: "B",
    title: "B. Confort & Sant\u00e9",
    maxPts: 12,
    criteria: [
      {
        id: "b1",
        label: "Ventilation contr\u00f4l\u00e9e (VMC)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Simple flux" },
          { value: 2, label: "Double flux" },
          { value: 3, label: "DF + r\u00e9cup\u00e9ration" },
        ],
      },
      {
        id: "b2",
        label: "\u00c9clairage naturel",
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
        label: "Accessibilit\u00e9 PMR",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Conforme" },
          { value: 3, label: "Labellis\u00e9" },
        ],
      },
    ],
  },
  {
    key: "C",
    title: "C. Implantation & Mobilit\u00e9",
    maxPts: 9,
    criteria: [
      {
        id: "c1",
        label: "Proximit\u00e9 transports en commun",
        options: [
          { value: 0, label: "> 1 km" },
          { value: 1, label: "500 m \u2013 1 km" },
          { value: 2, label: "200 \u2013 500 m" },
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
        label: "Services de proximit\u00e9 (\u00e9cole, commerce)",
        options: [
          { value: 0, label: "> 2 km" },
          { value: 1, label: "1 \u2013 2 km" },
          { value: 2, label: "500 m \u2013 1 km" },
          { value: 3, label: "< 500 m" },
        ],
      },
    ],
  },
  {
    key: "D",
    title: "D. \u00c9conomie circulaire",
    maxPts: 9,
    criteria: [
      {
        id: "d1",
        label: "Mat\u00e9riaux recycl\u00e9s / r\u00e9employ\u00e9s",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "< 10 %" },
          { value: 2, label: "10 \u2013 30 %" },
          { value: 3, label: "> 30 %" },
        ],
      },
      {
        id: "d2",
        label: "Gestion des d\u00e9chets de chantier",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorit\u00e9 tri\u00e9e" },
          { value: 3, label: "100 % valoris\u00e9s" },
        ],
      },
      {
        id: "d3",
        label: "Durabilit\u00e9 des mat\u00e9riaux (garantie 30+ ans)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Partiel" },
          { value: 2, label: "Majorit\u00e9" },
          { value: 3, label: "Tous" },
        ],
      },
    ],
  },
  {
    key: "E",
    title: "E. Biodiversit\u00e9 & Terrain",
    maxPts: 9,
    criteria: [
      {
        id: "e1",
        label: "Surface perm\u00e9able / v\u00e9g\u00e9talis\u00e9e",
        options: [
          { value: 0, label: "< 10 %" },
          { value: 1, label: "10 \u2013 30 %" },
          { value: 2, label: "30 \u2013 60 %" },
          { value: 3, label: "> 60 %" },
        ],
      },
      {
        id: "e2",
        label: "Toiture ou fa\u00e7ade v\u00e9g\u00e9talis\u00e9e",
        options: [
          { value: 0, label: "Non" },
          { value: 3, label: "Oui" },
        ],
      },
      {
        id: "e3",
        label: "Biodiversit\u00e9 (nichoirs, haies, mare)",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "1 \u00e9l\u00e9ment" },
          { value: 2, label: "2 \u00e9l\u00e9ments" },
          { value: 3, label: "3+" },
        ],
      },
    ],
  },
  {
    key: "F",
    title: "F. Fonctionnalit\u00e9 & Adaptabilit\u00e9",
    maxPts: 9,
    criteria: [
      {
        id: "f1",
        label: "Modularit\u00e9 des espaces",
        options: [
          { value: 0, label: "Fig\u00e9" },
          { value: 1, label: "1 pi\u00e8ce modulable" },
          { value: 2, label: "Plusieurs" },
          { value: 3, label: "Totalement flexible" },
        ],
      },
      {
        id: "f2",
        label: "Pr\u00e9-c\u00e2blage smart home",
        options: [
          { value: 0, label: "Non" },
          { value: 1, label: "Basique" },
          { value: 2, label: "Avanc\u00e9" },
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
          { value: 3, label: "D\u00e9di\u00e9 + extensible" },
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
            Scoring LENOZ simplifi\u00e9
          </h1>
          <p className="mt-2 text-muted max-w-3xl">
            LENOZ est la certification de durabilit\u00e9 luxembourgeoise pour les b\u00e2timents
            r\u00e9sidentiels. La version officielle compte 143 crit\u00e8res r\u00e9partis en
            6 cat\u00e9gories. Ce simulateur propose une grille simplifi\u00e9e d&apos;environ
            20 crit\u00e8res cl\u00e9s pour une pr\u00e9-\u00e9valuation rapide.
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
                    <div className="flex justify-between"><span className="text-gray-400">0 \u2013 15</span><span>Non certifiable</span></div>
                    <div className="flex justify-between"><span className="text-amber-700">16 \u2013 25</span><span>Bronze</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">26 \u2013 40</span><span>Argent</span></div>
                    <div className="flex justify-between"><span className="text-yellow-600">41 \u2013 50</span><span>Or</span></div>
                    <div className="flex justify-between"><span className="text-blue-600">51 \u2013 60</span><span>Platine</span></div>
                  </div>
                </div>
              </div>

              {/* Per-category bar chart */}
              <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
                  <h2 className="font-semibold text-foreground">Par cat\u00e9gorie</h2>
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
                  <span className="font-semibold">Avertissement :</span> Estimation simplifi\u00e9e
                  \u2014 la certification LENOZ officielle requiert un audit complet par un
                  organisme agr\u00e9\u00e9 (143 crit\u00e8res). Ce simulateur fournit une indication
                  pr\u00e9liminaire et ne se substitue pas \u00e0 la d\u00e9marche officielle.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
