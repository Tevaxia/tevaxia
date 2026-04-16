"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR, formatPct } from "@/lib/calculations";

// Paramètres assurance GLI au Luxembourg (indicatifs, basés sur Baloise,
// Foyer Assurances, La Luxembourgeoise — Q4 2025)
interface GliQuote {
  insurer: string;
  ratePct: number; // % du loyer + charges mensuel
  maxCoverageMonths: number;
  excessAmount: number; // franchise
  legalProtectionIncluded: boolean;
  vacancyProtection: boolean;
  maxGuaranteePerYear: number;
  notes: string;
}

const LU_GLI_QUOTES: GliQuote[] = [
  { insurer: "Baloise", ratePct: 3.2, maxCoverageMonths: 36, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 120000, notes: "Couverture large, incluant frais d'expulsion" },
  { insurer: "Foyer Assurances", ratePct: 2.9, maxCoverageMonths: 30, excessAmount: 1000, legalProtectionIncluded: true, vacancyProtection: false, maxGuaranteePerYear: 100000, notes: "Franchise 1000€ par sinistre" },
  { insurer: "La Luxembourgeoise", ratePct: 3.5, maxCoverageMonths: 48, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 150000, notes: "Couverture max 4 ans" },
  { insurer: "AXA Luxembourg", ratePct: 3.0, maxCoverageMonths: 24, excessAmount: 500, legalProtectionIncluded: true, vacancyProtection: false, maxGuaranteePerYear: 80000, notes: "Plafond 24 mois de loyer" },
  { insurer: "Imalis (partenaire FR-LU)", ratePct: 2.5, maxCoverageMonths: 30, excessAmount: 0, legalProtectionIncluded: true, vacancyProtection: true, maxGuaranteePerYear: 90000, notes: "Couverture étendue cross-border" },
];

export default function AssuranceImpayesPage() {
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
        <Link href="/gestion-locative" className="text-xs text-muted hover:text-navy">&larr; Gestion locative</Link>
        <div className="mt-2 mb-6">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Assurance loyers impayés (GLI)</h1>
          <p className="mt-2 text-muted">
            Comparateur des principales garanties loyers impayés au Luxembourg. Couverture du risque locatif en cas de
            défaillance du locataire, frais d&apos;expulsion, protection juridique. Primes indicatives Q4 2025.
          </p>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm mb-6">
          <h2 className="text-base font-semibold text-navy mb-4">Paramètres</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <InputField label="Loyer mensuel HC" value={monthlyRent} onChange={(v) => setMonthlyRent(Number(v))} suffix="€" />
            <InputField label="Charges mensuelles" value={monthlyCharges} onChange={(v) => setMonthlyCharges(Number(v))} suffix="€" />
            <InputField label="Nombre de lots couverts" value={lotCount} onChange={(v) => setLotCount(Number(v))} hint="Remise multi-lots souvent -10-20%" />
            <InputField
              label="Profil locataire"
              type="select"
              value={tenantRiskProfile}
              onChange={(v) => setTenantRiskProfile(v as "low" | "medium" | "high")}
              options={[
                { value: "low", label: "Bon (CDI, ancienneté, revenus > 3× loyer) — 0,9×" },
                { value: "medium", label: "Standard" },
                { value: "high", label: "Risqué (CDD, intérim, revenus < 2.5× loyer) — 1,35×" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl bg-gradient-to-br from-emerald-700 to-teal-700 p-6 text-white shadow-lg mb-6">
          <div className="text-xs uppercase tracking-wider text-white/70">Meilleure valeur (couverture/prime)</div>
          <div className="mt-1 text-2xl font-bold">{bestValue.insurer}</div>
          <div className="mt-1 text-sm text-white/70">
            {formatEUR(bestValue.monthlyPremium)}/mois · couverture max {formatEUR(bestValue.coverageTotal)}
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background text-left">
                <th className="px-4 py-2 text-xs font-semibold text-slate">Assureur</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Taux</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Prime/mois</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Prime/an</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Couv. max mois</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Couv. totale</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-right">Franchise</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-center">Protec. juridique</th>
                <th className="px-4 py-2 text-xs font-semibold text-slate text-center">Vacance</th>
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
          <strong>Important :</strong> les primes ci-dessus sont indicatives (Q4 2025). Contactez directement l&apos;assureur pour un devis personnalisé.
          Certaines offres imposent un filtrage préalable du locataire (revenus certifiés 3× loyer, CDI, caution, etc.). En LU, la caution
          locative légale (max 3 mois, art. 5 loi 21.09.2006) reste l&apos;option par défaut. La prime GLI est déductible en charges réelles (art. 105 LIR).
        </div>
      </div>
    </div>
  );
}
