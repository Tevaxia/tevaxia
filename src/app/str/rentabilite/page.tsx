"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR, formatPct } from "@/lib/calculations";
import { calculerRentabiliteSTR, OTA_COMMISSION, STR_DEFAULT_COSTS, STR_MAX_MARGINAL_TAX_RATE } from "@/lib/str-calc";
import SaveButton from "@/components/SaveButton";
import { sauvegarderEvaluation } from "@/lib/storage";

const OTA_OPTIONS = [
  { value: "airbnb", label: `Airbnb (${(OTA_COMMISSION.airbnb * 100).toFixed(0)}% commission)` },
  { value: "booking", label: `Booking.com (${(OTA_COMMISSION.booking * 100).toFixed(0)}%)` },
  { value: "vrbo", label: `Vrbo (${(OTA_COMMISSION.vrbo * 100).toFixed(0)}%)` },
  { value: "direct", label: "Réservation directe (0%)" },
];

const TAX_BRACKETS = [
  { value: "0.11", label: "Taux faible (~11%)" },
  { value: "0.22", label: "Intermédiaire (~22%)" },
  { value: "0.30", label: "Moyen (~30%)" },
  { value: "0.39", label: "Élevé (~39%)" },
  { value: "0.4578", label: "Marginal max LU (~45,78%)" },
];

export default function RentabiliteStr() {
  const [commune, setCommune] = useState("Luxembourg");
  const [surface, setSurface] = useState(60);
  const [capacity, setCapacity] = useState(4);
  const [adr, setAdr] = useState(120);
  const [occupancyPct, setOccupancyPct] = useState(60);
  const [otaChannel, setOtaChannel] = useState<"airbnb" | "booking" | "vrbo" | "direct">("airbnb");

  // Coûts
  const [cleaningPerStay, setCleaningPerStay] = useState(STR_DEFAULT_COSTS.cleaningPerStay);
  const [avgStayLengthDays, setAvgStayLengthDays] = useState(STR_DEFAULT_COSTS.avgStayLengthDays);
  const [vacancyDaysBetween, setVacancyDaysBetween] = useState(1);
  const [pnoAnnual, setPnoAnnual] = useState(450);
  const [internetTv, setInternetTv] = useState(480);
  const [utilities, setUtilities] = useState(1800);
  const [furnitureAmort, setFurnitureAmort] = useState(800);
  const [subscriptions, setSubscriptions] = useState(0);

  // Fiscal
  const [marginalTaxRate, setMarginalTaxRate] = useState(0.30);
  const [acquisitionPrice, setAcquisitionPrice] = useState(450000);

  const nightsPerYear = useMemo(() => Math.round(365 * (occupancyPct / 100)), [occupancyPct]);

  const result = useMemo(() => calculerRentabiliteSTR({
    commune,
    surface,
    capacity,
    adr,
    occupancyPct,
    nightsPerYear,
    otaChannel,
    variable: {
      cleaningPerStay,
      linenPerStay: STR_DEFAULT_COSTS.linenPerStay,
      consumablesPerStay: STR_DEFAULT_COSTS.consumablesPerStay,
      avgStayLengthDays,
    },
    fixed: {
      pnoInsuranceAnnual: pnoAnnual,
      internetTvAnnual: internetTv,
      utilitiesAnnual: utilities,
      furnitureAmortAnnual: furnitureAmort,
      subscriptionFees: subscriptions,
    },
    acquisitionPrice: acquisitionPrice > 0 ? acquisitionPrice : undefined,
    userMarginalTaxRate: marginalTaxRate,
    vacancyDaysBetween,
  }), [commune, surface, capacity, adr, occupancyPct, nightsPerYear, otaChannel, cleaningPerStay, avgStayLengthDays, pnoAnnual, internetTv, utilities, furnitureAmort, subscriptions, acquisitionPrice, marginalTaxRate, vacancyDaysBetween]);

  // Comparaison long terme (règle 5% indicative, loyer annuel plafond)
  const ltAnnualGross = acquisitionPrice > 0 ? Math.round(acquisitionPrice * 0.05) : 0;
  const ltNetEstimate = Math.max(0, ltAnnualGross - 2000 - Math.round(ltAnnualGross * marginalTaxRate)); // approx charges 2k + IR
  const strVsLtDelta = result.netAfterTax - ltNetEstimate;

  return (
    <>
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Rentabilité STR (Airbnb / Booking / Vrbo)</h1>
          <p className="mt-2 text-muted">
            Calculez le revenu net annuel de votre bien loué en courte durée au Luxembourg, toutes charges et impôts inclus.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Inputs */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Le bien</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Commune" type="text" value={commune} onChange={(v) => setCommune(String(v))} />
                <InputField label="Surface" value={surface} onChange={(v) => setSurface(Number(v))} suffix="m²" />
                <InputField label="Capacité voyageurs" value={capacity} onChange={(v) => setCapacity(Number(v))} />
                <InputField label="Prix d'acquisition" value={acquisitionPrice} onChange={(v) => setAcquisitionPrice(Number(v))} suffix="€" hint="Pour calculer yield brut/net" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Performance commerciale</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="ADR (prix moyen/nuit)" value={adr} onChange={(v) => setAdr(Number(v))} suffix="€" hint="Référence Luxembourg-Ville : 90-180 €/nuit selon quartier" />
                <InputField label="Taux d'occupation" value={occupancyPct} onChange={(v) => setOccupancyPct(Number(v))} suffix="%" hint={`= ${nightsPerYear} nuits/an`} min={0} max={95} />
                <InputField label="Canal principal" type="select" value={otaChannel} onChange={(v) => setOtaChannel(v as "airbnb" | "booking" | "vrbo" | "direct")} options={OTA_OPTIONS} />
                <InputField label="Durée moyenne séjour" value={avgStayLengthDays} onChange={(v) => setAvgStayLengthDays(Number(v))} suffix="nuits" hint="LU moyen ~3 nuits" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Charges opérationnelles</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField label="Ménage / séjour" value={cleaningPerStay} onChange={(v) => setCleaningPerStay(Number(v))} suffix="€" hint="LU: 30-70 €" />
                <InputField label="Vacance entre séjours" value={vacancyDaysBetween} onChange={(v) => setVacancyDaysBetween(Number(v))} suffix="jours" />
                <InputField label="Assurance PNO annuelle" value={pnoAnnual} onChange={(v) => setPnoAnnual(Number(v))} suffix="€" hint="Majorée pour CT (+50-100% vs LT)" />
                <InputField label="Internet + TV / an" value={internetTv} onChange={(v) => setInternetTv(Number(v))} suffix="€" />
                <InputField label="Électricité + eau / an" value={utilities} onChange={(v) => setUtilities(Number(v))} suffix="€" hint="Payé par l'hôte en STR" />
                <InputField label="Amortissement mobilier" value={furnitureAmort} onChange={(v) => setFurnitureAmort(Number(v))} suffix="€/an" />
                <InputField label="Abonnements (Guesty, PriceLabs...)" value={subscriptions} onChange={(v) => setSubscriptions(Number(v))} suffix="€/an" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Fiscalité</h2>
              <InputField
                label="Taux marginal d'IR"
                type="select"
                value={String(marginalTaxRate)}
                onChange={(v) => setMarginalTaxRate(Number(v))}
                options={TAX_BRACKETS}
                hint="Max LU : 45,78 % (42 % × contribution emploi 1,09)"
              />
            </div>
          </div>

          {/* Résultats */}
          <div className="space-y-6">
            <div className={`rounded-2xl p-8 text-white text-center shadow-lg ${result.netAfterTax > 0 ? "bg-gradient-to-br from-rose-700 to-orange-600" : "bg-gradient-to-br from-slate-700 to-slate-600"}`}>
              <div className="text-sm text-white/70">Revenu net annuel après impôt</div>
              <div className="mt-2 text-5xl font-bold">{formatEUR(result.netAfterTax)}</div>
              <div className="mt-2 text-sm text-white/70">
                soit {formatEUR(Math.round(result.netAfterTax / 12))}/mois après tout (charges, OTA, IR)
              </div>
              {result.netYieldPct !== undefined && (
                <div className="mt-3 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Yield net : {result.netYieldPct.toFixed(2)}%
                </div>
              )}
            </div>

            <ResultPanel
              title="Décomposition"
              lines={[
                { label: "Revenu brut", value: formatEUR(result.grossRevenue), highlight: true },
                { label: `Commission OTA (${otaChannel})`, value: `- ${formatEUR(result.otaCommission)}`, sub: true },
                { label: "Revenu après OTA", value: formatEUR(result.revenueAfterOta) },
                { label: `Ménage (${result.numberOfStays} séjours)`, value: `- ${formatEUR(result.cleaningTotal)}`, sub: true },
                { label: "Linge", value: `- ${formatEUR(result.linenTotal)}`, sub: true },
                { label: "Consommables", value: `- ${formatEUR(result.consumablesTotal)}`, sub: true },
                { label: "Charges fixes annuelles", value: `- ${formatEUR(result.fixedTotal)}`, sub: true },
                { label: "Total charges exploitation", value: `- ${formatEUR(result.operatingCharges)}` },
                { label: "Net avant impôt", value: formatEUR(result.netBeforeTax), highlight: true },
                { label: `IR estimé (${(marginalTaxRate * 100).toFixed(0)}%)`, value: `- ${formatEUR(result.estimatedTax)}`, sub: true },
                { label: "Net après impôt", value: formatEUR(result.netAfterTax), highlight: true, large: true },
              ]}
            />

            <ResultPanel
              title="Métriques opérationnelles"
              lines={[
                { label: "Nombre de séjours/an", value: String(result.numberOfStays) },
                { label: "Nuits louées/an", value: `${nightsPerYear} / 365` },
                { label: "RevPAR (revenu/jour dispo)", value: `${result.revPAR.toFixed(0)} €` },
                { label: "ADR effectif (après OTA)", value: `${result.adrEffective.toFixed(0)} €` },
                { label: "Ratio charges/CA", value: formatPct(result.costRatioPct / 100), warning: result.costRatioPct > 50 },
                { label: "Yield brut", value: result.grossYieldPct !== undefined ? `${result.grossYieldPct.toFixed(2)}%` : "—" },
                { label: "Yield net", value: result.netYieldPct !== undefined ? `${result.netYieldPct.toFixed(2)}%` : "—" },
              ]}
            />

            {acquisitionPrice > 0 && (
              <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50 p-5 shadow-sm">
                <h3 className="text-sm font-semibold text-indigo-900">Vs location longue durée (règle 5% indicative)</h3>
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-lg bg-white p-3 border border-indigo-100">
                    <div className="text-xs text-muted">STR net/an</div>
                    <div className="text-lg font-bold text-rose-700">{formatEUR(result.netAfterTax)}</div>
                  </div>
                  <div className="rounded-lg bg-white p-3 border border-indigo-100">
                    <div className="text-xs text-muted">LT net/an (règle 5%)</div>
                    <div className="text-lg font-bold text-indigo-700">{formatEUR(ltNetEstimate)}</div>
                  </div>
                </div>
                <div className="mt-3 text-center text-sm">
                  Écart STR vs LT :{" "}
                  <strong className={strVsLtDelta > 0 ? "text-emerald-700" : "text-rose-700"}>
                    {strVsLtDelta > 0 ? "+" : ""}{formatEUR(strVsLtDelta)}/an
                  </strong>
                  {" "}{strVsLtDelta > 0 ? "en faveur du STR" : "en faveur du LT"}
                </div>
                <p className="mt-2 text-xs text-indigo-800">
                  <strong>Attention</strong> : au-delà de 90 jours de STR/an, licence d&apos;hébergement obligatoire au LU. Voir{" "}
                  <Link href="/str/compliance" className="underline">l&apos;outil conformité</Link>.
                </p>
              </div>
            )}

            <AiAnalysisCard
              context={[
                `Simulation rentabilité Airbnb/Booking au Luxembourg`,
                `Bien: ${surface} m² à ${commune}, capacité ${capacity} voyageurs`,
                `Prix acquisition: ${acquisitionPrice > 0 ? formatEUR(acquisitionPrice) : "non renseigné"}`,
                `ADR cible: ${adr} €/nuit, occupation ${occupancyPct}% (${nightsPerYear} nuits/an)`,
                `Canal: ${otaChannel} (commission ${((OTA_COMMISSION[otaChannel] || 0) * 100).toFixed(0)}%)`,
                `Durée séjour moyenne: ${avgStayLengthDays} nuits, vacance ${vacancyDaysBetween} jours entre séjours`,
                `Charges fixes annuelles: ${formatEUR(result.fixedTotal)} (PNO ${formatEUR(pnoAnnual)}, internet ${formatEUR(internetTv)}, utilities ${formatEUR(utilities)}, amortissement ${formatEUR(furnitureAmort)})`,
                `Taux marginal IR: ${(marginalTaxRate * 100).toFixed(0)}%`,
                "",
                `Revenu brut: ${formatEUR(result.grossRevenue)}`,
                `Commission OTA: ${formatEUR(result.otaCommission)}`,
                `Charges exploitation (variables + fixes): ${formatEUR(result.operatingCharges)}`,
                `Net avant impôt: ${formatEUR(result.netBeforeTax)}`,
                `IR estimé: ${formatEUR(result.estimatedTax)}`,
                `Net après impôt: ${formatEUR(result.netAfterTax)} (${formatEUR(Math.round(result.netAfterTax / 12))}/mois)`,
                `Yield net: ${result.netYieldPct !== undefined ? `${result.netYieldPct.toFixed(2)}%` : "—"}`,
                "",
                `Comparaison LT règle 5%: ${formatEUR(ltNetEstimate)} net estimé → STR ${strVsLtDelta > 0 ? "+" : ""}${formatEUR(strVsLtDelta)}/an`,
              ].join("\n")}
              prompt="Analyse cette simulation STR au Luxembourg pour un hôte potentiel. Livre : (1) réalisme des hypothèses (ADR vs marché Luxembourg-Ville/communes, occupation atteignable en pratique, coûts masqués fréquemment oubliés comme turn-over voyageurs difficiles, dégâts, électricité été/hiver, Airbnb Plus/Premium requirements), (2) risque réglementaire (seuil 90 jours/an, licence, règlement communal Luxembourg-Ville depuis 2024 très restrictif), (3) arbitrage LT vs CT (fenêtre 90j permet STR pur, sinon licence obligatoire + IR sur tout), (4) optimisations : mixte LT 9 mois + STR 3 mois d'été, passage en société SPF/SCI (impact fiscal), déclaration régime meublé touristique, (5) seuil de rentabilité : combien de nuits minimum pour être mieux que LT net après tout. Chiffré, réaliste, spécifique LU."
            />

            <div className="flex justify-end">
              <SaveButton
                onClick={() => sauvegarderEvaluation({
                  nom: `STR — ${commune} ${surface}m² — ${formatEUR(result.netAfterTax)}/an`,
                  type: "str-rentabilite",
                  commune,
                  valeurPrincipale: result.netAfterTax,
                  data: { commune, surface, capacity, adr, occupancyPct, otaChannel, acquisitionPrice, marginalTaxRate },
                })}
                label="Sauvegarder"
                successLabel="Sauvegardé !"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
