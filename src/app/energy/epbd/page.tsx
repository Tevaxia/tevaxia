"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { generateEpbdPdfBlob, PdfButton } from "@/components/energy/EnergyPdf";

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
  labelKey: string;
  detailKey: string;
  /** Classes affected (red highlight when user selects one of these) */
  affectedClasses: EnergyClass[];
}

const MILESTONES: Milestone[] = [
  {
    year: 2026,
    labelKey: "milestone2026Label",
    detailKey: "milestone2026Detail",
    affectedClasses: ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
  },
  {
    year: 2028,
    labelKey: "milestone2028Label",
    detailKey: "milestone2028Detail",
    affectedClasses: [],
  },
  {
    year: 2030,
    labelKey: "milestone2030Label",
    detailKey: "milestone2030Detail",
    affectedClasses: ["G", "H", "I"],
  },
  {
    year: 2033,
    labelKey: "milestone2033Label",
    detailKey: "milestone2033Detail",
    affectedClasses: ["E", "F", "G", "H", "I"],
  },
  {
    year: 2035,
    labelKey: "milestone2035Label",
    detailKey: "milestone2035Detail",
    affectedClasses: [],
  },
  {
    year: 2040,
    labelKey: "milestone2040Label",
    detailKey: "milestone2040Detail",
    affectedClasses: ["D", "E", "F", "G", "H", "I"],
  },
  {
    year: 2050,
    labelKey: "milestone2050Label",
    detailKey: "milestone2050Detail",
    affectedClasses: ["D", "E", "F", "G", "H", "I"],
  },
];

/* ── Stranding risk profiles ── */
interface RiskProfile {
  levelKey: string;
  color: string;
  bgColor: string;
  borderColor: string;
  textColor: string;
  descriptionKey: string;
  nonComplianceYearKey: string;
  actionKeys: string[];
  valueImpactKey: string;
}

function getRiskProfile(classe: EnergyClass): RiskProfile {
  const idx = CLASSES.indexOf(classe);
  if (idx <= 2) {
    // A-C
    return {
      levelKey: "riskLow.level",
      color: "text-green-700",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-600",
      descriptionKey: "riskLow.description",
      nonComplianceYearKey: "riskLow.nonComplianceYear",
      actionKeys: [
        "riskLow.action1",
        "riskLow.action2",
        "riskLow.action3",
      ],
      valueImpactKey: "riskLow.valueImpact",
    };
  }
  if (idx === 3) {
    // D
    return {
      levelKey: "riskModerate.level",
      color: "text-yellow-700",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      textColor: "text-yellow-600",
      descriptionKey: "riskModerate.description",
      nonComplianceYearKey: "riskModerate.nonComplianceYear",
      actionKeys: [
        "riskModerate.action1",
        "riskModerate.action2",
        "riskModerate.action3",
        "riskModerate.action4",
      ],
      valueImpactKey: "riskModerate.valueImpact",
    };
  }
  if (idx <= 5) {
    // E-F
    return {
      levelKey: "riskHigh.level",
      color: "text-orange-700",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      textColor: "text-orange-600",
      descriptionKey: "riskHigh.description",
      nonComplianceYearKey: "riskHigh.nonComplianceYear",
      actionKeys: [
        "riskHigh.action1",
        "riskHigh.action2",
        "riskHigh.action3",
        "riskHigh.action4",
        "riskHigh.action5",
      ],
      valueImpactKey: "riskHigh.valueImpact",
    };
  }
  // G-I
  return {
    levelKey: "riskCritical.level",
    color: "text-red-700",
    bgColor: "bg-red-50",
    borderColor: "border-red-200",
    textColor: "text-red-600",
    descriptionKey: "riskCritical.description",
    nonComplianceYearKey: "riskCritical.nonComplianceYear",
    actionKeys: [
      "riskCritical.action1",
      "riskCritical.action2",
      "riskCritical.action3",
      "riskCritical.action4",
      "riskCritical.action5",
      "riskCritical.action6",
    ],
    valueImpactKey: "riskCritical.valueImpact",
  };
}

/* ── Projection labels ── */
const PROJECTION_LABEL_KEYS = {
  transposition: "projection.transposition",
  target16: "projection.target16",
  target26: "projection.target26",
  fossilEnd: "projection.fossilEnd",
  zeroEmission: "projection.zeroEmission",
} as const;

interface ProjectionRow {
  year: number;
  labelKey: string;
  decotePct: number;
}

function getProjectionData(classe: EnergyClass): ProjectionRow[] {
  const idx = CLASSES.indexOf(classe);
  if (idx <= 2) {
    // A-C: no brown discount, slight green premium
    const premium = idx === 0 ? 8 : idx === 1 ? 5 : 2;
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: premium },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: premium + 1 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: premium + 2 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: premium + 3 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: premium + 4 },
    ];
  }
  if (idx === 3) {
    // D
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: 0 },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -3 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -5 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -10 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -15 },
    ];
  }
  if (idx === 4) {
    // E
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: -3 },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -7 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -12 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -18 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -25 },
    ];
  }
  if (idx === 5) {
    // F
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: -7 },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -12 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -18 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -25 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -32 },
    ];
  }
  if (idx === 6) {
    // G
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: -12 },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -20 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -28 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -35 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -40 },
    ];
  }
  if (idx === 7) {
    // H
    return [
      { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: -18 },
      { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -26 },
      { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -33 },
      { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -40 },
      { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -45 },
    ];
  }
  // I
  return [
    { year: 2026, labelKey: PROJECTION_LABEL_KEYS.transposition, decotePct: -25 },
    { year: 2030, labelKey: PROJECTION_LABEL_KEYS.target16, decotePct: -32 },
    { year: 2033, labelKey: PROJECTION_LABEL_KEYS.target26, decotePct: -38 },
    { year: 2040, labelKey: PROJECTION_LABEL_KEYS.fossilEnd, decotePct: -45 },
    { year: 2050, labelKey: PROJECTION_LABEL_KEYS.zeroEmission, decotePct: -50 },
  ];
}

export default function EPBDPage() {
  const t = useTranslations("energy.epbd");
  const [selectedClass, setSelectedClass] = useState<EnergyClass>("F");
  const risk = getRiskProfile(selectedClass);

  return (
    <div className="py-8 sm:py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* ── Title + description ── */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("description")}
          </p>
        </div>

        {/* ── Energy class selector ── */}
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm mb-8">
          <label className="block text-sm font-medium text-foreground mb-1.5">
            {t("selectorLabel")}
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
                {t("riskTitle", { classe: selectedClass })}
              </h2>
              <p className={`text-sm font-bold mt-0.5 ${risk.color}`}>
                {t(risk.levelKey)}
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
              {t(risk.descriptionKey)}
            </p>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                {t("nonComplianceLabel")}
              </div>
              <div className={`text-sm font-semibold ${risk.color}`}>
                {t(risk.nonComplianceYearKey)}
              </div>
            </div>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                {t("actionsLabel")}
              </div>
              <ul className="space-y-1.5">
                {risk.actionKeys.map((actionKey, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-foreground"
                  >
                    <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${risk.textColor} bg-current`} />
                    {t(actionKey)}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <div className="text-xs text-muted uppercase tracking-wider mb-1">
                {t("valueImpactLabel")}
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {t(risk.valueImpactKey)}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <PdfButton generateBlob={() => generateEpbdPdfBlob({ classe: selectedClass, riskLevel: t(risk.levelKey), riskDescription: t(risk.descriptionKey), nonComplianceYear: t(risk.nonComplianceYearKey), actions: risk.actionKeys.map((k: string) => t(k)), valueImpact: t(risk.valueImpactKey) })} filename={`energy-epbd-classe-${selectedClass}-${new Date().toLocaleDateString("fr-LU")}.pdf`} label={t("downloadPdf") || "PDF"} />
            </div>
          </div>
        </div>

        {/* ── EPBD Timeline ── */}
        <div className="rounded-2xl border border-card-border bg-card shadow-sm overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-card-border bg-gradient-to-r from-energy/5 to-transparent">
            <h2 className="font-semibold text-foreground">
              {t("timelineTitle")}
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {t("timelineSubtitle", { classe: selectedClass })}
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
                            {t(m.labelKey)}
                          </h3>
                          {isAffected && (
                            <span className="shrink-0 text-xs bg-red-600 text-white rounded-full px-2 py-0.5">
                              {t("affectsYou")}
                            </span>
                          )}
                        </div>
                        <p
                          className={`mt-1 text-xs leading-relaxed ${
                            isAffected ? "text-red-700" : "text-muted"
                          }`}
                        >
                          {t(m.detailKey)}
                        </p>
                        {isAffected && m.affectedClasses.length > 0 && m.affectedClasses.length < CLASSES.length && (
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="text-xs text-red-600">
                              {t("affectedClasses")}
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
              {t("projectionTitle", { classe: selectedClass })}
            </h2>
          </div>
          <div className="p-6">
            <ValueProjection selectedClass={selectedClass} t={t} />
          </div>
        </div>

        {/* ── Link to renovation simulator ── */}
        <div className="rounded-2xl border border-energy/30 bg-energy/5 p-6 text-center">
          <h3 className="font-semibold text-foreground text-lg">
            {t("renovationCta")}
          </h3>
          <p className="mt-1 text-sm text-muted">
            {t("renovationCtaDescription")}
          </p>
          <Link
            href={`/energy/renovation?classe=${selectedClass}`}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-energy px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-energy/90"
          >
            {t("renovationCtaButton", { classe: selectedClass })}
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
            {t("sourcesTitle")}
          </h3>
          <ul className="space-y-0.5 text-xs text-muted">
            <li>{t("source1")}</li>
            <li>{t("source2")}</li>
            <li>{t("source3")}</li>
            <li>{t("source4")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ── Value projection sub-component ── */

function ValueProjection({
  selectedClass,
  t,
}: {
  selectedClass: EnergyClass;
  t: ReturnType<typeof useTranslations>;
}) {
  const data = getProjectionData(selectedClass);
  const maxAbsDecote = Math.max(...data.map((d) => Math.abs(d.decotePct)));
  const isPositive = data.every((d) => d.decotePct >= 0);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted mb-4">
        {isPositive
          ? t("projectionGreenPremium")
          : t("projectionBrownDiscount")}
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
                <span className="text-xs text-muted">{t(row.labelKey)}</span>
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
        {t("projectionDisclaimer")}
      </p>
    </div>
  );
}
