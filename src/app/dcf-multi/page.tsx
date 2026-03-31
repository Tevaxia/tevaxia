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
    { ...EMPTY_LEASE, id: "1", locataire: "Locataire A", surface: 300, loyerAnnuel: 72000, dateDebut: "2021-01", dateFin: "2027-12", ervM2: 260, probabiliteRenouvellement: 80 },
    { ...EMPTY_LEASE, id: "2", locataire: "Locataire B", surface: 180, loyerAnnuel: 39600, dateDebut: "2023-06", dateFin: "2029-05", ervM2: 240, probabiliteRenouvellement: 60 },
    { ...EMPTY_LEASE, id: "3", locataire: "Locataire C", surface: 120, loyerAnnuel: 28800, dateDebut: "2024-01", dateFin: "2030-12", ervM2: 250, probabiliteRenouvellement: 90 },
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
    setLeases((prev) => [...prev, { ...EMPTY_LEASE, id: String(Date.now()), locataire: `Locataire ${String.fromCharCode(65 + prev.length)}` }]);
  };

  const removeLease = (index: number) => {
    setLeases((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">DCF multi-locataires</h1>
          <p className="mt-2 text-muted">Modélisation bail par bail — chaque locataire avec ses propres conditions</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Paramètres globaux */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">Paramètres DCF</h2>
              <div className="space-y-4">
                <InputField label="Date de valeur" type="text" value={dateValeur} onChange={setDateValeur} hint="AAAA-MM" />
                <InputField label="Période d'analyse" value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix="ans" min={5} max={20} />
                <InputField label="Taux d'actualisation" value={tauxActu} onChange={(v) => setTauxActu(Number(v))} suffix="%" step={0.1} />
                <InputField label="Taux de sortie" value={tauxCapSortie} onChange={(v) => setTauxCapSortie(Number(v))} suffix="%" step={0.1} />
                <InputField label="Frais de cession" value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" />
                <InputField label="Charges propriétaire (annuelles)" value={chargesProprio} onChange={(v) => setChargesProprio(Number(v))} suffix="€" />
                <InputField label="Vacance sur ERV" value={vacanceERV} onChange={(v) => setVacanceERV(Number(v))} suffix="%" />
                <InputField label="CAPEX annuel" value={capexAnnuel} onChange={(v) => setCapexAnnuel(Number(v))} suffix="€" hint="Gros entretien, rénovations (déduit du NOI)" />
                <InputField label="Dette (montant emprunté)" value={montantDette} onChange={(v) => setMontantDette(Number(v))} suffix="€" hint="Pour calcul IRR equity (0 = pas de dette)" />
                {montantDette > 0 && (
                  <InputField label="Taux de la dette" value={tauxDette} onChange={(v) => setTauxDette(Number(v))} suffix="%" step={0.1} />
                )}
              </div>
            </div>

            {/* KPIs */}
            <ResultPanel
              title="Indicateurs clés"
              lines={[
                { label: "Surface totale", value: `${result.surfaceTotale} m²` },
                { label: "Loyer total annuel", value: formatEUR(result.loyerTotalAnnuel) },
                { label: "Loyer moyen /m²/an", value: formatEUR2(result.loyerMoyenM2) },
                { label: "ERV moyen /m²/an", value: formatEUR2(result.ervMoyenM2) },
                { label: "Taux d'occupation", value: `${result.tauxOccupation.toFixed(0)}%`, warning: result.tauxOccupation < 90 },
                { label: "Durée moy. résiduelle (WAULT)", value: `${result.wault.toFixed(1)} ans`, warning: result.wault < 3 },
                { label: "Potentiel de réversion", value: `${result.potentielReversion > 0 ? "+" : ""}${result.potentielReversion.toFixed(1)}%` },
              ]}
            />
          </div>

          {/* Baux */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">État locatif ({leases.length} baux)</h2>
              <button onClick={addLease} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">+ Ajouter un bail</button>
            </div>

            {leases.map((lease, i) => (
              <div key={lease.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{lease.locataire || `Bail ${i + 1}`}</span>
                  <button onClick={() => removeLease(i)} className="text-xs text-error hover:underline">Supprimer</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <InputField label="Locataire" type="text" value={lease.locataire} onChange={(v) => updateLease(i, "locataire", v)} />
                  <InputField label="Surface" value={lease.surface} onChange={(v) => updateLease(i, "surface", v)} suffix="m²" />
                  <InputField label="Loyer annuel" value={lease.loyerAnnuel} onChange={(v) => updateLease(i, "loyerAnnuel", v)} suffix="€" />
                  <InputField label="Début bail" type="text" value={lease.dateDebut} onChange={(v) => updateLease(i, "dateDebut", v)} hint="AAAA-MM" />
                  <InputField label="Fin bail" type="text" value={lease.dateFin} onChange={(v) => updateLease(i, "dateFin", v)} hint="AAAA-MM" />
                  <InputField label="Option break" type="text" value={lease.dateBreak || ""} onChange={(v) => updateLease(i, "dateBreak", v)} hint="AAAA-MM — sortie anticipée (active dans le DCF)" />
                  <InputField label="Indexation" value={lease.indexation} onChange={(v) => updateLease(i, "indexation", v)} suffix="%/an" step={0.5} />
                  <InputField label="ERV /m²/an" value={lease.ervM2} onChange={(v) => updateLease(i, "ervM2", v)} suffix="€" hint="Loyer marché au renouvellement" />
                  <InputField label="Proba. renouvellement" value={lease.probabiliteRenouvellement} onChange={(v) => updateLease(i, "probabiliteRenouvellement", v)} suffix="%" min={0} max={100} />
                  <InputField label="Franchise" value={lease.franchiseMois} onChange={(v) => updateLease(i, "franchiseMois", v)} suffix="mois" min={0} />
                </div>
              </div>
            ))}

            {/* Tableau locataires */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">Locataire</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Surface</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Loyer /m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">ERV /m²</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Écart ERV</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">Durée rest.</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">% loyer</th>
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
                        {d.dureeRestante.toFixed(1)} ans
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{d.pctLoyer.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Résultats DCF */}
            <ResultPanel
              title="Valeur DCF multi-locataires"
              className="border-gold/30"
              lines={[
                { label: "Revenus nets actualisés (cumul)", value: formatEUR(result.totalNOIActualise) },
                { label: "Revenu net stabilisé (tous à ERV)", value: formatEUR(result.noiStabilise), sub: true },
                { label: "Valeur de revente brute", value: formatEUR(result.valeurTerminaleBrute), sub: true },
                { label: `Frais de cession (${fraisCession}%)`, value: `- ${formatEUR(result.fraisCession)}`, sub: true },
                { label: "Valeur de revente actualisée", value: formatEUR(result.valeurTerminaleActualisee) },
                { label: "Valeur DCF", value: formatEUR(result.valeurDCF), highlight: true, large: true },
                { label: "TRI (IRR) property", value: `${(result.irr * 100).toFixed(2)} %`, highlight: true },
                ...(montantDette > 0 ? [{
                  label: "TRI equity (rendement fonds propres)",
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
                ...(capexAnnuel > 0 ? [{ label: "CAPEX annuel déduit", value: formatEUR(capexAnnuel), sub: true }] : []),
              ]}
            />

            {/* Cash flows annuels */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-2 py-2 text-left font-semibold text-navy">An.</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Loyers</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Franchises</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Vacance</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Charges</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Revenu net</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">Actualisé</th>
                  </tr>
                </thead>
                <tbody>
                  {result.cashFlows.map((cf) => (
                    <tr key={cf.annee} className="border-b border-card-border/50 hover:bg-background/50">
                      <td className="px-2 py-1.5 font-medium">{cf.annee}</td>
                      <td className="px-2 py-1.5 text-right font-mono">{formatEUR(cf.loyers)}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted">{cf.franchises > 0 ? `- ${formatEUR(cf.franchises)}` : "—"}</td>
                      <td className="px-2 py-1.5 text-right font-mono text-muted">{cf.loyerVacance > 0 ? `- ${formatEUR(cf.loyerVacance)}` : "—"}</td>
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
