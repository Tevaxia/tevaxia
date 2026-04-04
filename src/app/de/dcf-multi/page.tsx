"use client";

import { useState, useMemo } from "react";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2, formatPct } from "@/lib/calculations";
import { calculerDCFLeases, type Lease } from "@/lib/dcf-leases";

const EMPTY_LEASE: Omit<Lease, "id"> = {
  locataire: "",
  surface: 200,
  loyerAnnuel: 48000,
  dateDebut: "2022-01",
  dateFin: "2028-12",
  dateBreak: "",
  probabiliteRenouvellement: 70,
  ervM2: 260,
  indexation: 2,
  franchiseMois: 0,
  fitOutContribution: 0,
  chargesLocataire: 4000,
};

export default function DCFMulti() {
  const [leases, setLeases] = useState<Lease[]>([
    { ...EMPTY_LEASE, id: "1", locataire: "Tenant A", surface: 300, loyerAnnuel: 72000, dateDebut: "2021-01", dateFin: "2027-12", ervM2: 260, probabiliteRenouvellement: 80 },
    { ...EMPTY_LEASE, id: "2", locataire: "Tenant B", surface: 180, loyerAnnuel: 39600, dateDebut: "2023-06", dateFin: "2029-05", ervM2: 240, probabiliteRenouvellement: 60 },
    { ...EMPTY_LEASE, id: "3", locataire: "Tenant C", surface: 120, loyerAnnuel: 28800, dateDebut: "2024-01", dateFin: "2030-12", ervM2: 250, probabiliteRenouvellement: 90 },
  ]);
  const [periodeAnalyse, setPeriodeAnalyse] = useState(10);
  const [tauxActu, setTauxActu] = useState(6.0);
  const [tauxCapSortie, setTauxCapSortie] = useState(5.5);
  const [fraisCession, setFraisCession] = useState(7);
  const [chargesProprio, setChargesProprio] = useState(12000);
  const [vacanceERV, setVacanceERV] = useState(5);
  const [dateValeur, setDateValeur] = useState("2026-01");
  // Leveraged IRR
  const [montantDette, setMontantDette] = useState(0);
  const [tauxDette, setTauxDette] = useState(3.5);
  // CAPEX
  const [capexAnnuel, setCapexAnnuel] = useState(0);

  const result = useMemo(() =>
    calculerDCFLeases({
      leases,
      periodeAnalyse,
      tauxActualisation: tauxActu,
      tauxCapSortie,
      fraisCessionPct: fraisCession,
      chargesProprietaireFixe: chargesProprio,
      vacanceERV,
      dateValeur,
    }),
  [leases, periodeAnalyse, tauxActu, tauxCapSortie, fraisCession, chargesProprio, vacanceERV, dateValeur]);

  const updateLease = (index: number, field: keyof Lease, value: string | number) => {
    setLeases((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const addLease = () => {
    setLeases((prev) => [...prev, { ...EMPTY_LEASE, id: String(Date.now()), locataire: `Tenant ${String.fromCharCode(65 + prev.length)}` }]);
  };

  const removeLease = (index: number) => {
    setLeases((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">Multi-tenant DCF</h1>
          <p className="mt-2 text-muted">Lease-by-lease modelling — each tenant with their own terms</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Global parameters */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">DCF Parameters</h2>
              <div className="space-y-4">
                <InputField label="Valuation date" type="text" value={dateValeur} onChange={setDateValeur} hint="YYYY-MM" />
                <InputField label="Analysis period" value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix="yrs" min={5} max={20} />
                <InputField label="Discount rate" value={tauxActu} onChange={(v) => setTauxActu(Number(v))} suffix="%" step={0.1} />
                <InputField label="Exit yield" value={tauxCapSortie} onChange={(v) => setTauxCapSortie(Number(v))} suffix="%" step={0.1} />
                <InputField label="Disposal costs" value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" />
                <InputField label="Landlord charges (annual)" value={chargesProprio} onChange={(v) => setChargesProprio(Number(v))} suffix="€" />
                <InputField label="Void on ERV" value={vacanceERV} onChange={(v) => setVacanceERV(Number(v))} suffix="%" />
                <InputField label="Annual CAPEX" value={capexAnnuel} onChange={(v) => setCapexAnnuel(Number(v))} suffix="€" hint="Major maintenance, refurbishments (deducted from NOI)" />
                <InputField label="Debt (borrowed amount)" value={montantDette} onChange={(v) => setMontantDette(Number(v))} suffix="€" hint="For equity IRR calculation (0 = no debt)" />
                {montantDette > 0 && (
                  <InputField label="Debt rate" value={tauxDette} onChange={(v) => setTauxDette(Number(v))} suffix="%" step={0.1} />
                )}
              </div>
            </div>

            {/* KPIs */}
            <ResultPanel
              title="Key Indicators"
              lines={[
                { label: "Total area", value: `${result.surfaceTotale} m²` },
                { label: "Total annual rent", value: formatEUR(result.loyerTotalAnnuel) },
                { label: "Average rent /m²/yr", value: formatEUR2(result.loyerMoyenM2) },
                { label: "Average ERV /m²/yr", value: formatEUR2(result.ervMoyenM2) },
                { label: "Occupancy rate", value: `${result.tauxOccupation.toFixed(0)}%`, warning: result.tauxOccupation < 90 },
                { label: "Avg. residual term (WAULT)", value: `${result.wault.toFixed(1)} yrs`, warning: result.wault < 3 },
                { label: "Reversion potential", value: `${result.potentielReversion > 0 ? "+" : ""}${result.potentielReversion.toFixed(1)}%` },
              ]}
            />
          </div>

          {/* Leases */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">Rent roll ({leases.length} leases)</h2>
              <button onClick={addLease} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">+ Add a lease</button>
            </div>

            {leases.map((lease, i) => (
              <div key={lease.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{lease.locataire || `Lease ${i + 1}`}</span>
                  <button onClick={() => removeLease(i)} className="text-xs text-error hover:underline">Remove</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <InputField label="Tenant" type="text" value={lease.locataire} onChange={(v) => updateLease(i, "locataire", v)} />
                  <InputField label="Area" value={lease.surface} onChange={(v) => updateLease(i, "surface", v)} suffix="m²" />
                  <InputField label="Annual rent" value={lease.loyerAnnuel} onChange={(v) => updateLease(i, "loyerAnnuel", v)} suffix="€" />
                  <InputField label="Lease start" type="text" value={lease.dateDebut} onChange={(v) => updateLease(i, "dateDebut", v)} hint="YYYY-MM" />
                  <InputField label="Lease end" type="text" value={lease.dateFin} onChange={(v) => updateLease(i, "dateFin", v)} hint="YYYY-MM" />
                  <InputField label="Break option" type="text" value={lease.dateBreak || ""} onChange={(v) => updateLease(i, "dateBreak", v)} hint="YYYY-MM — early exit (active in DCF)" />
                  <InputField label="Indexation" value={lease.indexation} onChange={(v) => updateLease(i, "indexation", v)} suffix="%/yr" step={0.5} />
                  <InputField label="ERV /m²/yr" value={lease.ervM2} onChange={(v) => updateLease(i, "ervM2", v)} suffix="€" hint="Market rent at renewal" />
                  <InputField label="Renewal probability" value={lease.probabiliteRenouvellement} onChange={(v) => updateLease(i, "probabiliteRenouvellement", v)} suffix="%" min={0} max={100} />
                  <InputField label="Rent-free period" value={lease.franchiseMois} onChange={(v) => updateLease(i, "franchiseMois", v)} suffix="months" min={0} />
                </div>
              </div>
            ))}

            {/* Tenant table */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Tenant</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Area</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Rent /m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">ERV /m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">ERV gap</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Remaining term</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">% of rent</th>
                  </tr>
                </thead>
                <tbody>
                  {result.leaseDetails.map((d) => (
                    <tr key={d.locataire} className="border-b border-card-border/50">
                      <td className="px-3 py-1.5 font-medium">{d.locataire}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{d.surface} m²</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatEUR2(d.loyerM2)}</td>
                      <td className="px-3 py-1.5 text-right font-mono">{formatEUR2(d.ervM2)}</td>
                      <td className={`px-3 py-1.5 text-right font-mono ${d.ecartERV > 0 ? "text-success" : d.ecartERV < -5 ? "text-error" : ""}`}>
                        {d.ecartERV > 0 ? "+" : ""}{d.ecartERV.toFixed(1)}%
                      </td>
                      <td className={`px-3 py-1.5 text-right font-mono ${d.dureeRestante < 2 ? "text-error font-semibold" : ""}`}>
                        {d.dureeRestante.toFixed(1)} yrs
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{d.pctLoyer.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* DCF Results */}
            <ResultPanel
              title="Multi-tenant DCF Value"
              className="border-gold/30"
              lines={[
                { label: "Discounted net income (cumulative)", value: formatEUR(result.totalNOIActualise) },
                { label: "Stabilised net income (all at ERV)", value: formatEUR(result.noiStabilise), sub: true },
                { label: "Gross resale value", value: formatEUR(result.valeurTerminaleBrute), sub: true },
                { label: `Disposal costs (${fraisCession}%)`, value: `- ${formatEUR(result.fraisCession)}`, sub: true },
                { label: "Discounted resale value", value: formatEUR(result.valeurTerminaleActualisee) },
                { label: "DCF Value", value: formatEUR(result.valeurDCF), highlight: true, large: true },
                { label: "IRR (property)", value: `${(result.irr * 100).toFixed(2)} %`, highlight: true },
                ...(montantDette > 0 ? [{
                  label: "Equity IRR (return on equity)",
                  value: (() => {
                    const equity = result.valeurDCF - montantDette;
                    const serviceDetteAnnuel = montantDette * (tauxDette / 100);
                    const equityFlows = [-equity, ...result.cashFlows.map((cf) => cf.noi - serviceDetteAnnuel - capexAnnuel)];
                    equityFlows[equityFlows.length - 1] += result.valeurTerminaleNette - montantDette;
                    const { calculerIRR } = require("@/lib/valuation");
                    const equityIrr = calculerIRR(equityFlows);
                    return `${(equityIrr * 100).toFixed(2)} %`;
                  })(),
                  highlight: true,
                }] : []),
                ...(capexAnnuel > 0 ? [{ label: "Annual CAPEX deducted", value: formatEUR(capexAnnuel), sub: true }] : []),
              ]}
            />

            {/* Annual cash flows */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-2 py-2 text-left font-semibold text-navy">Yr.</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Rents</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Rent-free</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Void</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Charges</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Net income</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Discounted</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cashFlows.map((cf) => (
                    <tr key={cf.annee} className="border-b border-card-border/50 hover:bg-background/50">
                      <td className="px-2 py-1.5 font-medium">{cf.annee}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{formatEUR(cf.loyers)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted">{cf.franchises > 0 ? `- ${formatEUR(cf.franchises)}` : "\u2014"}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted">{cf.loyerVacance > 0 ? `- ${formatEUR(cf.loyerVacance)}` : "\u2014"}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted">- {formatEUR(cf.chargesProprietaire)}</td>
                      <td className="px-2 py-1.5 text-right font-mono font-semibold">{formatEUR(cf.noi)}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{formatEUR(cf.noiActualise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
