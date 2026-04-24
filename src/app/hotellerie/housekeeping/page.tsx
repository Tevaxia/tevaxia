"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import { formatEUR } from "@/lib/calculations";

interface HousekeepingInputs {
  nbRooms: number;
  occupancyForecast: number;
  avgMinutesPerCheckout: number;
  avgMinutesPerStayover: number;
  checkoutRatio: number;
  shiftHours: number;
  productivityFactor: number;
  hourlyCost: number;
  nbPublicAreas: number;
  minutesPerPublicArea: number;
  supervisorRatio: number;
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
  utilizationPct: number;
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
  const dailyCostSupervisors = supervisorsNeeded * i.shiftHours * (i.hourlyCost * 1.25);
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
  const t = useTranslations("hotelHousekeeping");
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

  const weekForecast = useMemo(() => {
    const days = [t("day1"), t("day2"), t("day3"), t("day4"), t("day5"), t("day6"), t("day7")];
    const occupancyCurve = [0.65, 0.75, 0.82, 0.85, 0.80, 0.68, 0.55];
    return days.map((d, i) => {
      const dayOcc = occupancyForecast * (occupancyCurve[i] / 0.73);
      const r = computeHousekeeping({
        nbRooms, occupancyForecast: dayOcc, avgMinutesPerCheckout, avgMinutesPerStayover,
        checkoutRatio, shiftHours, productivityFactor, hourlyCost,
        nbPublicAreas, minutesPerPublicArea, supervisorRatio,
      });
      return { day: d, occupancy: dayOcc, agents: r.agentsNeeded, cost: r.dailyCostTotal };
    });
  }, [nbRooms, occupancyForecast, avgMinutesPerCheckout, avgMinutesPerStayover, checkoutRatio, shiftHours, productivityFactor, hourlyCost, nbPublicAreas, minutesPerPublicArea, supervisorRatio, t]);

  const weekTotal = weekForecast.reduce((s, d) => s + d.cost, 0);

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Link href="/hotellerie" className="text-xs text-muted hover:text-navy">{t("backHub")}</Link>
        <div className="mt-2 mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("pageTitle")}</h1>
          <p className="mt-2 text-muted">{t("pageSubtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionHotel")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputRooms")} value={nbRooms} onChange={(v) => setNbRooms(Number(v))} min={1} />
                <InputField label={t("inputOccupancy")} value={occupancyForecast * 100} onChange={(v) => setOccupancyForecast(Number(v) / 100)} suffix="%" min={0} max={100} step={1} />
                <InputField label={t("inputCheckoutRatio")} value={checkoutRatio * 100} onChange={(v) => setCheckoutRatio(Number(v) / 100)} suffix="%" min={0} max={100} step={5} hint={t("inputCheckoutHint")} />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionTimes")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputMinCheckout")} value={avgMinutesPerCheckout} onChange={(v) => setAvgMinutesPerCheckout(Number(v))} suffix="min" hint={t("inputMinCheckoutHint")} />
                <InputField label={t("inputMinStayover")} value={avgMinutesPerStayover} onChange={(v) => setAvgMinutesPerStayover(Number(v))} suffix="min" hint={t("inputMinStayoverHint")} />
                <InputField label={t("inputPublicAreas")} value={nbPublicAreas} onChange={(v) => setNbPublicAreas(Number(v))} min={0} hint={t("inputPublicAreasHint")} />
                <InputField label={t("inputMinPublic")} value={minutesPerPublicArea} onChange={(v) => setMinutesPerPublicArea(Number(v))} suffix="min" />
              </div>
            </div>

            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("sectionStaff")}</h2>
              <div className="space-y-4">
                <InputField label={t("inputShift")} value={shiftHours} onChange={(v) => setShiftHours(Number(v))} suffix="h" min={4} max={10} step={0.5} />
                <InputField label={t("inputProductivity")} value={productivityFactor * 100} onChange={(v) => setProductivityFactor(Number(v) / 100)} suffix="%" min={50} max={100} step={1} hint={t("inputProductivityHint")} />
                <InputField label={t("inputHourlyCost")} value={hourlyCost} onChange={(v) => setHourlyCost(Number(v))} suffix="€/h" step={0.5} hint={t("inputHourlyCostHint")} />
                <InputField label={t("inputSupRatio")} value={supervisorRatio} onChange={(v) => setSupervisorRatio(Number(v))} suffix={t("suffixAgents")} min={4} max={20} hint={t("inputSupRatioHint")} />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white shadow-lg">
              <div className="text-sm text-white/60">{t("agentsBadge")}</div>
              <div className="mt-2 text-5xl font-bold">{result.agentsNeeded}</div>
              <div className="mt-2 text-sm text-white/70">
                {t("agentsDetail", { n: result.supervisorsNeeded, hours: result.totalHours.toFixed(1) })}
              </div>
              <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/60 text-xs">{t("dayCost")}</div>
                  <div className="font-semibold">{formatEUR(result.dailyCostTotal)}</div>
                </div>
                <div>
                  <div className="text-white/60 text-xs">{t("perOccupiedRoom")}</div>
                  <div className="font-semibold">{formatEUR(result.costPerOccupiedRoom)}</div>
                </div>
              </div>
            </div>

            <ResultPanel
              title={t("panelWorkloadTitle")}
              lines={[
                { label: t("workloadOccRooms"), value: `${result.occupiedRooms} / ${nbRooms}` },
                { label: t("workloadCheckouts"), value: `${result.checkoutRooms}`, sub: true },
                { label: t("workloadStayovers"), value: `${result.stayoverRooms}`, sub: true },
                { label: t("workloadMinRooms"), value: `${result.minutesRooms} min` },
                { label: t("workloadMinPublic"), value: `${result.minutesPublic} min`, sub: true },
                { label: t("workloadTotalMin"), value: `${result.totalMinutes} min`, highlight: true },
                { label: t("workloadUtilization"), value: `${result.utilizationPct.toFixed(0)} %`, sub: true },
              ]}
            />

            <ResultPanel
              title={t("panelCostTitle")}
              lines={[
                { label: t("costAgents", { n: result.agentsNeeded, h: shiftHours, cost: hourlyCost }), value: formatEUR(result.dailyCostAgents) },
                { label: t("costSupervisors", { n: result.supervisorsNeeded }), value: formatEUR(result.dailyCostSupervisors), sub: true },
                { label: t("costTotal"), value: formatEUR(result.dailyCostTotal), highlight: true },
                { label: t("costPerAvailable"), value: formatEUR(result.costPerAvailableRoom), sub: true },
              ]}
            />

            <div className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
              <h3 className="text-base font-semibold text-navy mb-1">{t("forecastTitle")}</h3>
              <p className="text-xs text-muted mb-3">
                {t("forecastSubtitle", { pct: (occupancyForecast * 100).toFixed(0) })}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="px-2 py-1.5 text-left font-semibold">{t("thDay")}</th>
                      <th className="px-2 py-1.5 text-right font-semibold">{t("thOccupancy")}</th>
                      <th className="px-2 py-1.5 text-right font-semibold">{t("thAgents")}</th>
                      <th className="px-2 py-1.5 text-right font-semibold">{t("thCost")}</th>
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
                      <td className="px-2 py-1.5" colSpan={3}>{t("weekTotal")}</td>
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
              <strong>{t("conformityStrong")}</strong> {t("conformityBody")}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
