"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

// Saisonnalité LU par mois (coefficient ADR)
const MONTH_NAMES = ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Août","Sep","Oct","Nov","Déc"];
const LU_SEASONALITY: Record<"luxembourg_ville" | "kirchberg" | "esch" | "nord_tourisme" | "mondorf", number[]> = {
  luxembourg_ville: [0.85, 0.92, 1.00, 1.05, 1.10, 1.12, 0.95, 0.80, 1.15, 1.08, 0.98, 0.92],
  kirchberg:        [0.90, 1.00, 1.05, 1.10, 1.12, 1.10, 0.85, 0.70, 1.15, 1.10, 1.00, 0.88],
  esch:             [0.85, 0.90, 0.95, 1.00, 1.05, 1.05, 0.90, 0.80, 1.05, 1.00, 0.95, 0.88],
  nord_tourisme:    [0.75, 0.80, 0.90, 1.00, 1.15, 1.25, 1.35, 1.40, 1.10, 0.95, 0.80, 0.85],
  mondorf:          [0.80, 0.85, 0.95, 1.05, 1.15, 1.25, 1.30, 1.30, 1.10, 1.00, 0.85, 0.85],
};

const EVENTS_LU: { month: number; day?: number; name: string; adrBoost: number }[] = [
  { month: 5, name: "ING Night Marathon", adrBoost: 1.30 },
  { month: 5, name: "ArtBasel (avril-mai)", adrBoost: 1.15 },
  { month: 6, name: "Fête nationale 23 juin", adrBoost: 1.25 },
  { month: 8, name: "Schueberfouer", adrBoost: 1.40 },
  { month: 11, name: "Marché de Noël", adrBoost: 1.20 },
  { month: 12, name: "Nouvel An", adrBoost: 1.35 },
];

export default function StrPricingPage() {
  const [zone, setZone] = useState<"luxembourg_ville" | "kirchberg" | "esch" | "nord_tourisme" | "mondorf">("luxembourg_ville");
  const [baseAdr, setBaseAdr] = useState(120);
  const [minAdr, setMinAdr] = useState(75);
  const [maxAdr, setMaxAdr] = useState(280);
  const [weekendBoost, setWeekendBoost] = useState(1.15);
  const [lastMinuteDays, setLastMinuteDays] = useState(7);
  const [lastMinuteDiscount, setLastMinuteDiscount] = useState(0.15);

  const monthlyRates = useMemo(() => {
    const seas = LU_SEASONALITY[zone];
    return MONTH_NAMES.map((m, i) => {
      const rate = Math.round(baseAdr * seas[i]);
      const event = EVENTS_LU.find((e) => e.month === i + 1);
      const eventRate = event ? Math.round(rate * event.adrBoost) : null;
      return {
        month: m,
        seasonFactor: seas[i],
        baseRate: Math.min(maxAdr, Math.max(minAdr, rate)),
        weekendRate: Math.min(maxAdr, Math.round(rate * weekendBoost)),
        eventName: event?.name,
        eventRate: eventRate ? Math.min(maxAdr, eventRate) : null,
      };
    });
  }, [zone, baseAdr, minAdr, maxAdr, weekendBoost]);

  const lastMinuteExample = Math.round(baseAdr * (1 - lastMinuteDiscount));
  const averageYearly = Math.round(monthlyRates.reduce((s, m) => s + m.baseRate, 0) / 12);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Link href="/str" className="text-xs text-muted hover:text-navy">&larr; Location courte durée</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Dynamic pricing STR Luxembourg</h1>
          <p className="mt-2 text-muted">
            Recommandation de tarification ADR mois par mois selon la saisonnalité LU spécifique (météo, événements, salons),
            avec règles weekend et last-minute. Alternative locale gratuite à PriceLabs / Wheelhouse / Beyond Pricing.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Paramètres de tarification</h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Zone géographique"
                  type="select"
                  value={zone}
                  onChange={(v) => setZone(v as typeof zone)}
                  options={[
                    { value: "luxembourg_ville", label: "Luxembourg-Ville Centre" },
                    { value: "kirchberg", label: "Kirchberg / Plateau" },
                    { value: "esch", label: "Esch-sur-Alzette / Sud" },
                    { value: "nord_tourisme", label: "Nord (Mullerthal, Ardennes)" },
                    { value: "mondorf", label: "Mondorf / Moselle (bien-être/vin)" },
                  ]}
                />
                <InputField label="ADR de base (€/nuit)" value={baseAdr} onChange={(v) => setBaseAdr(Number(v))} suffix="€" hint="Votre tarif neutre semaine" />
                <InputField label="ADR minimum" value={minAdr} onChange={(v) => setMinAdr(Number(v))} suffix="€" hint="Floor price (jamais en-dessous)" />
                <InputField label="ADR maximum" value={maxAdr} onChange={(v) => setMaxAdr(Number(v))} suffix="€" hint="Ceiling price" />
                <InputField label="Majoration weekend (%)" value={Math.round((weekendBoost - 1) * 100)} onChange={(v) => setWeekendBoost(1 + Number(v) / 100)} suffix="%" hint="Ven-Sam-Dim : +15% typique" />
                <InputField label="Fenêtre last-minute" value={lastMinuteDays} onChange={(v) => setLastMinuteDays(Number(v))} suffix="jours" />
                <InputField label="Remise last-minute" value={Math.round(lastMinuteDiscount * 100)} onChange={(v) => setLastMinuteDiscount(Number(v) / 100)} suffix="%" hint="Typique 10-20% si dispo" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-rose-700 to-orange-600 p-6 text-white shadow-lg">
              <div className="text-xs uppercase tracking-wider text-white/60">ADR moyen annuel recommandé</div>
              <div className="mt-2 text-4xl font-bold">{averageYearly} €</div>
              <div className="mt-1 text-sm text-white/70">Weekends {Math.round(averageYearly * weekendBoost)} € · Last-minute {lastMinuteExample} €</div>
            </div>

            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-hidden">
              <div className="px-5 py-3 border-b border-card-border bg-background">
                <h3 className="text-base font-semibold text-navy">Tarification mensuelle</h3>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-card-border text-left text-xs text-muted">
                    <th className="px-4 py-2 font-medium">Mois</th>
                    <th className="px-4 py-2 font-medium text-right">Coef.</th>
                    <th className="px-4 py-2 font-medium text-right">Semaine</th>
                    <th className="px-4 py-2 font-medium text-right">Weekend</th>
                    <th className="px-4 py-2 font-medium text-right">Événement</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyRates.map((r) => (
                    <tr key={r.month} className="border-b border-card-border/50">
                      <td className="px-4 py-2 font-medium text-navy">{r.month}</td>
                      <td className="px-4 py-2 text-right text-xs text-muted">×{r.seasonFactor.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-mono font-semibold">{formatEUR(r.baseRate)}</td>
                      <td className="px-4 py-2 text-right font-mono text-rose-700">{formatEUR(r.weekendRate)}</td>
                      <td className="px-4 py-2 text-right">
                        {r.eventName && r.eventRate ? (
                          <div className="text-xs">
                            <div className="font-mono font-bold text-amber-700">{formatEUR(r.eventRate)}</div>
                            <div className="text-muted">{r.eventName}</div>
                          </div>
                        ) : <span className="text-muted">—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <AiAnalysisCard
              context={[
                `Stratégie dynamic pricing STR Luxembourg — ${zone}`,
                `ADR base: ${baseAdr}€, range ${minAdr}-${maxAdr}€`,
                `ADR moyen annuel recommandé: ${averageYearly}€`,
                `Saisonnalité: pics ${monthlyRates.filter((r) => r.seasonFactor >= 1.15).map((r) => r.month).join(", ")}; creux ${monthlyRates.filter((r) => r.seasonFactor < 0.9).map((r) => r.month).join(", ")}`,
                `Événements intégrés: ${EVENTS_LU.map((e) => `${e.name} (+${((e.adrBoost - 1) * 100).toFixed(0)}%)`).join(" / ")}`,
                `Boost weekend: +${((weekendBoost - 1) * 100).toFixed(0)}%`,
                `Last-minute: -${(lastMinuteDiscount * 100).toFixed(0)}% si < ${lastMinuteDays}j`,
              ].join("\n")}
              prompt="Analyse cette stratégie dynamic pricing STR Luxembourg. Livre : (1) réalisme des coefficients saisonniers par zone vs données AirDNA/Airbnb LU (Luxembourg-Ville pic corporate sep-nov + ma-juin, Nord tourisme pic juil-août), (2) événements manquants à intégrer (ArtBasel, JIFFA, Foire gastronomique, compétitions équestres, conférences ABBL), (3) stratégie occupation vs ADR (prioriser taux d'occupation si nouvelle annonce avec 0 avis, maximiser ADR si Superhost avec 4.9+), (4) pricing rules complémentaires (durée séjour min 2-3 nuits weekend, gap-day pricing pour éviter les trous de 1 nuit, early-bird discount > 60j), (5) benchmark outil : Wheelhouse/PriceLabs automatisent ces règles à $19.99/listing/mois, cette approche manuelle convient pour 1-3 biens max. Concret et actionnable pour un hôte LU."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
