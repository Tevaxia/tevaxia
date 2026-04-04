"use client";

import { useState } from "react";
import Link from "next/link";

const CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
type EnergyClass = (typeof CLASSES)[number];

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

/* ── EPBD milestones ── */
interface Milestone {
  year: number;
  label: string;
  detail: string;
  /** Classes affected (red highlight when user selects one of these) */
  affectedClasses: EnergyClass[];
}

const MILESTONES: Milestone[] = [
  {
    year: 2026,
    label: "Transposition directive EPBD",
    detail: "Échéance : 29 mai 2026. Chaque État membre transpose la directive en droit national.",
    affectedClasses: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  },
  {
    year: 2028,
    label: "Bâtiments publics neufs → zéro émission",
    detail: "Tous les nouveaux bâtiments publics doivent être à zéro émission à partir de 2028.",
    affectedClasses: [],
  },
  {
    year: 2030,
    label: "Réduction 16 % — worst performers résidentiels",
    detail:
      "Réduction de 16 % de la consommation d'énergie primaire des bâtiments résidentiels les moins performants. Les classes G-I sont directement visées.",
    affectedClasses: ["G", "H", "I"],
  },
  {
    year: 2033,
    label: "Réduction 26 % — worst performers résidentiels",
    detail:
      "Réduction de 26 % de la consommation d'énergie primaire. Les classes E-I devront avoir fait l'objet de rénovations significatives.",
    affectedClasses: ["E", "F", "G", "H", "I"],
  },
  {
    year: 2035,
    label: "Tous bâtiments neufs → zéro émission",
    detail: "Obligation d'émission nulle pour l'ensemble des bâtiments neufs (publics et privés).",
    affectedClasses: [],
  },
  {
    year: 2040,
    label: "Fin des chaudières fossiles",
    detail:
      "Interdiction totale des chaudières à combustibles fossiles (gaz, mazout). Les bâtiments encore dépendants seront fortement dévalorisés.",
    affectedClasses: ["D", "E", "F", "G", "H", "I"],
  },
  {
    year: 2050,
    label: "Parc immobilier zéro émission",
    detail: "Objectif : l'ensemble du parc immobilier européen atteint zéro émission nette.",
    affectedClasses: ["D", "E", "F", "G", "H", "I"],
  },
];

/* ── Stranding risk profiles ── */
interface RiskProfile {
  level: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  description: string;
  nonComplianceYear: string;
  actions: string[];
  valueImpact: string;
}

function getRiskProfile(classe: EnergyClass): RiskProfile {
  const idx = CLASSES.indexOf(classe);
  if (idx <= 2) {
    // A-C
    return {
      level: "Risque faible",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      description:
        "Votre bien est conforme aux objectifs 2050. Aucune obligation de rénovation prévue par la directive EPBD. Valeur préservée voire bonifiée (green premium).",
      nonComplianceYear: "Aucune échéance contraignante",
      actions: [
        "Maintenir les performances actuelles (entretien courant)",
        "Envisager des améliorations ponctuelles pour maximiser le green premium",
        "Surveiller l'évolution des standards zéro émission",
      ],
      valueImpact:
        "Stable à positif. Les classes A-C bénéficient d'une prime verte croissante à mesure que la réglementation se durcit (+2 à +8 % de valeur par rapport à la classe D).",
    };
  }
  if (idx === 3) {
    // D
    return {
      level: "Risque modéré",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-600",
      description:
        "Classe D : votre bien n'est pas considéré comme « worst performer », mais l'interdiction des chaudières fossiles (2040) et l'objectif zéro émission (2050) vous concernent. Rénovation recommandée avant 2035.",
      nonComplianceYear: "2040 (fin chaudières fossiles) — 2050 (zéro émission)",
      actions: [
        "Planifier une rénovation vers la classe B ou A avant 2035",
        "Remplacer la chaudière fossile par une pompe à chaleur",
        "Profiter du Klimabonus tant que les aides sont disponibles",
        "Anticiper la décote croissante des classes moyennes",
      ],
      valueImpact:
        "Décote progressive attendue. D'ici 2030, la classe D pourrait perdre 3 à 5 % de valeur relative. D'ici 2040, la décote pourrait atteindre 8 à 12 % si aucune rénovation n'est entreprise.",
    };
  }
  if (idx <= 5) {
    // E-F
    return {
      level: "Risque élevé",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
      description:
        "Classes E-F : votre bien est directement affecté par les objectifs de réduction 2030-2033. La directive EPBD cible les bâtiments les moins performants en priorité. Risque de non-conformité réglementaire et de décote significative.",
      nonComplianceYear: "2033 (réduction 26 % worst performers)",
      actions: [
        "Engager une rénovation énergétique profonde rapidement",
        "Viser au minimum la classe C, idéalement B ou A",
        "Solliciter un audit énergétique complet",
        "Maximiser les aides Klimabonus (taux majorés pour sauts importants)",
        "Anticiper l'interdiction des chaudières fossiles (2040)",
      ],
      valueImpact:
        "Décote significative. Les classes E-F subissent déjà un brown discount de -3 à -7 %. D'ici 2033, la décote pourrait atteindre -10 à -18 % en l'absence de rénovation. Risque de stranding (bien invendable ou inlouable).",
    };
  }
  // G-I
  return {
    level: "Risque critique",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-600",
    description:
      "Classes G-I : votre bien est classé « worst performer ». Il est impacté dès 2030 par les premières obligations de réduction (-16 %). La décote est déjà visible sur le marché et va s'accélérer considérablement.",
    nonComplianceYear: "2030 (réduction 16 % — première échéance)",
    actions: [
      "Rénovation énergétique profonde URGENTE — chaque année d'attente augmente la décote",
      "Viser la classe B ou A pour maximiser le retour sur investissement",
      "Faire réaliser un audit énergétique immédiatement",
      "Utiliser le Klimabonus : un saut de 4 classes ou plus = 62,5 % des travaux subventionnés",
      "Envisager le Klimaprêt à taux préférentiel (1,5 %)",
      "En cas de vente : anticiper une négociation très agressive des acheteurs",
    ],
    valueImpact:
      "Décote critique et croissante. Brown discount actuel de -12 à -25 %. D'ici 2030, la décote pourrait dépasser -30 %. Risque majeur de stranding : bien potentiellement invendable au prix du marché, ou uniquement à prix « terrain ».",
  };
}

export default function EPBDPage() {
  const [selectedClass, setSelectedClass] = useState<EnergyClass>("F");
  const risk = getRiskProfile(selectedClass);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Title + description ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            Directive EPBD — Chronologie et risque de stranding
          </h1>
          <p className="mt-2 text-muted">
            La directive européenne sur la performance énergétique des bâtiments
            (EPBD recast 2024) impose un calendrier de décarbonation du parc
            immobilier. Sélectionnez la classe énergétique de votre bien pour
            visualiser les échéances qui vous concernent et évaluer votre risque
            de stranding (perte de valeur liée à la non-conformité
            réglementaire).
          </p>
        </div>

        {/* ── Energy class selector ── */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            Classe énergétique actuelle de votre bien
          </label>
          <div className="flex gap-1.5">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setSelectedClass(c)}
                className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-all ${
                  selectedClass === c
                    ? `${CLASS_COLORS[c]} ring-2 ring-offset-2 ring-energy`
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* ── Stranding risk card ── */}
        <div
          className={`rounded-2xl border ${risk.borderColor} ${risk.bgColor} shadow-sm overflow-hidden mb-8`}
        >
          <div
            className={`px-6 py-4 border-b ${risk.borderColor} flex items-center justify-between`}
          >
            <div>
              <h2 className="font-semibold text-foreground">
                Risque de stranding — Classe {selectedClass}
              </h2>
              <p className={`text-sm font-bold mt-0.5 ${risk.color}`}>
                {risk.level}
              </p>
            </div>
            <span
              className={`inline-flex items-center justify-center w-12 h-12 rounded-xl text-lg font-bold ${CLASS_COLORS[selectedClass]}`}
            >
              {selectedClass}
            </span>
          </div>
          <div className="p-6 space-y-4">
            <p className="text-sm text-foreground leading-relaxed">
              {risk.description}
            </p>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                Échéance de non-conformité estimée
              </div>
              <div className={`text-sm font-semibold ${risk.color}`}>
                {risk.nonComplianceYear}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Actions recommandées
              </div>
              <ul className="space-y-1.5">
                {risk.actions.map((action, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${risk.textColor} bg-current`} />
                    {action}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                Impact estimé sur la valeur
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {risk.valueImpact}
              </p>
            </div>
          </div>
        </div>

        {/* ── EPBD Timeline ── */}
        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">
              Chronologie EPBD — Échéances clés
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Les jalons en rouge sont ceux qui concernent la classe{" "}
              {selectedClass}
            </p>
          </div>
          <div className="p-6">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-[23px] top-2 bottom-2 w-0.5 bg-gray-200" />

              <div className="space-y-6">
                {MILESTONES.map((m) => {
                  const isAffected = m.affectedClasses.includes(selectedClass);
                  return (
                    <div key={m.year} className="relative flex gap-4">
                      {/* Dot on the vertical line */}
                      <div className="relative z-10 shrink-0">
                        <div
                          className={`w-[47px] h-[47px] rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                            isAffected
                              ? "bg-red-600 border-red-600 text-white"
                              : "bg-white border-gray-300 text-gray-500"
                          }`}
                        >
                          {m.year}
                        </div>
                      </div>

                      {/* Card */}
                      <div
                        className={`flex-1 rounded-xl border p-4 transition-all ${
                          isAffected
                            ? "border-red-300 bg-red-50 shadow-sm"
                            : "border-card-border bg-gray-50"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h3
                            className={`text-sm font-semibold ${
                              isAffected ? "text-red-800" : "text-foreground"
                            }`}
                          >
                            {m.label}
                          </h3>
                          {isAffected && (
                            <span className="shrink-0 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                              Vous concerne
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            isAffected ? "text-red-700" : "text-muted"
                          }`}
                        >
                          {m.detail}
                        </p>
                        {isAffected && m.affectedClasses.length > 0 && m.affectedClasses.length < CLASSES.length && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-xs text-red-600">
                              Classes concernées :
                            </span>
                            {m.affectedClasses.map((ac) => (
                              <span
                                key={ac}
                                className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold ${
                                  ac === selectedClass
                                    ? CLASS_COLORS[ac]
                                    : "bg-red-100 text-red-700"
                                }`}
                              >
                                {ac}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Value impact over time ── */}
        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">
              Projection de la décote — Classe {selectedClass}
            </h2>
          </div>
          <div className="p-6">
            <ValueProjection selectedClass={selectedClass} />
          </div>
        </div>

        {/* ── Link to renovation simulator ── */}
        <div className="rounded-2xl border border-energy/30 bg-energy/5 p-6 text-center">
          <h3 className="font-semibold text-foreground text-lg">
            Planifiez votre rénovation
          </h3>
          <p className="mt-1 text-sm text-muted">
            Estimez le coût, les aides (Klimabonus, Klimaprêt) et le retour sur
            investissement d'une rénovation énergétique.
          </p>
          <Link
            href={`/energy/renovation?classe=${selectedClass}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-energy/90"
          >
            Simuler ma rénovation depuis la classe {selectedClass}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>

        {/* ── Sources ── */}
        <div className="mt-6 rounded-xl border border-card-border bg-gray-50 px-6 py-4">
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider mb-2">
            Sources
          </h3>
          <ul className="space-y-0.5 text-xs text-muted">
            <li>
              Directive (UE) 2024/1275 du 24 avril 2024 sur la performance
              énergétique des bâtiments (refonte)
            </li>
            <li>
              Journal officiel de l'Union européenne, L 2024/1275, 8 mai 2024
            </li>
            <li>
              Commission européenne — Fit for 55, Renovation Wave Strategy
            </li>
            <li>
              Ministère de l'Énergie et de l'Aménagement du territoire,
              Luxembourg
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Value projection sub-component ── */

interface ProjectionRow {
  year: number;
  label: string;
  decotePct: number;
}

function getProjectionData(classe: EnergyClass): ProjectionRow[] {
  const idx = CLASSES.indexOf(classe);
  if (idx <= 2) {
    // A-C: no brown discount, slight green premium
    const premium = idx === 0 ? 8 : idx === 1 ? 5 : 2;
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: premium },
      { year: 2030, label: "Objectif -16 %", decotePct: premium + 1 },
      { year: 2033, label: "Objectif -26 %", decotePct: premium + 2 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: premium + 3 },
      { year: 2050, label: "Parc zéro émission", decotePct: premium + 4 },
    ];
  }
  if (idx === 3) {
    // D
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: 0 },
      { year: 2030, label: "Objectif -16 %", decotePct: -3 },
      { year: 2033, label: "Objectif -26 %", decotePct: -5 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: -10 },
      { year: 2050, label: "Parc zéro émission", decotePct: -15 },
    ];
  }
  if (idx === 4) {
    // E
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: -3 },
      { year: 2030, label: "Objectif -16 %", decotePct: -7 },
      { year: 2033, label: "Objectif -26 %", decotePct: -12 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: -18 },
      { year: 2050, label: "Parc zéro émission", decotePct: -25 },
    ];
  }
  if (idx === 5) {
    // F
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: -7 },
      { year: 2030, label: "Objectif -16 %", decotePct: -12 },
      { year: 2033, label: "Objectif -26 %", decotePct: -18 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: -25 },
      { year: 2050, label: "Parc zéro émission", decotePct: -32 },
    ];
  }
  if (idx === 6) {
    // G
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: -12 },
      { year: 2030, label: "Objectif -16 %", decotePct: -20 },
      { year: 2033, label: "Objectif -26 %", decotePct: -28 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: -35 },
      { year: 2050, label: "Parc zéro émission", decotePct: -40 },
    ];
  }
  if (idx === 7) {
    // H
    return [
      { year: 2026, label: "Transposition EPBD", decotePct: -18 },
      { year: 2030, label: "Objectif -16 %", decotePct: -26 },
      { year: 2033, label: "Objectif -26 %", decotePct: -33 },
      { year: 2040, label: "Fin chaudières fossiles", decotePct: -40 },
      { year: 2050, label: "Parc zéro émission", decotePct: -45 },
    ];
  }
  // I
  return [
    { year: 2026, label: "Transposition EPBD", decotePct: -25 },
    { year: 2030, label: "Objectif -16 %", decotePct: -32 },
    { year: 2033, label: "Objectif -26 %", decotePct: -38 },
    { year: 2040, label: "Fin chaudières fossiles", decotePct: -45 },
    { year: 2050, label: "Parc zéro émission", decotePct: -50 },
  ];
}

function ValueProjection({ selectedClass }: { selectedClass: EnergyClass }) {
  const data = getProjectionData(selectedClass);
  const maxAbsDecote = Math.max(...data.map((d) => Math.abs(d.decotePct)));
  const isPositive = data.every((d) => d.decotePct >= 0);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted mb-4">
        {isPositive
          ? "Projection de la prime verte (green premium) si aucun changement de classe."
          : "Projection de la décote (brown discount) si aucune rénovation n'est entreprise."}
      </p>
      {data.map((row) => {
        const barWidth =
          maxAbsDecote > 0 ? (Math.abs(row.decotePct) / maxAbsDecote) * 100 : 0;
        const isGain = row.decotePct > 0;
        const isNeutral = row.decotePct === 0;
        return (
          <div key={row.year} className="flex items-center gap-3">
            <span className="text-xs font-mono font-semibold text-foreground w-10 shrink-0">
              {row.year}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs text-muted">{row.label}</span>
              </div>
              <div className="h-5 w-full bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isGain
                      ? "bg-green-500"
                      : isNeutral
                        ? "bg-gray-300"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${Math.max(barWidth, 2)}%` }}
                />
              </div>
            </div>
            <span
              className={`text-sm font-mono font-semibold w-14 text-right shrink-0 ${
                isGain
                  ? "text-green-600"
                  : isNeutral
                    ? "text-muted"
                    : "text-red-600"
              }`}
            >
              {row.decotePct > 0 ? "+" : ""}
              {row.decotePct} %
            </span>
          </div>
        );
      })}
      <p className="text-[10px] text-muted/70 mt-2">
        Projections indicatives basées sur les tendances observées et le
        calendrier EPBD. Ne constitue pas un conseil financier.
      </p>
    </div>
  );
}
