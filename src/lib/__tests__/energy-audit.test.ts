import { describe, it, expect } from "vitest";
import { calculerAudit, AUDIT_QUESTIONS } from "../energy-audit";

// Helper : génère toutes les réponses avec un score voulu
function allAnswersAt(scoreTarget: number): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of AUDIT_QUESTIONS) {
    // Pick the option with score closest to target
    const best = q.options.reduce((prev, curr) =>
      Math.abs(curr.score - scoreTarget) < Math.abs(prev.score - scoreTarget) ? curr : prev,
    );
    answers[q.id] = best.valueKey;
  }
  return answers;
}

describe("calculerAudit", () => {
  it("returns zero score when no answers", () => {
    const r = calculerAudit({});
    expect(r.scoreGlobal).toBe(0);
    expect(r.classeEstimee).toBe("G");
  });

  it("produces score 0-100", () => {
    const r = calculerAudit(allAnswersAt(5));
    expect(r.scoreGlobal).toBeGreaterThanOrEqual(0);
    expect(r.scoreGlobal).toBeLessThanOrEqual(100);
  });

  it("best answers → class A", () => {
    const r = calculerAudit(allAnswersAt(10));
    expect(r.scoreGlobal).toBeGreaterThan(80);
    expect(r.classeEstimee).toBe("A");
  });

  it("worst answers → low class E/F/G", () => {
    const r = calculerAudit(allAnswersAt(0));
    expect(r.scoreGlobal).toBeLessThan(30);
    expect(["E", "F", "G"]).toContain(r.classeEstimee);
  });

  it("produces scoreCategory for all 5 categories", () => {
    const r = calculerAudit(allAnswersAt(5));
    expect(Object.keys(r.scoreCategory)).toEqual(
      expect.arrayContaining(["enveloppe", "chauffage", "ventilation", "eau", "usage"]),
    );
  });

  it("recommends toiture when iso_none", () => {
    const answers = allAnswersAt(10);
    answers.toiture_isolation = "iso_none";
    const r = calculerAudit(answers);
    expect(r.recommendations.some((x) => x.titleKey === "recToiture")).toBe(true);
  });

  it("recommends PAC when fuel boiler or old", () => {
    const answers = allAnswersAt(10);
    answers.chauffage_type = "ch_fuel";
    const r = calculerAudit(answers);
    expect(r.recommendations.some((x) => x.titleKey === "recChauffage")).toBe(true);
  });

  it("recommends PV only if orientation is ok and no PV installed", () => {
    const answers = allAnswersAt(10);
    answers.pv_solaire = "pv_none";
    answers.orientation = "ori_sud";
    const r = calculerAudit(answers);
    expect(r.recommendations.some((x) => x.titleKey === "recPV")).toBe(true);
  });

  it("does NOT recommend PV when north-facing", () => {
    const answers = allAnswersAt(10);
    answers.pv_solaire = "pv_none";
    answers.orientation = "ori_nord";
    const r = calculerAudit(answers);
    expect(r.recommendations.some((x) => x.titleKey === "recPV")).toBe(false);
  });

  it("recommendations are sorted by priority (1 first)", () => {
    const answers = allAnswersAt(0); // triggers many recos
    const r = calculerAudit(answers);
    for (let i = 1; i < r.recommendations.length; i++) {
      expect(r.recommendations[i].priority).toBeGreaterThanOrEqual(r.recommendations[i - 1].priority);
    }
  });

  it("totaux cohérents : coût total = somme min + somme max", () => {
    const answers = allAnswersAt(0);
    const r = calculerAudit(answers);
    const sumMin = r.recommendations.reduce((s, x) => s + x.coutMin, 0);
    const sumMax = r.recommendations.reduce((s, x) => s + x.coutMax, 0);
    expect(r.coutTotal.min).toBe(sumMin);
    expect(r.coutTotal.max).toBe(sumMax);
  });

  it("Klimabonus ≤ coût (pas de subvention > 100%)", () => {
    const answers = allAnswersAt(0);
    const r = calculerAudit(answers);
    expect(r.klimabonusTotal.min).toBeLessThanOrEqual(r.coutTotal.min);
    expect(r.klimabonusTotal.max).toBeLessThanOrEqual(r.coutTotal.max);
  });

  it("gain énergétique cap à 85 %", () => {
    const answers = allAnswersAt(0);
    const r = calculerAudit(answers);
    expect(r.gainEnergetiqueTotal).toBeLessThanOrEqual(85);
  });

  it("good property → fewer/no recommendations", () => {
    const answers = allAnswersAt(10);
    const r = calculerAudit(answers);
    expect(r.recommendations.length).toBeLessThanOrEqual(1); // peut-être PV si orientation
  });

  it("AUDIT_QUESTIONS exposes 20 questions total", () => {
    expect(AUDIT_QUESTIONS.length).toBe(20);
  });

  it("each question has 2+ options", () => {
    for (const q of AUDIT_QUESTIONS) {
      expect(q.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});
