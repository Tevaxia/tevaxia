"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

interface HousekeepingInputs {
  nbRooms: number;
  occupancyForecast: number; // 0-1 prévisions de taux occupation
  // Temps nettoyage standard HOTREC / AHM 2024
  avgMinutesPerCheckout: number; // départ complet ≈ 30-45 min
  avgMinutesPerStayover: number; // chambre en cours ≈ 18-25 min
  checkoutRatio: number; // 0-1 — % de chambres occupées qui sont des départs
  // Paramètres staff
  shiftHours: number; // heures de travail effectif par shift
  productivityFactor: number; // 0.80 = 80% de temps réellement productif (retenue pauses, transit)
  hourlyCost: number; // €/h brut chargé (LU 2026 : ~18-22 €/h)
  nbPublicAreas: number; // zones communes (lobby, couloirs, spa, F&B)
  minutesPerPublicArea: number;
  // Option : inspection
  supervisorRatio: number; // 1 superviseur pour N agents
}

interface HousekeepingResult {
  occupiedRooms: number;
  checkoutRooms: number;
  stayoverRooms: number;
  minutesRooms: number;
  minutesPublic: number;
  totalMinutes: number;
  totalHours: number;
  agentsNeeded: number;
  supervisorsNeeded: number;
  dailyCostAgents: number;
  dailyCostSupervisors: number;
  dailyCostTotal: number;
  costPerOccupiedRoom: number;
  costPerAvailableRoom: number;
  utilizationPct: number; // staff busy time vs allocated
}

function computeHousekeeping(i: HousekeepingInputs): HousekeepingResult {
  const occupiedRooms = Math.round(i.nbRooms * Math.max(0, Math.min(1, i.occupancyForecast)));
  const checkoutRooms = Math.round(occupiedRooms * i.checkoutRatio);
  const stayoverRooms = occupiedRooms - checkoutRooms;

  const minutesRooms =
    checkoutRooms * i.avgMinutesPerCheckout +
    stayoverRooms * i.avgMinutesPerStayover;
  const minutesPublic = i.nbPublicAreas * i.minutesPerPublicArea;
  const totalMinutes = minutesRooms + minutesPublic;

  const effectiveMinutesPerAgent = i.shiftHours * 60 * i.productivityFactor;
  const agentsNeeded = effectiveMinutesPerAgent > 0 ? Math.ceil(totalMinutes / effectiveMinutesPerAgent) : 0;
  const supervisorsNeeded = i.supervisorRatio > 0 ? Math.max(1, Math.ceil(agentsNeeded / i.supervisorRatio)) : 0;

  const dailyCostAgents = agentsNeeded * i.shiftHours * i.hourlyCost;
  const dailyCostSupervisors = supervisorsNeeded * i.shiftHours * (i.hourlyCost * 1.25); // superviseur +25%
  const dailyCostTotal = dailyCostAgents + dailyCostSupervisors;

  const costPerOccupiedRoom = occupiedRooms > 0 ? dailyCostTotal / occupiedRooms : 0;
  const costPerAvailableRoom = i.nbRooms > 0 ? dailyCostTotal / i.nbRooms : 0;
  const utilizationPct = (agentsNeeded * effectiveMinutesPerAgent) > 0
    ? (totalMinutes / (agentsNeeded * effectiveMinutesPerAgent)) * 100
    : 0;

  const totalHours = totalMinutes / 60;

  return {
    occupiedRooms, checkoutRooms, stayoverRooms,
    minutesRooms, minutesPublic, totalMinutes, totalHours,
    agentsNeeded, supervisorsNeeded,
    dailyCostAgents, dailyCostSupervisors, dailyCostTotal,
    costPerOccupiedRoom, costPerAvailableRoom, utilizationPct,
  };
}

export default function HousekeepingPage() {
  const [nbRooms, setNbRooms] = useState(120);
  const [occupancyForecast, setOccupancyForecast] = useState(0.72);
  const [avgMinutesPerCheckout, setAvgMinutesPerCheckout] = useState(40);
  const [avgMinutesPerStayover, setAvgMinutesPerStayover] = useState(20);
  const [checkoutRatio, setCheckoutRatio] = useState(0.45);
  const [shiftHours, setShiftHours] = useState(8);
  const [productivityFactor, setProductivityFactor] = useState(0.85);
  const [hourlyCost, setHourlyCost] = useState(19);
  const [nbPublicAreas, setNbPublicAreas] = useState(8);
  const [minutesPerPublicArea, setMinutesPerPublicArea] = useState(25);
  const [supervisorRatio, setSupervisorRatio] = useState(8);

  const result = useMemo(() => computeHousekeeping({
    nbRooms, occupancyForecast, avgMinutesPerCheckout, avgMinutesPerStayover,
    checkoutRatio, shiftHours, productivityFactor, hourlyCost,
    nbPublicAreas, minutesPerPublicArea, supervisorRatio,
  }), [nbRooms, occupancyForecast, avgMinutesPerCheckout, avgMinutesPerStayover, checkoutRatio, shiftHours, productivityFactor, hourlyCost, nbPublicAreas, minutesPerPublicArea, supervisorRatio]);

  // 7-day forecast table (simulation avec occupation variable)
  const weekForecast = useMemo(() => {
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const occupancyCurve = [0.65, 0.75, 0.82, 0.85, 0.80, 0.68, 0.55]; // typique biz hotel
    return days.map((d, i) => {
      const dayOcc = occupancyForecast * (occupancyCurve[i] / 0.73);
      const r = computeHousekeeping({
        nbRooms, occupancyForecast: dayOcc, avgMinutesPerCheckout, avgMinutesPerStayover,
        checkoutRatio, shiftHours, productivityFactor, hourlyCost,
        nbPublicAreas, minutesPerPublicArea, supervisorRatio,
      });
      return { day: d, occupancy: dayOcc, agents: r.agentsNeeded, cost: r.dailyCostTotal };
    });
  }, [nbRooms, occupancyForecast, avgMinutesPerCheckout, avgMinutesPerStayover, checkoutRatio, shiftHours, productivityFactor, hourlyCost, nbPublicAreas, minutesPerPublicArea, supervisorRatio]);

  const weekTotal = weekForecast.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">← Hôtellerie</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Housekeeping — staffing adaptatif</h1>
          <p className="mt-2 text-muted">
            Calculateur de staff ménage basé sur l&apos;occupation prévisionnelle et les temps standards HOTREC.
            Dimensionne les équipes quotidiennes et prévoit les coûts par chambre.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Hôtel & occupation</h2>
              <div className="space-y-4">
                <InputField label="Nombre de chambres" value={nbRooms} onChange={(v) => setNbRooms(Number(v))} min={1} />
                <InputField label="Occupation prévue" value={occupancyForecast * 100} onChange={(v) => setOccupancyForecast(Number(v) / 100)} suffix="%" min={0} max={100} step={1} />
                <InputField label="% de chambres en départ (checkout)" value={checkoutRatio * 100} onChange={(v) => setCheckoutRatio(Number(v) / 100)} suffix="%" min={0} max={100} step={5} hint="Typiquement 40-50 % dans un hôtel city-break, 25-35 % en hôtel d'affaires longue durée" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Temps standards (HOTREC 2024)</h2>
              <div className="space-y-4">
                <InputField label="Minutes / départ complet" value={avgMinutesPerCheckout} onChange={(v) => setAvgMinutesPerCheckout(Number(v))} suffix="min" hint="30-45 min : remise en état complet + linge + contrôle" />
                <InputField label="Minutes / recouche (stayover)" value={avgMinutesPerStayover} onChange={(v) => setAvgMinutesPerStayover(Number(v))} suffix="min" hint="18-25 min : linge light + réapprovisionnement" />
                <InputField label="Zones communes" value={nbPublicAreas} onChange={(v) => setNbPublicAreas(Number(v))} min={0} hint="Lobby, couloirs, spa, F&B, parking…" />
                <InputField label="Minutes / zone commune" value={minutesPerPublicArea} onChange={(v) => setMinutesPerPublicArea(Number(v))} suffix="min" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Staff & coûts</h2>
              <div className="space-y-4">
                <InputField label="Durée shift" value={shiftHours} onChange={(v) => setShiftHours(Number(v))} suffix="h" min={4} max={10} step={0.5} />
                <InputField label="Productivité effective" value={productivityFactor * 100} onChange={(v) => setProductivityFactor(Number(v) / 100)} suffix="%" min={50} max={100} step={1} hint="% de temps réellement productif (hors pauses, transit entre étages)" />
                <InputField label="Coût horaire brut chargé" value={hourlyCost} onChange={(v) => setHourlyCost(Number(v))} suffix="€/h" step={0.5} hint="LU 2026 : ~18-22 €/h femme de chambre (cotisations incluses)" />
                <InputField label="Ratio superviseur / agents" value={supervisorRatio} onChange={(v) => setSupervisorRatio(Number(v))} suffix="agents" min={4} max={20} hint="1 superviseur pour N agents. Standard HOTREC : 1:8" />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white shadow-lg">
              <div className="text-sm text-white/60">Agents nécessaires (jour)</div>
              <div className="mt-2 text-5xl font-bold">{result.agentsNeeded}</div>
              <div className="mt-2 text-sm text-white/70">
                + {result.supervisorsNeeded} superviseur(s) · {result.totalHours.toFixed(1)} h de travail
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60 text-xs">Coût jour</div>
                  <div className="font-semibold">{formatEUR(result.dailyCostTotal)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">€ / chambre occupée</div>
                  <div className="font-semibold">{formatEUR(result.costPerOccupiedRoom)}</div>
                </div>
              </div>
            </div>

            <ResultPanel
              title="Décomposition charge de travail"
              lines={[
                { label: "Chambres occupées", value: `${result.occupiedRooms} / ${nbRooms}` },
                { label: "dont départs (checkout)", value: `${result.checkoutRooms}`, sub: true },
                { label: "dont recouches", value: `${result.stayoverRooms}`, sub: true },
                { label: "Minutes chambres", value: `${result.minutesRooms} min` },
                { label: "Minutes zones communes", value: `${result.minutesPublic} min`, sub: true },
                { label: "Total minutes à produire", value: `${result.totalMinutes} min`, highlight: true },
                { label: "Taux d'utilisation staff", value: `${result.utilizationPct.toFixed(0)} %`, sub: true },
              ]}
            />

            <ResultPanel
              title="Coût journalier"
              lines={[
                { label: `Agents (${result.agentsNeeded} × ${shiftHours}h × ${hourlyCost}€)`, value: formatEUR(result.dailyCostAgents) },
                { label: `Superviseurs (${result.supervisorsNeeded} × +25 %)`, value: formatEUR(result.dailyCostSupervisors), sub: true },
                { label: "Total jour", value: formatEUR(result.dailyCostTotal), highlight: true },
                { label: "€ / chambre disponible (ALL IN)", value: formatEUR(result.costPerAvailableRoom), sub: true },
              ]}
            />

            {/* Forecast 7 jours */}
            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-1">Prévisionnel 7 jours</h3>
              <p className="text-xs text-muted mb-3">
                Courbe typique hôtel d&apos;affaires (pic mardi-jeudi). Occupation moyenne = {(occupancyForecast * 100).toFixed(0)} %.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-2 py-1.5 text-left font-semibold">Jour</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Occupation</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Agents</th>
                      <th className="px-2 py-1.5 text-right font-semibold">Coût</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weekForecast.map((d) => (
                      <tr key={d.day} className="border-b border-card-border/40">
                        <td className="px-2 py-1.5 font-medium">{d.day}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{(d.occupancy * 100).toFixed(0)} %</td>
                        <td className="px-2 py-1.5 text-right font-mono font-semibold text-navy">{d.agents}</td>
                        <td className="px-2 py-1.5 text-right font-mono">{formatEUR(d.cost)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-navy bg-navy/5 font-semibold">
                      <td className="px-2 py-1.5" colSpan={3}>Total semaine</td>
                      <td className="px-2 py-1.5 text-right font-mono text-navy">{formatEUR(weekTotal)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Hôtel : ${nbRooms} chambres`,
                `Occupation prévue : ${(occupancyForecast * 100).toFixed(0)} %`,
                `Ratio départs : ${(checkoutRatio * 100).toFixed(0)} %`,
                `Staff dimensionné : ${result.agentsNeeded} agents + ${result.supervisorsNeeded} superviseurs`,
                `Coût jour : ${formatEUR(result.dailyCostTotal)} (${formatEUR(result.costPerOccupiedRoom)}/chambre occupée)`,
                `Coût semaine prévisionnelle : ${formatEUR(weekTotal)}`,
                `Taux d'utilisation : ${result.utilizationPct.toFixed(0)} %`,
              ].join("\n")}
              prompt="Analyse ce dimensionnement housekeeping pour un hôtelier luxembourgeois. Livre : (1) cohérence des temps standards vs HOTREC / AHM (40 min checkout, 20 min stayover), (2) optimisations opérationnelles (ratio checkout vs stayover, planning équipe, sous-traitance), (3) benchmark coût par chambre occupée en LU (~15-25 € selon catégorie), (4) si le taux d'utilisation > 90% ⇒ risque de turnover, si < 75% ⇒ sur-staffing. Recommandations chiffrées."
            />

            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
              <strong>Conformité & références :</strong> temps standards HOTREC European Hotel Housekeeping
              Standards 2024. Coût horaire intègre salaire brut + cotisations employeur (~24 %) au Luxembourg.
              Superviseur rémunéré +25 % vs agent. Ce dimensionnement est théorique — ajustez selon votre
              organisation (linge externe vs interne, robots nettoyants, etc.).
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
