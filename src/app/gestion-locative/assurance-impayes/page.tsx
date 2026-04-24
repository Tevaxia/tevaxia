"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

interface GliQuote {
  insurer: string;
  ratePct: number;
  maxCoverageMonths: number;
  excessAmount: number;
  legalProtectionIncluded: boolean;
  vacancyProtection: boolean;
  maxGuaranteePerYear: number;
  notes: string;
}

const LU_GLI_QUOTES: GliQuote[] = [
  { insurer: "Baloise", ratePct: 3.2, maxCoverageMonths: 36, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 120000, notes: "" },
  { insurer: "Foyer Assurances", ratePct: 2.9, maxCoverageMonths: 30, excessAmount: 1000, legalProtectionIncluded: true, vacancyProtection: false, maxGuaranteePerYear: 100000, notes: "" },
  { insurer: "La Luxembourgeoise", ratePct: 3.5, maxCoverageMonths: 48, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 150000, notes: "" },
  { insurer: "AXA Luxembourg", ratePct: 3.0, maxCoverageMonths: 24, excessAmount: 500, legalProtectionIncluded: true, vacancyProtection: false, maxGuaranteePerYear: 80000, notes: "" },
  { insurer: "Imalis (partenaire FR-LU)", ratePct: 2.5, maxCoverageMonths: 30, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 90000, notes: "" },
];

export default function AssuranceImpayesPage() {
  const t = useTranslations("glAssuranceImpayes");
  const [monthlyRent, setMonthlyRent] = useState(1800);
  const [monthlyCharges, setMonthlyCharges] = useState(200);
  const [tenantRiskProfile, setTenantRiskProfile] = useState<"low" | "medium" | "high">("medium");
  const [lotCount, setLotCount] = useState(1);

  const riskMultiplier = tenantRiskProfile === "low" ? 0.9 : tenantRiskProfile === "high" ? 1.35 : 1.0;

  const quotesWithPremiums = useMemo(() => {
    return LU_GLI_QUOTES.map((q) => {
      const monthlyPremium = Math.round((monthlyRent + monthlyCharges) * (q.ratePct / 100) * riskMultiplier * lotCount);
      const annualPremium = monthlyPremium * 12;
      const coveragePerMonth = monthlyRent + monthlyCharges;
      const coverageTotal = Math.min(q.maxGuaranteePerYear, coveragePerMonth * q.maxCoverageMonths);
      return { ...q, monthlyPremium, annualPremium, coverageTotal };
    });
  }, [monthlyRent, monthlyCharges, riskMultiplier, lotCount]);

  const bestValue = [...quotesWithPremiums].sort((a, b) => b.coverageTotal / b.annualPremium - a.coverageTotal / a.annualPremium)[0];

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-navy mb-4">{t("paramsTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label={t("inputRent")} value={monthlyRent} onChange={(v) => setMonthlyRent(Number(v))} suffix="€" />
            <InputField label={t("inputCharges")} value={monthlyCharges} onChange={(v) => setMonthlyCharges(Number(v))} suffix="€" />
            <InputField label={t("inputLots")} value={lotCount} onChange={(v) => setLotCount(Number(v))} hint={t("inputLotsHint")} />
            <InputField
              label={t("inputProfile")}
              type="select"
              value={tenantRiskProfile}
              onChange={(v) => setTenantRiskProfile(v as "low" | "medium" | "high")}
              options={[
                { value: "low", label: t("profileLow") },
                { value: "medium", label: t("profileMedium") },
                { value: "high", label: t("profileHigh") },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-white shadow-lg mb-6">
          <div className="text-xs uppercase tracking-wider text-white/70">{t("bestValueLabel")}</div>
          <div className="mt-1 text-2xl font-bold">{bestValue.insurer}</div>
          <div className="mt-1 text-sm text-white/70">
            {t("bestValueDetail", { premium: formatEUR(bestValue.monthlyPremium), coverage: formatEUR(bestValue.coverageTotal) })}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">{t("thInsurer")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thRate")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thPremiumMonth")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thPremiumYear")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thCoverageMonths")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thCoverageTotal")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">{t("thExcess")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-center">{t("thLegal")}</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-center">{t("thVacancy")}</th>
              </tr>
            </thead>
            <tbody>
              {quotesWithPremiums.map((q, i) => (
                <tr key={i} className={`border-b border-card-border/50 ${q.insurer === bestValue.insurer ? "bg-emerald-50/40" : ""}`}>
                  <td className="px-4 py-2 font-medium text-navy">
                    {q.insurer}
                    {q.insurer === bestValue.insurer && <span className="ml-1 text-emerald-700 text-xs">★</span>}
                  </td>
                  <td className="px-4 py-2 text-right font-mono">{q.ratePct}%</td>
                  <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(q.monthlyPremium)}</td>
                  <td className="px-4 py-2 text-right font-mono">{formatEUR(q.annualPremium)}</td>
                  <td className="px-4 py-2 text-right font-mono">{q.maxCoverageMonths}</td>
                  <td className="px-4 py-2 text-right font-mono text-emerald-700 font-semibold">{formatEUR(q.coverageTotal)}</td>
                  <td className="px-4 py-2 text-right font-mono text-xs">{q.excessAmount > 0 ? formatEUR(q.excessAmount) : "0"}</td>
                  <td className="px-4 py-2 text-center">{q.legalProtectionIncluded ? "✓" : "✗"}</td>
                  <td className="px-4 py-2 text-center">{q.vacancyProtection ? "✓" : "✗"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <AiAnalysisCard
            context={[
              `Comparateur GLI Luxembourg ${lotCount} lot(s), loyer ${formatEUR(monthlyRent + monthlyCharges)}/mois charges incluses`,
              `Profil locataire: ${tenantRiskProfile} (multiplicateur ${riskMultiplier.toFixed(2)})`,
              `Offres comparées:`,
              ...quotesWithPremiums.map((q) => `  ${q.insurer}: ${q.ratePct}% → ${formatEUR(q.monthlyPremium)}/mois, couv ${q.maxCoverageMonths} mois = ${formatEUR(q.coverageTotal)}, franchise ${formatEUR(q.excessAmount)}, protec juridique ${q.legalProtectionIncluded ? "oui" : "non"}`),
              "",
              `Meilleure valeur (couverture/prime): ${bestValue.insurer} à ${formatEUR(bestValue.annualPremium)}/an pour ${formatEUR(bestValue.coverageTotal)} de couverture`,
            ].join("\n")}
            prompt="Conseille ce bailleur LU sur le choix d'une assurance loyers impayés. Livre : (1) recommandation d'assureur selon profil (multi-lots vs mono, profil locataire, montant loyer), (2) décryptage des clauses importantes (délai de carence typique 3 mois, déclaration sinistre, franchise, plafond mensuel vs annuel, exclusions), (3) alternatives : caution bancaire 3 mois classique, garantie Visale FR (disponible LU ? non), dépôt augmenté via loi 21.09.2006, (4) fiscalité : prime d'assurance déductible à l'art. 105 LIR, (5) avis final : vaut-il mieux assurer ou prendre un locataire solvable bien filtré (revenus 3× loyer + CDI + caution LU). Concret et chiffré."
          />
        </div>

        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          <strong>{t("legalStrong")}</strong> {t("legalBody")}
        </div>
      </div>
    </div>
  );
}
