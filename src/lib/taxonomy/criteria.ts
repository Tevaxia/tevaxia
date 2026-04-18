/**
 * EU Taxonomy — Activity 7.7 "Acquisition and ownership of buildings"
 *
 * Source : Règlement délégué (UE) 2021/2139 Climate Delegated Act,
 * Annexe I (Substantial Contribution Climate Mitigation) + Annexe II
 * (Substantial Contribution Climate Adaptation) + critères DNSH.
 *
 * Cible : bâtiments existants / transactions d'acquisition. Pour la
 * construction (7.1), rénovation (7.2) et installations techniques
 * (7.3-7.6), d'autres critères s'appliquent.
 */

export type TaxonomyActivity = "7.7" | "7.1" | "7.2";

export type BuildYear =
  | "after_2021"         // Post 31 déc 2020 (nZEB minus 10 %)
  | "before_2021_top15"  // Ancien, doit être top 15 % PED local
  | "before_2021_epca"   // Ancien, preuve EPC A/B suffit
  | "before_2021_other"; // Ne satisfait pas les critères actuels

export type EpcClass = "A+" | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I";

export interface SubstantialContributionInput {
  activity: TaxonomyActivity;
  buildYear: BuildYear;
  epcClass?: EpcClass;
  /** Primary Energy Demand kWh/m²/yr */
  pedKwhM2?: number;
  /** nZEB threshold LU ≈ 45 kWh/m²/an pour résidentiel (règlement grand-ducal 2017) */
  nzebThresholdKwhM2?: number;
  /** Si top-15 % local disponible, ce seuil */
  top15PctThresholdKwhM2?: number;
}

export interface DnshInput {
  /** Climate Adaptation : climate risk assessment done ? (RCP scénarios) */
  climateRiskAssessed: boolean;
  /** Adaptation : plan d'adaptation identifié ? */
  adaptationPlan: boolean;
  /** Water : fixtures WELL water-efficient (< seuils) ? */
  waterEfficient: boolean;
  /** Circular : 70 % des déchets C&D réutilisés/recyclés ? */
  circularCDWaste: boolean;
  /** Pollution : matériaux certifiés (PAS de substances SVHC > 0.1 %) ? */
  pollutionControlled: boolean;
  /** Biodiversity : pas de construction sur zones Natura 2000 / protégées ? */
  biodiversityProtected: boolean;
}

export interface MinimumSafeguardsInput {
  /** OECD Guidelines for Multinational Enterprises */
  oecdCompliance: boolean;
  /** UN Guiding Principles on Business and Human Rights */
  unGuidingPrinciples: boolean;
  /** ILO Declaration on Fundamental Principles and Rights at Work */
  ilo: boolean;
  /** International Bill of Human Rights */
  humanRights: boolean;
}

export interface TaxonomyScreeningInput {
  sc: SubstantialContributionInput;
  dnsh: DnshInput;
  minimumSafeguards: MinimumSafeguardsInput;
}

export interface TaxonomyScreeningResult {
  /** Substantial Contribution : 'pass' | 'fail' avec raison */
  substantialContribution: {
    passed: boolean;
    path: "nzeb_minus_10" | "top_15_pct" | "epc_a_b" | null;
    reason: string;
  };
  /** DNSH : passe si les 5 axes sont OK (adaptation counts as 1 bundle) */
  dnsh: {
    passed: boolean;
    axes: Array<{ axis: string; passed: boolean; reason?: string }>;
  };
  /** Minimum Safeguards : les 4 piliers */
  minimumSafeguards: {
    passed: boolean;
    pillars: Array<{ pillar: string; passed: boolean }>;
  };
  /** Aligné = SC + DNSH + Minimum Safeguards tous OK */
  aligned: boolean;
  /** Score pour UI 0-100 */
  score: number;
  /** Recommandations si pas aligné */
  recommendations: string[];
}

export const EPC_CLASS_ORDER: EpcClass[] = ["A+", "A", "B", "C", "D", "E", "F", "G", "H", "I"];

export function epcClassIsAorB(epc: EpcClass): boolean {
  return epc === "A+" || epc === "A" || epc === "B";
}

/**
 * Évalue Substantial Contribution Climate Mitigation pour Activity 7.7.
 */
export function evaluateSubstantialContribution(sc: SubstantialContributionInput): TaxonomyScreeningResult["substantialContribution"] {
  // Post-2020 (nZEB minus 10 %)
  if (sc.buildYear === "after_2021") {
    const threshold = (sc.nzebThresholdKwhM2 ?? 45) * 0.9; // nZEB LU résidentiel ≈ 45, minus 10 %
    if (sc.pedKwhM2 != null && sc.pedKwhM2 <= threshold) {
      return {
        passed: true,
        path: "nzeb_minus_10",
        reason: `PED ${Math.round(sc.pedKwhM2)} ≤ nZEB − 10 % (${Math.round(threshold)} kWh/m²/an)`,
      };
    }
    return {
      passed: false,
      path: null,
      reason: `PED ${sc.pedKwhM2 != null ? Math.round(sc.pedKwhM2) : "—"} > nZEB − 10 % (${Math.round(threshold)} kWh/m²/an) requis pour construction post-2020`,
    };
  }

  // Pre-2021 : top-15 % PED local (si fourni)
  if (sc.top15PctThresholdKwhM2 != null && sc.pedKwhM2 != null && sc.pedKwhM2 <= sc.top15PctThresholdKwhM2) {
    return {
      passed: true,
      path: "top_15_pct",
      reason: `PED ${Math.round(sc.pedKwhM2)} ≤ top 15 % local (${Math.round(sc.top15PctThresholdKwhM2)} kWh/m²/an)`,
    };
  }

  // Fallback : EPC A ou B
  if (sc.epcClass && epcClassIsAorB(sc.epcClass)) {
    return {
      passed: true,
      path: "epc_a_b",
      reason: `Classe énergétique ${sc.epcClass} (A/B acceptable pour bâtiments pre-2021)`,
    };
  }

  return {
    passed: false,
    path: null,
    reason: sc.epcClass
      ? `Classe ${sc.epcClass} insuffisante (A ou B requise) et PED au-dessus du top-15 % local`
      : "Aucune preuve fournie : ni classe A/B, ni PED sous le top-15 % local",
  };
}

export function evaluateDnsh(d: DnshInput): TaxonomyScreeningResult["dnsh"] {
  const axes = [
    { axis: "Climate Adaptation (assessment)", passed: d.climateRiskAssessed, reason: d.climateRiskAssessed ? undefined : "Climate risk assessment RCP 4.5/8.5 à réaliser" },
    { axis: "Climate Adaptation (plan)", passed: d.adaptationPlan, reason: d.adaptationPlan ? undefined : "Plan d'adaptation aux risques identifiés à formaliser" },
    { axis: "Water", passed: d.waterEfficient, reason: d.waterEfficient ? undefined : "Sanitaires / fixtures à certifier conformes seuils EU water-efficient" },
    { axis: "Circular (C&D waste)", passed: d.circularCDWaste, reason: d.circularCDWaste ? undefined : "Au moins 70 % de déchets de construction/démolition à recycler ou réutiliser" },
    { axis: "Pollution Prevention", passed: d.pollutionControlled, reason: d.pollutionControlled ? undefined : "Exclure substances SVHC > 0,1 % (REACH annexe XVII)" },
    { axis: "Biodiversity", passed: d.biodiversityProtected, reason: d.biodiversityProtected ? undefined : "Confirmer absence d'impact sur Natura 2000 ou terres arables de catégorie I-III FAO" },
  ];
  return { passed: axes.every((a) => a.passed), axes };
}

export function evaluateMinimumSafeguards(m: MinimumSafeguardsInput): TaxonomyScreeningResult["minimumSafeguards"] {
  const pillars = [
    { pillar: "OECD Guidelines for MNEs", passed: m.oecdCompliance },
    { pillar: "UN Guiding Principles Business & HR", passed: m.unGuidingPrinciples },
    { pillar: "ILO Declaration Fundamental Principles", passed: m.ilo },
    { pillar: "International Bill of Human Rights", passed: m.humanRights },
  ];
  return { passed: pillars.every((p) => p.passed), pillars };
}

export function runScreening(input: TaxonomyScreeningInput): TaxonomyScreeningResult {
  const sc = evaluateSubstantialContribution(input.sc);
  const dnsh = evaluateDnsh(input.dnsh);
  const ms = evaluateMinimumSafeguards(input.minimumSafeguards);
  const aligned = sc.passed && dnsh.passed && ms.passed;

  // Score : 40 % SC + 40 % DNSH + 20 % MS
  const scScore = sc.passed ? 40 : 0;
  const dnshScore = (dnsh.axes.filter((a) => a.passed).length / dnsh.axes.length) * 40;
  const msScore = (ms.pillars.filter((p) => p.passed).length / ms.pillars.length) * 20;
  const score = Math.round(scScore + dnshScore + msScore);

  const recommendations: string[] = [];
  if (!sc.passed) recommendations.push(sc.reason);
  dnsh.axes.forEach((a) => { if (!a.passed && a.reason) recommendations.push(a.reason); });
  if (!ms.passed) {
    const failing = ms.pillars.filter((p) => !p.passed).map((p) => p.pillar);
    recommendations.push(`Minimum Safeguards : déclaration manquante sur ${failing.join(", ")}`);
  }

  return { substantialContribution: sc, dnsh, minimumSafeguards: ms, aligned, score, recommendations };
}

/**
 * Seuils top-15 % PED locaux LU (indicatifs — à affiner selon Observatoire
 * de l'Habitat / LISER par typologie).
 * Source : hypothèse basée sur distribution EPC LU 2023 (Klima-Agence).
 */
export const LU_TOP15_THRESHOLDS: Record<string, number> = {
  residential_mfh: 75,   // kWh/m²/an PED — top 15 % résidentiel collectif
  residential_sfh: 95,   // top 15 % individuel (moins bien isolé en moyenne)
  office: 85,
  retail: 95,
  hotel: 145,
};

/**
 * nZEB thresholds LU par typologie (règlement grand-ducal 23/07/2016 + 2017 modifié).
 */
export const LU_NZEB_THRESHOLDS: Record<string, number> = {
  residential_mfh: 45,
  residential_sfh: 45,
  office: 80,
  retail: 90,
  hotel: 120,
};
