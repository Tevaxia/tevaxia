"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";
import { calculerRentabiliteSTR, calculerArbitrageSTR, OTA_COMMISSION, STR_DEFAULT_COSTS } from "@/lib/str-calc";

const TAX_BRACKETS = [
  { value: "0.11", label: "~11%" },
  { value: "0.22", label: "~22%" },
  { value: "0.30", label: "~30%" },
  { value: "0.39", label: "~39%" },
  { value: "0.4578", label: "Max LU (~45,78%)" },
];

export default function StrArbitrage() {
  // Bien
  const [commune, setCommune] = useState("Luxembourg");
  const [acquisitionPrice, setAcquisitionPrice] = useState(450000);

  // STR pur
  const [adr, setAdr] = useState(120);
  const [occupancyPct, setOccupancyPct] = useState(60);
  const [cleaningPerStay, setCleaningPerStay] = useState(STR_DEFAULT_COSTS.cleaningPerStay);
  const [fixedCostsAnnual, setFixedCostsAnnual] = useState(3500);

  // LT long terme
  const [ltMonthlyRent, setLtMonthlyRent] = useState(2400);
  const [ltDeductibleAnnual, setLtDeductibleAnnual] = useState(3500);

  // Mix (STR partiel + LT partiel)
  const [mixedStrDays, setMixedStrDays] = useState(85);
  const [mixedLtMonths, setMixedLtMonths] = useState(9);

  // Fiscal
  const [marginalTaxRate, setMarginalTaxRate] = useState(0.30);

  // Calcul STR pur
  const strResult = useMemo(() => calculerRentabiliteSTR({
    commune, surface: 60, capacity: 4,
    adr, occupancyPct,
    nightsPerYear: Math.round(365 * occupancyPct / 100),
    otaChannel: "airbnb",
    variable: { cleaningPerStay, linenPerStay: STR_DEFAULT_COSTS.linenPerStay, consumablesPerStay: STR_DEFAULT_COSTS.consumablesPerStay, avgStayLengthDays: STR_DEFAULT_COSTS.avgStayLengthDays },
    fixed: { pnoInsuranceAnnual: 0, internetTvAnnual: 0, utilitiesAnnual: 0, furnitureAmortAnnual: 0, subscriptionFees: fixedCostsAnnual },
    acquisitionPrice,
    userMarginalTaxRate: marginalTaxRate,
    vacancyDaysBetween: 1,
  }), [commune, adr, occupancyPct, cleaningPerStay, fixedCostsAnnual, acquisitionPrice, marginalTaxRate]);

  const arbitrage = useMemo(() => calculerArbitrageSTR({
    strNet: strResult.netAfterTax,
    ltMonthlyRent,
    ltMarginalTaxRate: marginalTaxRate,
    ltDeductibleChargesAnnual: ltDeductibleAnnual,
    mixedStrDays,
    mixedLtMonths,
  }), [strResult.netAfterTax, ltMonthlyRent, marginalTaxRate, ltDeductibleAnnual, mixedStrDays, mixedLtMonths]);

  const scenarios = [
    { key: "lt", label: "Long terme (règle 5%)", net: arbitrage.scenarioLT.netAnnual, color: "indigo" as const },
    { key: "str", label: "STR pur (Airbnb/Booking)", net: arbitrage.scenarioSTR.netAnnual, color: "rose" as const },
    { key: "mixed", label: "Mixte (STR + LT)", net: arbitrage.scenarioMixed.totalNet, color: "emerald" as const },
  ];

  const best = scenarios.reduce((a, b) => a.net > b.net ? a : b);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Arbitrage long terme vs court terme</h1>
          <p className="mt-2 text-muted">
            Comparez 3 scénarios chiffrés : location longue durée (règle 5%), STR pur (Airbnb/Booking), ou mixte (STR saisonnier + LT le reste).
            Calcul net après impôt selon votre profil fiscal Luxembourg.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Le bien</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Commune" type="text" value={commune} onChange={(v) => setCommune(String(v))} />
                <InputField label="Prix d'acquisition" value={acquisitionPrice} onChange={(v) => setAcquisitionPrice(Number(v))} suffix="€" />
                <InputField label="Taux marginal IR" type="select" value={String(marginalTaxRate)} onChange={(v) => setMarginalTaxRate(Number(v))} options={TAX_BRACKETS} />
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-rose-900">Scénario STR (Airbnb/Booking pur)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="ADR (€/nuit)" value={adr} onChange={(v) => setAdr(Number(v))} suffix="€" />
                <InputField label="Occupation annuelle" value={occupancyPct} onChange={(v) => setOccupancyPct(Number(v))} suffix="%" />
                <InputField label="Ménage / séjour" value={cleaningPerStay} onChange={(v) => setCleaningPerStay(Number(v))} suffix="€" />
                <InputField label="Charges fixes STR / an" value={fixedCostsAnnual} onChange={(v) => setFixedCostsAnnual(Number(v))} suffix="€" hint="PNO + internet + utilities + amort mobilier" />
              </div>
              <p className="mt-3 text-xs text-rose-800">
                Commission OTA 15% Airbnb pré-appliquée. Si &gt; 90 nuits/an, licence hébergement obligatoire.
              </p>
            </div>

            <div className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-indigo-900">Scénario long terme (règle 5%)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Loyer mensuel LT" value={ltMonthlyRent} onChange={(v) => setLtMonthlyRent(Number(v))} suffix="€" hint="Plafond légal LU = 5%/12 × capital investi réévalué" />
                <InputField label="Charges déductibles / an" value={ltDeductibleAnnual} onChange={(v) => setLtDeductibleAnnual(Number(v))} suffix="€" hint="Intérêts emprunt + charges copro + entretien + PNO" />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-emerald-900">Scénario mixte (STR partiel + LT partiel)</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Jours STR / an"
                  value={mixedStrDays}
                  onChange={(v) => setMixedStrDays(Number(v))}
                  suffix="jours"
                  max={90}
                  hint="Max 90 jours pour éviter licence"
                />
                <InputField
                  label="Mois LT / an"
                  value={mixedLtMonths}
                  onChange={(v) => setMixedLtMonths(Number(v))}
                  suffix="mois"
                  max={12}
                  hint="Typique : 3 mois été Airbnb + 9 mois LT"
                />
              </div>
              <p className="mt-3 text-xs text-emerald-800">
                Mode LU classique : bail saisonnier (été/chasseurs de congrès) + bail habitation le reste.
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">Scénario le plus rentable</div>
              <div className="mt-2 text-3xl font-bold">
                {scenarios.find((s) => s.key === arbitrage.recommendation)?.label}
              </div>
              <div className="mt-1 text-2xl font-mono">{formatEUR(best.net)}/an</div>
              <div className="mt-3 text-sm text-white/70">
                Écart best vs worst : <strong>{formatEUR(arbitrage.deltaBestVsWorst)}/an</strong>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-4">Comparaison des 3 scénarios (net après impôt)</h3>
              <div className="space-y-3">
                {scenarios.map((s) => {
                  const isBest = s.key === arbitrage.recommendation;
                  const maxNet = Math.max(...scenarios.map((x) => x.net));
                  const widthPct = maxNet > 0 ? (s.net / maxNet) * 100 : 0;
                  const barColor = s.color === "rose" ? "bg-rose-500"
                    : s.color === "indigo" ? "bg-indigo-500"
                    : "bg-emerald-500";
                  return (
                    <div key={s.key} className={`rounded-lg p-3 ${isBest ? "bg-navy/5 ring-2 ring-navy/20" : ""}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-sm font-medium ${isBest ? "text-navy font-bold" : "text-slate"}`}>
                          {s.label} {isBest && <span className="ml-1 text-xs">★</span>}
                        </span>
                        <span className="font-mono font-bold text-navy">{formatEUR(s.net)}</span>
                      </div>
                      <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.max(widthPct, 4)}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">Détail LT (règle 5%)</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">Loyer annuel brut</span><span className="font-mono">{formatEUR(arbitrage.scenarioLT.grossAnnual)}</span></div>
                <div className="flex justify-between"><span className="text-muted">IR estimé</span><span className="font-mono text-rose-700">- {formatEUR(arbitrage.scenarioLT.tax)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t border-card-border"><span>Net annuel</span><span className="font-mono text-indigo-700">{formatEUR(arbitrage.scenarioLT.netAnnual)}</span></div>
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-3">Détail mixte (STR + LT)</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted">STR ({mixedStrDays} jours)</span><span className="font-mono text-rose-700">{formatEUR(arbitrage.scenarioMixed.strNet)}</span></div>
                <div className="flex justify-between"><span className="text-muted">LT ({mixedLtMonths} mois)</span><span className="font-mono text-indigo-700">{formatEUR(arbitrage.scenarioMixed.ltNet)}</span></div>
                <div className="flex justify-between font-semibold pt-1 border-t border-card-border"><span>Total mixte</span><span className="font-mono text-emerald-700">{formatEUR(arbitrage.scenarioMixed.totalNet)}</span></div>
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Arbitrage LT vs STR vs Mixte au Luxembourg`,
                `Bien: ${commune}, ${formatEUR(acquisitionPrice)} acquisition`,
                `Taux marginal IR: ${(marginalTaxRate * 100).toFixed(0)}%`,
                "",
                `Scénario STR pur: ${formatEUR(arbitrage.scenarioSTR.netAnnual)}/an (ADR ${adr}€, occupation ${occupancyPct}%)`,
                `Scénario LT (règle 5%): ${formatEUR(arbitrage.scenarioLT.netAnnual)}/an (loyer ${formatEUR(ltMonthlyRent)}/mois, charges ${formatEUR(ltDeductibleAnnual)}/an)`,
                `Scénario mixte: ${formatEUR(arbitrage.scenarioMixed.totalNet)}/an (${mixedStrDays}j STR + ${mixedLtMonths} mois LT)`,
                "",
                `Recommandation mécanique: ${arbitrage.recommendation.toUpperCase()}`,
                `Écart best vs worst: ${formatEUR(arbitrage.deltaBestVsWorst)}/an`,
              ].join("\n")}
              prompt="Analyse cet arbitrage 3 scénarios LT/STR/Mixte au Luxembourg. Livre : (1) ta recommandation + justification (ne te contente pas du chiffre : prends en compte le risque réglementaire licence > 90j, les contraintes commune Luxembourg-Ville, la volatilité STR vs stabilité LT), (2) facteurs non chiffrés qui peuvent renverser la décision (stabilité locataire LT vs churn voyageurs STR, usure logement, temps passé gestion, flexibilité propriétaire qui veut utiliser le bien), (3) profils où chaque scénario gagne (LT pour passive income, STR pour maximiser revenu et flexibilité, mixte pour optimum LU), (4) risques spécifiques : STR interdit en copropriété fréquent, voisinage hostile, contrôle fiscal rétroactif, (5) recommandation finale pour ce profil fiscal avec action à court terme. Chiffré et concret."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
