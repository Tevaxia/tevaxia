"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import { formatEUR, formatEUR2 } from "@/lib/calculations";
import { calculerDCFLeases, type Lease } from "@/lib/dcf-leases";
import { calculerIRR } from "@/lib/valuation";
import { generateDcfMultiPdfBlob, PdfButton } from "@/components/ToolsPdf";
import ShareLinkButton from "@/components/ShareLinkButton";
import { sauvegarderEvaluation } from "@/lib/storage";
import SaveButton from "@/components/SaveButton";
import SEOContent from "@/components/SEOContent";
import AiAnalysisCard from "@/components/AiAnalysisCard";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

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
  const t = useTranslations("dcfMulti");

  const [leases, setLeases] = useState<Lease[]>([
    { ...EMPTY_LEASE, id: "1", locataire: t("defaultTenantA"), surface: 300, loyerAnnuel: 72000, dateDebut: "2021-01", dateFin: "2027-12", ervM2: 260, probabiliteRenouvellement: 80 },
    { ...EMPTY_LEASE, id: "2", locataire: t("defaultTenantB"), surface: 180, loyerAnnuel: 39600, dateDebut: "2023-06", dateFin: "2029-05", ervM2: 240, probabiliteRenouvellement: 60 },
    { ...EMPTY_LEASE, id: "3", locataire: t("defaultTenantC"), surface: 120, loyerAnnuel: 28800, dateDebut: "2024-01", dateFin: "2030-12", ervM2: 250, probabiliteRenouvellement: 90 },
  ]);
  const [periodeAnalyse, setPeriodeAnalyse] = useState(10);
  const [tauxActu, setTauxActu] = useState(6.0);
  const [tauxCapSortie, setTauxCapSortie] = useState(5.5);
  const [fraisCession, setFraisCession] = useState(7);
  const [chargesProprio, setChargesProprio] = useState(12000);
  const [vacanceERV, setVacanceERV] = useState(5);
  const [dateValeur, setDateValeur] = useState(new Date().toISOString().slice(0, 7));
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
    setLeases((prev) => [...prev, { ...EMPTY_LEASE, id: String(Date.now()), locataire: `${t("tenantPrefix")} ${String.fromCharCode(65 + prev.length)}` }]);
  };

  const removeLease = (index: number) => {
    setLeases((prev) => prev.filter((_, i) => i !== index));
  };

  const [csvError, setCsvError] = useState<string | null>(null);
  const handleImportCsv = (file: File) => {
    setCsvError(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const text = String(reader.result ?? "");
        const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
        // Detect header
        const hasHeader = /locataire|tenant/i.test(lines[0] ?? "");
        const dataLines = hasHeader ? lines.slice(1) : lines;
        const imported: Lease[] = [];
        for (const [idx, line] of dataLines.entries()) {
          const cols = line.split(/[,;\t]/).map((c) => c.trim());
          // Expected: locataire, surface, loyerAnnuel, dateDebut, dateFin, indexation, ervM2, probaRenouv, franchiseMois, chargesLocataire
          if (cols.length < 5) continue;
          const lease: Lease = {
            id: `csv-${Date.now()}-${idx}`,
            locataire: cols[0] || `Locataire ${idx + 1}`,
            surface: Number(cols[1]) || 0,
            loyerAnnuel: Number(cols[2]) || 0,
            dateDebut: cols[3] || "2026-01",
            dateFin: cols[4] || "2030-12",
            dateBreak: cols[5] || "",
            indexation: Number(cols[6]) || 2,
            ervM2: Number(cols[7]) || (Number(cols[1]) > 0 ? Number(cols[2]) / Number(cols[1]) : 0),
            probabiliteRenouvellement: Number(cols[8]) || 70,
            franchiseMois: Number(cols[9]) || 0,
            fitOutContribution: 0,
            chargesLocataire: Number(cols[10]) || 0,
            stepRents: undefined,
          };
          imported.push(lease);
        }
        if (imported.length === 0) {
          setCsvError(t("csvNoRows"));
          return;
        }
        setLeases(imported);
      } catch (e) {
        setCsvError(e instanceof Error ? e.message : String(e));
      }
    };
    reader.onerror = () => setCsvError(t("csvReadError"));
    reader.readAsText(file, "utf-8");
  };

  const downloadCsvTemplate = () => {
    const header = "locataire,surface,loyerAnnuel,dateDebut,dateFin,dateBreak,indexation,ervM2,probabiliteRenouvellement,franchiseMois,chargesLocataire";
    const example = "Tenant A,300,72000,2025-01,2030-12,,2,250,80,0,4000";
    const blob = new Blob([`${header}\n${example}\n`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dcf-multi-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">{t("title")}</h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Paramètres globaux */}
          <div className="space-y-6">
            <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-navy">{t("paramsDCF")}</h2>
              <div className="space-y-4">
                <InputField label={t("dateValeur")} type="text" value={dateValeur} onChange={setDateValeur} hint={t("dateValeurHint")} />
                <InputField label={t("periodeAnalyse")} value={periodeAnalyse} onChange={(v) => setPeriodeAnalyse(Number(v))} suffix={t("suffixYears")} min={5} max={20} />
                <InputField label={t("tauxActualisation")} value={tauxActu} onChange={(v) => setTauxActu(Number(v))} suffix="%" step={0.1} />
                <InputField label={t("tauxSortie")} value={tauxCapSortie} onChange={(v) => setTauxCapSortie(Number(v))} suffix="%" step={0.1} />
                <InputField label={t("fraisCession")} value={fraisCession} onChange={(v) => setFraisCession(Number(v))} suffix="%" />
                <InputField label={t("chargesProprietaire")} value={chargesProprio} onChange={(v) => setChargesProprio(Number(v))} suffix="€" />
                <InputField label={t("vacanceSurERV")} value={vacanceERV} onChange={(v) => setVacanceERV(Number(v))} suffix="%" />
                <InputField label={t("capexAnnuel")} value={capexAnnuel} onChange={(v) => setCapexAnnuel(Number(v))} suffix="€" hint={t("capexHint")} />
                <InputField label={t("montantDette")} value={montantDette} onChange={(v) => setMontantDette(Number(v))} suffix="€" hint={t("detteHint")} />
                {montantDette > 0 && (
                  <InputField label={t("tauxDette")} value={tauxDette} onChange={(v) => setTauxDette(Number(v))} suffix="%" step={0.1} />
                )}
              </div>
            </div>

            {/* KPIs */}
            <ResultPanel
              title={t("kpiTitle")}
              lines={[
                { label: t("kpiSurfaceTotale"), value: `${result.surfaceTotale} m²` },
                { label: t("kpiLoyerTotal"), value: formatEUR(result.loyerTotalAnnuel) },
                { label: t("kpiLoyerMoyen"), value: formatEUR2(result.loyerMoyenM2) },
                { label: t("kpiERVMoyen"), value: formatEUR2(result.ervMoyenM2) },
                { label: t("kpiTauxOccupation"), value: `${result.tauxOccupation.toFixed(0)}%`, warning: result.tauxOccupation < 90 },
                { label: t("kpiWAULT"), value: `${result.wault.toFixed(1)} ${t("suffixYears")}`, warning: result.wault < 3 },
                { label: t("kpiPotentielReversion"), value: `${result.potentielReversion > 0 ? "+" : ""}${result.potentielReversion.toFixed(1)}%` },
              ]}
            />
          </div>

          {/* Baux */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h2 className="text-base font-semibold text-navy">{t("etatLocatif", { count: leases.length })}</h2>
              <div className="flex items-center gap-2">
                <button onClick={downloadCsvTemplate} className="rounded-lg border border-card-border bg-card px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-slate-50" title={t("csvTemplateHint")}>
                  {t("csvTemplate")}
                </button>
                <button
                  onClick={() => {
                    // Export schedule mensuel lease-by-lease sur 12 mois
                    const [y, m] = dateValeur.split("-").map(Number);
                    const months: string[] = [];
                    for (let i = 0; i < 12; i++) {
                      const tm = y * 12 + (m - 1) + i;
                      months.push(`${Math.floor(tm / 12)}-${String((tm % 12) + 1).padStart(2, "0")}`);
                    }
                    const header = ["Locataire", "Surface", "Loyer annuel", "Début", "Fin", "Indexation %", ...months, "Total A1"];
                    const rows: string[] = [
                      `# Export schedule DCF ${leases.length} baux — ${new Date().toLocaleDateString("fr-LU")}`,
                      `# Date valeur : ${dateValeur}, période : 12 mois`,
                      "",
                      header.map((h) => `"${h}"`).join(";"),
                    ];
                    for (const lease of leases) {
                      const monthAmounts: number[] = [];
                      let totalY1 = 0;
                      const [ly, lm] = lease.dateDebut.split("-").map(Number);
                      const leaseStart = ly * 12 + lm - 1;
                      for (let i = 0; i < 12; i++) {
                        const tm = y * 12 + (m - 1) + i;
                        const ym = `${Math.floor(tm / 12)}-${String((tm % 12) + 1).padStart(2, "0")}`;
                        const active = lease.dateFin >= ym && lease.dateDebut <= ym;
                        const monthsSinceStart = Math.max(0, tm - leaseStart);
                        const inFranchise = active && monthsSinceStart + 1 <= lease.franchiseMois;
                        const amount = active && !inFranchise
                          ? (lease.loyerAnnuel / 12) * Math.pow(1 + lease.indexation / 100, monthsSinceStart / 12)
                          : 0;
                        monthAmounts.push(Math.round(amount));
                        totalY1 += amount;
                      }
                      rows.push([
                        `"${lease.locataire.replace(/"/g, '""')}"`,
                        String(lease.surface),
                        String(lease.loyerAnnuel),
                        lease.dateDebut,
                        lease.dateFin,
                        String(lease.indexation),
                        ...monthAmounts.map(String),
                        Math.round(totalY1).toString(),
                      ].join(";"));
                    }
                    const bom = "\uFEFF";
                    const blob = new Blob([bom + rows.join("\n")], { type: "text/csv;charset=utf-8;" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `dcf-lease-schedule-${dateValeur}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="rounded-lg border border-card-border bg-card px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-slate-50"
                >
                  Export schedule
                </button>
                <label className="rounded-lg border border-navy bg-white px-2.5 py-1.5 text-xs font-medium text-navy hover:bg-navy/5 cursor-pointer">
                  {t("csvImport")}
                  <input
                    type="file"
                    accept=".csv,text/csv"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleImportCsv(f);
                      e.currentTarget.value = "";
                    }}
                  />
                </label>
                <button onClick={addLease} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">{t("ajouterBail")}</button>
              </div>
            </div>
            {csvError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-800">{csvError}</div>
            )}

            {leases.map((lease, i) => (
              <div key={lease.id} className="rounded-xl border border-card-border bg-card p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-navy">{lease.locataire || t("bailNumero", { n: i + 1 })}</span>
                  <button onClick={() => removeLease(i)} className="text-xs text-error hover:underline">{t("supprimer")}</button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <InputField label={t("locataire")} type="text" value={lease.locataire} onChange={(v) => updateLease(i, "locataire", v)} />
                  <InputField label={t("surface")} value={lease.surface} onChange={(v) => updateLease(i, "surface", v)} suffix="m²" />
                  <InputField label={t("loyerAnnuel")} value={lease.loyerAnnuel} onChange={(v) => updateLease(i, "loyerAnnuel", v)} suffix="€" />
                  <InputField label={t("debutBail")} type="text" value={lease.dateDebut} onChange={(v) => updateLease(i, "dateDebut", v)} hint={t("dateValeurHint")} />
                  <InputField label={t("finBail")} type="text" value={lease.dateFin} onChange={(v) => updateLease(i, "dateFin", v)} hint={t("dateValeurHint")} />
                  <InputField label={t("optionBreak")} type="text" value={lease.dateBreak || ""} onChange={(v) => updateLease(i, "dateBreak", v)} hint={t("optionBreakHint")} />
                  <InputField label={t("indexation")} value={lease.indexation} onChange={(v) => updateLease(i, "indexation", v)} suffix={t("suffixPctAn")} step={0.5} />
                  <InputField label={t("ervM2An")} value={lease.ervM2} onChange={(v) => updateLease(i, "ervM2", v)} suffix="€" hint={t("ervHint")} />
                  <InputField label={t("probaRenouvellement")} value={lease.probabiliteRenouvellement} onChange={(v) => updateLease(i, "probabiliteRenouvellement", v)} suffix="%" min={0} max={100} />
                  <InputField label={t("franchise")} value={lease.franchiseMois} onChange={(v) => updateLease(i, "franchiseMois", v)} suffix={t("suffixMois")} min={0} />
                </div>
              </div>
            ))}

            {/* Tableau locataires */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-3 py-2 text-left font-semibold text-navy">{t("locataire")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("surface")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thLoyerM2")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thERVM2")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thEcartERV")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thDureeRestante")}</th>
                    <th className="px-3 py-2 text-right font-semibold text-navy">{t("thPctLoyer")}</th>
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
                        {d.dureeRestante.toFixed(1)} {t("suffixYears")}
                      </td>
                      <td className="px-3 py-1.5 text-right font-mono text-muted">{d.pctLoyer.toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Résultats DCF — Summary Card */}
            <div className="rounded-xl border border-gold/30 bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-base font-semibold text-navy">{t("valeurDCFTitle")}</h3>
              <div className="grid grid-cols-2 gap-3 mb-5">
                {/* Valeur DCF */}
                <div className="rounded-lg bg-navy/5 border border-navy/10 p-4 text-center">
                  <div className="text-xs font-medium text-navy/60 mb-1">{t("valeurDCF")}</div>
                  <div className="text-2xl font-bold text-navy">{formatEUR(result.valeurDCF)}</div>
                </div>
                {/* TRI / IRR */}
                <div className="rounded-lg bg-gold/10 border border-gold/20 p-4 text-center">
                  <div className="text-xs font-medium text-gold-dark/70 mb-1">{t("triIRR")}</div>
                  <div className="text-2xl font-bold text-gold-dark">{(result.irr * 100).toFixed(2)} %</div>
                </div>
                {/* Rendement brut */}
                <div className="rounded-lg bg-background border border-card-border p-3 text-center">
                  <div className="text-xs font-medium text-muted mb-1">{t("rendementBrut")}</div>
                  <div className="text-lg font-semibold text-foreground">
                    {result.valeurDCF > 0 ? ((result.loyerTotalAnnuel / result.valeurDCF) * 100).toFixed(2) : "0.00"} %
                  </div>
                </div>
                {/* WAULT */}
                <div className="rounded-lg bg-background border border-card-border p-3 text-center">
                  <div className="text-xs font-medium text-muted mb-1">WAULT</div>
                  <div className="text-lg font-semibold text-foreground">{result.wault.toFixed(1)} {t("suffixYears")}</div>
                </div>
              </div>
              {/* Detailed breakdown */}
              <div className="divide-y divide-card-border/50">
                {[
                  { label: t("revenusNetsActualises"), value: formatEUR(result.totalNOIActualise) },
                  { label: t("revenuNetStabilise"), value: formatEUR(result.noiStabilise), sub: true },
                  { label: t("valeurReventeBrute"), value: formatEUR(result.valeurTerminaleBrute), sub: true },
                  { label: t("fraisCessionPct", { pct: fraisCession }), value: `- ${formatEUR(result.fraisCession)}`, sub: true },
                  { label: t("valeurReventeActualisee"), value: formatEUR(result.valeurTerminaleActualisee) },
                  ...(montantDette > 0 ? [{
                    label: t("triEquity"),
                    value: (() => {
                      const equity = result.valeurDCF - montantDette;
                      const serviceDetteAnnuel = montantDette * (tauxDette / 100);
                      const equityFlows = [-equity, ...result.cashFlows.map((cf) => cf.noi - serviceDetteAnnuel - capexAnnuel)];
                      equityFlows[equityFlows.length - 1] += result.valeurTerminaleNette - montantDette;
                      const equityIrr = calculerIRR(equityFlows);
                      return `${(equityIrr * 100).toFixed(2)} %`;
                    })(),
                    highlight: true,
                  }] : []),
                  ...(capexAnnuel > 0 ? [{ label: t("capexDeduit"), value: formatEUR(capexAnnuel), sub: true }] : []),
                ].map((line, i) => (
                  <div
                    key={i}
                    className={`flex items-center justify-between py-2 ${
                      line.highlight ? "border-t-2 border-gold pt-3" : line.sub ? "pl-4" : ""
                    } text-sm`}
                  >
                    <span className={`${line.sub ? "text-muted" : "text-slate"} ${line.highlight ? "font-semibold" : ""}`}>
                      {line.label}
                    </span>
                    <span className={`font-mono font-semibold ${line.highlight ? "text-navy" : "text-foreground"}`}>
                      {line.value}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex flex-wrap justify-end gap-2">
                <ShareLinkButton
                  toolType="dcf-multi"
                  defaultTitle={`DCF — ${leases.length} baux — ${formatEUR(result.valeurDCF)}`}
                  payload={{
                    inputs: { periodeAnalyse, tauxActu, tauxCapSortie, fraisCession, chargesProprio, vacanceERV, dateValeur, leases, montantDette, tauxDette, capexAnnuel },
                    results: {
                      valeurDCF: result.valeurDCF,
                      irr: result.irr,
                      wault: result.wault,
                      loyerTotalAnnuel: result.loyerTotalAnnuel,
                      surfaceTotale: result.surfaceTotale,
                      loyerMoyenM2: result.loyerMoyenM2,
                      ervMoyenM2: result.ervMoyenM2,
                      tauxOccupation: result.tauxOccupation,
                      potentielReversion: result.potentielReversion,
                      totalNOIActualise: result.totalNOIActualise,
                      noiStabilise: result.noiStabilise,
                      valeurTerminaleBrute: result.valeurTerminaleBrute,
                      valeurTerminaleActualisee: result.valeurTerminaleActualisee,
                      fraisCession: result.fraisCession,
                      leaseDetails: result.leaseDetails,
                    },
                  }}
                />
                <SaveButton
                  onClick={() => {
                    sauvegarderEvaluation({
                      nom: `DCF Multi — ${leases.length} baux — ${formatEUR(result.valeurDCF)}`,
                      type: "dcf-multi",
                      valeurPrincipale: result.valeurDCF,
                      data: { leases, periodeAnalyse, tauxActu, tauxCapSortie, fraisCession, chargesProprio, vacanceERV, dateValeur, montantDette, tauxDette, capexAnnuel },
                    });
                  }}
                  label="Sauvegarder"
                  successLabel="Sauvegardé !"
                />
                <PdfButton
                  label="PDF"
                  filename={`dcf-multi-${new Date().toLocaleDateString("fr-LU")}.pdf`}
                  generateBlob={() =>
                    generateDcfMultiPdfBlob({
                      baux: leases.map((l) => ({
                        locataire: l.locataire || "—",
                        loyer: l.loyerAnnuel,
                        echeance: l.dateFin,
                      })),
                      loyerTotal: result.loyerTotalAnnuel,
                      tauxActualisation: tauxActu,
                      valeurDCF: result.totalNOIActualise,
                      valeurTerminale: result.valeurTerminaleActualisee,
                      valeurTotale: result.valeurDCF,
                      tri: result.irr * 100,
                      rendement: result.valeurDCF > 0 ? (result.loyerTotalAnnuel / result.valeurDCF) * 100 : undefined,
                    })
                  }
                />
              </div>
            </div>

            <AiAnalysisCard
              context={[
                `Portefeuille: ${leases.length} baux sur ${result.surfaceTotale} m²`,
                `WAULT: ${result.wault.toFixed(1)} ans`,
                `Taux d'occupation: ${(result.tauxOccupation * 100).toFixed(1)}%`,
                `Loyer total annuel: ${formatEUR(result.loyerTotalAnnuel)} (${formatEUR2(result.loyerMoyenM2)}/m²/an)`,
                `ERV moyen: ${formatEUR2(result.ervMoyenM2)}/m²/an`,
                `Potentiel reversion: ${formatEUR(result.potentielReversion)}`,
                "",
                `Hypothèses: taux actualisation ${tauxActu}%, cap sortie ${tauxCapSortie}%, frais cession ${fraisCession}%, vacance structurelle ${vacanceERV}%`,
                `Charges propriétaire fixes: ${formatEUR(chargesProprio)}/an`,
                `Période: ${periodeAnalyse} ans, CAPEX: ${formatEUR(capexAnnuel)}/an`,
                "",
                `NOI stabilisé: ${formatEUR(result.noiStabilise)}`,
                `Σ NOI actualisés: ${formatEUR(result.totalNOIActualise)}`,
                `Valeur terminale actualisée: ${formatEUR(result.valeurTerminaleActualisee)} (nette frais cession)`,
                `Valeur DCF: ${formatEUR(result.valeurDCF)}`,
                `IRR: ${(result.irr * 100).toFixed(2)}%`,
                montantDette > 0 ? `Leveraged (dette ${formatEUR(montantDette)} à ${tauxDette}%)` : "Unleveraged",
                "",
                `Détail baux: ${result.leaseDetails.map((l) => `${l.locataire} ${l.surface}m² — loyer ${formatEUR(l.loyerAnnuel)} (${formatEUR2(l.loyerM2)}/m²) — durée restante ${l.dureeRestante.toFixed(1)}a — écart ERV ${l.ecartERV > 0 ? "+" : ""}${(l.ecartERV * 100).toFixed(1)}%`).join(" / ")}`,
              ].join("\n")}
              prompt="Analyse ce DCF multi-baux pour un investisseur immobilier au Luxembourg. Livre : (1) qualité du cash-flow actuel (WAULT, risque locatif, vacance, reversion potentielle), (2) sensibilité de la valeur DCF aux hypothèses clés (taux actualisation, cap sortie, probabilités de renouvellement), (3) positionnement IRR vs attentes marché investisseurs institutionnels LU (commercial ~5-7%, bureau prime ~4-5%), (4) recommandation d'acquisition (prix max, conditions suspensives, clauses à négocier). Reste chiffré et actionnable."
            />

            {/* Stress tests pré-configurés */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm p-5">
              <h3 className="text-base font-semibold text-navy">{t("stressTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted mb-4">{t("stressSubtitle")}</p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  {
                    key: "occ20",
                    label: t("stressOcc20"),
                    run: () => calculerDCFLeases({
                      leases: leases.map((l) => ({ ...l, loyerAnnuel: l.loyerAnnuel * 0.8 })),
                      periodeAnalyse,
                      tauxActualisation: tauxActu,
                      tauxCapSortie,
                      fraisCessionPct: fraisCession,
                      chargesProprietaireFixe: chargesProprio,
                      vacanceERV,
                      dateValeur,
                    }),
                  },
                  {
                    key: "loy10",
                    label: t("stressLoyer10"),
                    run: () => calculerDCFLeases({
                      leases: leases.map((l) => ({ ...l, loyerAnnuel: l.loyerAnnuel * 0.9, ervM2: l.ervM2 * 0.9 })),
                      periodeAnalyse,
                      tauxActualisation: tauxActu,
                      tauxCapSortie,
                      fraisCessionPct: fraisCession,
                      chargesProprietaireFixe: chargesProprio,
                      vacanceERV,
                      dateValeur,
                    }),
                  },
                  {
                    key: "taux200",
                    label: t("stressTaux200"),
                    run: () => calculerDCFLeases({
                      leases,
                      periodeAnalyse,
                      tauxActualisation: tauxActu + 2,
                      tauxCapSortie: tauxCapSortie + 1,
                      fraisCessionPct: fraisCession,
                      chargesProprietaireFixe: chargesProprio,
                      vacanceERV,
                      dateValeur,
                    }),
                  },
                  {
                    key: "combo",
                    label: t("stressCombo"),
                    run: () => calculerDCFLeases({
                      leases: leases.map((l) => ({ ...l, loyerAnnuel: l.loyerAnnuel * 0.85, ervM2: l.ervM2 * 0.9 })),
                      periodeAnalyse,
                      tauxActualisation: tauxActu + 1,
                      tauxCapSortie: tauxCapSortie + 1,
                      fraisCessionPct: fraisCession,
                      chargesProprietaireFixe: chargesProprio,
                      vacanceERV: vacanceERV + 3,
                      dateValeur,
                    }),
                  },
                ].map((stress) => {
                  const r = stress.run();
                  const delta = r.valeurDCF - result.valeurDCF;
                  const pct = result.valeurDCF > 0 ? (delta / result.valeurDCF) * 100 : 0;
                  const bg = pct >= -5 ? "bg-emerald-50 border-emerald-200" : pct >= -15 ? "bg-amber-50 border-amber-200" : "bg-rose-50 border-rose-200";
                  const textPct = pct >= -5 ? "text-emerald-800" : pct >= -15 ? "text-amber-800" : "text-rose-800";
                  return (
                    <div key={stress.key} className={`rounded-lg border p-3 ${bg}`}>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-navy/70">{stress.label}</div>
                      <div className="mt-1 text-sm font-mono font-bold text-navy tabular-nums">{formatEUR(r.valeurDCF)}</div>
                      <div className={`text-xs font-mono tabular-nums ${textPct}`}>
                        {pct > 0 ? "+" : ""}{pct.toFixed(1)} % / {formatEUR(delta)}
                      </div>
                      <div className="mt-1 text-[9px] text-muted">
                        IRR {(r.irr * 100).toFixed(1)} %
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[10px] text-muted">{t("stressNote")}</p>
            </div>

            {/* Sensibilité cap rate × taux actualisation */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm p-5">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <h3 className="text-base font-semibold text-navy">{t("sensitivityTitle")}</h3>
                  <p className="mt-0.5 text-xs text-muted">{t("sensitivitySubtitle")}</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr>
                      <th className="px-2 py-1.5 text-left text-muted font-semibold">
                        {t("capRate")} \ {t("discountRate")}
                      </th>
                      {[-2, -1, 0, 1, 2].map((d) => {
                        const dr = tauxActu + d;
                        return (
                          <th key={d} className={`px-2 py-1.5 text-right text-xs font-mono ${d === 0 ? "text-navy font-bold" : "text-muted"}`}>
                            {dr.toFixed(1)}%
                          </th>
                        );
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {[-2, -1, 0, 1, 2].map((c) => {
                      const capR = tauxCapSortie + c;
                      return (
                        <tr key={c} className="border-t border-card-border/50">
                          <td className={`px-2 py-1.5 text-xs font-mono ${c === 0 ? "text-navy font-bold" : "text-muted"}`}>
                            {capR.toFixed(1)}%
                          </td>
                          {[-2, -1, 0, 1, 2].map((d) => {
                            const drLocal = tauxActu + d;
                            const res = calculerDCFLeases({
                              leases,
                              periodeAnalyse,
                              tauxActualisation: drLocal,
                              tauxCapSortie: capR,
                              fraisCessionPct: fraisCession,
                              chargesProprietaireFixe: chargesProprio,
                              vacanceERV,
                              dateValeur,
                            });
                            const delta = res.valeurDCF - result.valeurDCF;
                            const pct = result.valeurDCF > 0 ? (delta / result.valeurDCF) * 100 : 0;
                            const isCurrent = c === 0 && d === 0;
                            const bg =
                              isCurrent ? "bg-navy text-white font-bold" :
                              pct >= 10 ? "bg-emerald-100 text-emerald-900" :
                              pct >= 3 ? "bg-emerald-50 text-emerald-800" :
                              pct <= -10 ? "bg-rose-100 text-rose-900" :
                              pct <= -3 ? "bg-rose-50 text-rose-800" :
                              "bg-slate-50 text-slate-700";
                            return (
                              <td key={d} className={`px-2 py-1.5 text-right font-mono tabular-nums ${bg}`}>
                                <div>{formatEUR(res.valeurDCF)}</div>
                                {!isCurrent && (
                                  <div className="text-[9px] opacity-70">
                                    {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-[10px] text-muted">
                {t("sensitivityNote")}
              </p>
            </div>

            {/* Waterfall equity / debt / promote */}
            {montantDette > 0 && (
              <div className="rounded-xl border border-card-border bg-card shadow-sm p-5">
                <h3 className="text-base font-semibold text-navy">{t("waterfallTitle")}</h3>
                <p className="mt-0.5 text-xs text-muted mb-4">{t("waterfallSubtitle")}</p>
                {(() => {
                  // Équité standard :
                  // 1) Return of capital (LPs récupèrent 100 % apport)
                  // 2) Preferred return 8% (cumulé, non-composé)
                  // 3) Catch-up (GP reçoit 20 % équivalent)
                  // 4) Split 80/20 au-delà
                  const equityInitial = result.valeurDCF - montantDette;
                  const serviceDette = montantDette * (tauxDette / 100);
                  const preferredRate = 0.08;
                  // Cashflow equity = NOI - service dette - CAPEX
                  const equityCFs: number[] = [-equityInitial];
                  let cumulEquity = 0;
                  for (let i = 0; i < result.cashFlows.length; i++) {
                    const cf = result.cashFlows[i].noi - serviceDette - capexAnnuel;
                    if (i === result.cashFlows.length - 1) {
                      equityCFs.push(cf + (result.valeurTerminaleNette - montantDette));
                    } else {
                      equityCFs.push(cf);
                    }
                    cumulEquity += cf;
                  }
                  const terminalEquity = result.valeurTerminaleNette - montantDette;
                  const totalDistribution = cumulEquity + terminalEquity;
                  // Preferred return cumul
                  const preferredAccrued = equityInitial * preferredRate * periodeAnalyse;
                  const returnOfCapital = Math.min(equityInitial, totalDistribution);
                  const remaining1 = Math.max(0, totalDistribution - returnOfCapital);
                  const preferredPaid = Math.min(preferredAccrued, remaining1);
                  const remaining2 = Math.max(0, remaining1 - preferredPaid);
                  // 80/20 split au-delà
                  const lpShare = remaining2 * 0.80;
                  const gpPromote = remaining2 * 0.20;
                  const totalLP = returnOfCapital + preferredPaid + lpShare;
                  const lpMoM = equityInitial > 0 ? totalLP / equityInitial : 0;
                  const lpIrrFlows = [-equityInitial, ...equityCFs.slice(1)];
                  const lpIRR = calculerIRR(lpIrrFlows.slice(0, -1).concat([lpIrrFlows[lpIrrFlows.length - 1]]));

                  return (
                    <div className="space-y-3">
                      {/* Résumé */}
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-lg bg-navy/5 border border-navy/20 p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted">{t("waterfallEquityInit")}</div>
                          <div className="mt-1 text-sm font-mono font-bold text-navy">{formatEUR(equityInitial)}</div>
                        </div>
                        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted">{t("waterfallLpTotal")}</div>
                          <div className="mt-1 text-sm font-mono font-bold text-emerald-900">{formatEUR(totalLP)}</div>
                          <div className="text-[10px] text-emerald-700">MoM {lpMoM.toFixed(2)}x</div>
                        </div>
                        <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted">{t("waterfallGpPromote")}</div>
                          <div className="mt-1 text-sm font-mono font-bold text-amber-900">{formatEUR(gpPromote)}</div>
                          <div className="text-[10px] text-amber-700">20 % upside</div>
                        </div>
                        <div className="rounded-lg bg-background border border-card-border p-3 text-center">
                          <div className="text-[10px] uppercase tracking-wider text-muted">{t("waterfallLpIrr")}</div>
                          <div className="mt-1 text-sm font-mono font-bold text-navy">{(lpIRR * 100).toFixed(2)} %</div>
                          <div className="text-[10px] text-muted">{t("waterfallVsHurdle")} {preferredRate * 100} %</div>
                        </div>
                      </div>

                      {/* Waterfall tiers */}
                      <div className="rounded-lg border border-card-border overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-card-border bg-background">
                              <th className="px-3 py-2 text-left font-semibold text-slate">{t("waterfallTier")}</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate">{t("waterfallLp")}</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate">{t("waterfallGp")}</th>
                              <th className="px-3 py-2 text-right font-semibold text-slate">{t("waterfallTotal")}</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b border-card-border/40">
                              <td className="px-3 py-2">
                                <div className="font-semibold">1. {t("waterfallRoc")}</div>
                                <div className="text-[10px] text-muted">{t("waterfallRocDesc")}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{formatEUR(returnOfCapital)}</td>
                              <td className="px-3 py-2 text-right font-mono">—</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(returnOfCapital)}</td>
                            </tr>
                            <tr className="border-b border-card-border/40">
                              <td className="px-3 py-2">
                                <div className="font-semibold">2. {t("waterfallPref")}</div>
                                <div className="text-[10px] text-muted">{t("waterfallPrefDesc", { rate: preferredRate * 100, years: periodeAnalyse })}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{formatEUR(preferredPaid)}</td>
                              <td className="px-3 py-2 text-right font-mono">—</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(preferredPaid)}</td>
                            </tr>
                            <tr className="border-b border-card-border/40">
                              <td className="px-3 py-2">
                                <div className="font-semibold">3. {t("waterfallSplit")}</div>
                                <div className="text-[10px] text-muted">{t("waterfallSplitDesc")}</div>
                              </td>
                              <td className="px-3 py-2 text-right font-mono">{formatEUR(lpShare)}</td>
                              <td className="px-3 py-2 text-right font-mono text-amber-700">{formatEUR(gpPromote)}</td>
                              <td className="px-3 py-2 text-right font-mono font-semibold">{formatEUR(remaining2)}</td>
                            </tr>
                            <tr className="border-t-2 border-navy bg-navy/5 font-semibold">
                              <td className="px-3 py-2">{t("waterfallTotalRow")}</td>
                              <td className="px-3 py-2 text-right font-mono text-emerald-700">{formatEUR(totalLP)}</td>
                              <td className="px-3 py-2 text-right font-mono text-amber-700">{formatEUR(gpPromote)}</td>
                              <td className="px-3 py-2 text-right font-mono text-navy">{formatEUR(totalLP + gpPromote)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-[10px] text-muted">{t("waterfallNote")}</p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Cap rate analysis : ligne valeur DCF par taux de sortie 4%-7% */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm p-5">
              <h3 className="text-base font-semibold text-navy">{t("capRateChartTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted mb-4">{t("capRateChartSubtitle")}</p>
              {(() => {
                const steps: number[] = [];
                for (let r = 4; r <= 7.5; r += 0.25) steps.push(r);
                const data = steps.map((capR) => {
                  const res = calculerDCFLeases({
                    leases,
                    periodeAnalyse,
                    tauxActualisation: tauxActu,
                    tauxCapSortie: capR,
                    fraisCessionPct: fraisCession,
                    chargesProprietaireFixe: chargesProprio,
                    vacanceERV,
                    dateValeur,
                  });
                  return {
                    capRate: capR,
                    valeur: Math.round(res.valeurDCF),
                  };
                });
                const currentValue = Math.round(result.valeurDCF);
                return (
                  <ResponsiveContainer width="100%" height={260}>
                    <ComposedChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                      <XAxis
                        dataKey="capRate"
                        tick={{ fontSize: 10 }}
                        tickFormatter={(v: number) => `${v.toFixed(1)} %`}
                        label={{ value: t("capRateLabel"), position: "insideBottom", offset: -5, fontSize: 10 }}
                      />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1_000_000).toFixed(1)} M€`} />
                      <RechartsTooltip
                        formatter={(v: unknown) => (typeof v === "number" ? formatEUR(v) : "—")}
                        labelFormatter={(label: unknown) => typeof label === "number" ? `Cap rate ${label.toFixed(2)} %` : ""}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Line type="monotone" dataKey="valeur" stroke="#1e3a5f" strokeWidth={2.5} dot={{ r: 3 }} name={t("capRateValue")} />
                      <Line
                        type="monotone"
                        dataKey={() => currentValue}
                        stroke="#b8860b"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        dot={false}
                        name={t("capRateCurrent", { rate: tauxCapSortie.toFixed(2) })}
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              })()}
              <p className="mt-3 text-[10px] text-muted">{t("capRateChartNote")}</p>
            </div>

            {/* Cash flows annuels */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-card-border bg-background">
                    <th className="px-2 py-2 text-left font-semibold text-navy">{t("thAnnee")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thLoyers")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thFranchises")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thVacance")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thCharges")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thRevenuNet")}</th>
                    <th className="px-2 py-2 text-right font-semibold text-navy">{t("thActualise")}</th>
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

            {/* Courbe de liquidité : NOI annuel + cashflow equity cumulé */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm p-5">
              <h3 className="text-base font-semibold text-navy">{t("liquidityTitle")}</h3>
              <p className="mt-0.5 text-xs text-muted mb-4">{t("liquiditySubtitle")}</p>
              {(() => {
                const serviceDette = montantDette > 0 ? montantDette * (tauxDette / 100) : 0;
                let cumulEquity = 0;
                const chartData = result.cashFlows.map((cf) => {
                  const distribuable = cf.noi - serviceDette - capexAnnuel;
                  cumulEquity += distribuable;
                  return {
                    annee: `A${cf.annee}`,
                    noi: Math.round(cf.noi),
                    distribuable: Math.round(distribuable),
                    cumul: Math.round(cumulEquity),
                    debtService: serviceDette > 0 ? Math.round(serviceDette) : undefined,
                  };
                });
                return (
                  <ResponsiveContainer width="100%" height={280}>
                    <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
                      <XAxis dataKey="annee" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                      <RechartsTooltip
                        formatter={(v: unknown) => (typeof v === "number" ? formatEUR(v) : "—")}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="noi" fill="#64748b" name={t("liquidityNoi")} barSize={24} />
                      <Bar dataKey="distribuable" fill="#0ea5e9" name={t("liquidityDistribuable")} barSize={24} />
                      <Line type="monotone" dataKey="cumul" stroke="#059669" strokeWidth={2.5} dot={{ r: 3 }} name={t("liquidityCumul")} />
                    </ComposedChart>
                  </ResponsiveContainer>
                );
              })()}
              <p className="mt-3 text-[10px] text-muted">{t("liquidityNote")}</p>
            </div>

            {/* Vue mensuelle lease-by-lease — année 1 */}
            <div className="rounded-xl border border-card-border bg-card shadow-sm">
              <div className="px-5 py-4 border-b border-card-border">
                <h3 className="text-base font-semibold text-navy">{t("monthlyLeaseTitle")}</h3>
                <p className="mt-0.5 text-xs text-muted">{t("monthlyLeaseSubtitle")}</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-card-border bg-background">
                      <th className="sticky left-0 bg-background px-2 py-2 text-left font-semibold text-navy">{t("locataire")}</th>
                      {Array.from({ length: 12 }, (_, i) => {
                        const [y, m] = dateValeur.split("-").map(Number);
                        const totalMonths = y * 12 + (m - 1) + i;
                        const ym = `${Math.floor(totalMonths / 12)}-${String((totalMonths % 12) + 1).padStart(2, "0")}`;
                        return (
                          <th key={i} className="px-2 py-2 text-right font-semibold text-navy whitespace-nowrap">{ym}</th>
                        );
                      })}
                      <th className="px-2 py-2 text-right font-semibold text-navy border-l border-card-border">{t("monthlyLeaseTotal")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leases.map((lease) => {
                      let total = 0;
                      const cells = Array.from({ length: 12 }, (_, i) => {
                        const [y, m] = dateValeur.split("-").map(Number);
                        const totalMonths = y * 12 + (m - 1) + i;
                        const ym = `${Math.floor(totalMonths / 12)}-${String((totalMonths % 12) + 1).padStart(2, "0")}`;
                        const bailActif = lease.dateFin >= ym && lease.dateDebut <= ym;
                        const monthsSinceStart = Math.max(0, (y * 12 + m - 1) - ((() => {
                          const [ly, lm] = lease.dateDebut.split("-").map(Number);
                          return ly * 12 + lm - 1;
                        })()));
                        const anneesDepuisDebut = monthsSinceStart / 12;
                        const loyerIndexe = bailActif
                          ? (lease.loyerAnnuel / 12) * Math.pow(1 + lease.indexation / 100, anneesDepuisDebut)
                          : 0;
                        // Appliquer la franchise : mois couverts par la franchise = premiers N mois du bail
                        const moisFranchise = lease.franchiseMois;
                        const monthIndexInLease = monthsSinceStart + 1;
                        const enFranchise = bailActif && monthIndexInLease <= moisFranchise;
                        const loyerEffectif = enFranchise ? 0 : loyerIndexe;
                        total += loyerEffectif;
                        return { loyer: loyerEffectif, franchise: enFranchise, active: bailActif };
                      });
                      return (
                        <tr key={lease.id} className="border-b border-card-border/40 hover:bg-background/50">
                          <td className="sticky left-0 bg-card px-2 py-1.5 font-medium whitespace-nowrap">{lease.locataire || "—"}</td>
                          {cells.map((c, i) => (
                            <td key={i} className={`px-2 py-1.5 text-right font-mono tabular-nums ${
                              !c.active ? "text-muted/40" : c.franchise ? "text-amber-700 italic" : ""
                            }`}>
                              {c.active ? (c.franchise ? t("monthlyLeaseFranchise") : Math.round(c.loyer).toLocaleString("fr-LU")) : "—"}
                            </td>
                          ))}
                          <td className="px-2 py-1.5 text-right font-mono font-semibold border-l border-card-border">
                            {Math.round(total).toLocaleString("fr-LU")}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="border-t-2 border-navy bg-navy/5 font-semibold">
                      <td className="sticky left-0 bg-navy/5 px-2 py-2">{t("monthlyLeaseTotal")}</td>
                      {Array.from({ length: 12 }, (_, i) => {
                        const [y, m] = dateValeur.split("-").map(Number);
                        const totalMonthsBase = y * 12 + (m - 1) + i;
                        const ym = `${Math.floor(totalMonthsBase / 12)}-${String((totalMonthsBase % 12) + 1).padStart(2, "0")}`;
                        let monthTotal = 0;
                        for (const lease of leases) {
                          const bailActif = lease.dateFin >= ym && lease.dateDebut <= ym;
                          if (!bailActif) continue;
                          const [ly, lm] = lease.dateDebut.split("-").map(Number);
                          const leaseStart = ly * 12 + lm - 1;
                          const monthsSinceStart = Math.max(0, (y * 12 + m - 1 + i) - leaseStart);
                          const monthIndexInLease = monthsSinceStart + 1;
                          if (monthIndexInLease <= lease.franchiseMois) continue;
                          monthTotal += (lease.loyerAnnuel / 12) * Math.pow(1 + lease.indexation / 100, monthsSinceStart / 12);
                        }
                        return (
                          <td key={i} className="px-2 py-2 text-right font-mono tabular-nums">
                            {Math.round(monthTotal).toLocaleString("fr-LU")}
                          </td>
                        );
                      })}
                      <td className="px-2 py-2 text-right font-mono border-l border-card-border">
                        {Math.round(leases.reduce((s, l) => {
                          let rowTotal = 0;
                          for (let i = 0; i < 12; i++) {
                            const [y, m] = dateValeur.split("-").map(Number);
                            const totalMonthsBase = y * 12 + (m - 1) + i;
                            const ym = `${Math.floor(totalMonthsBase / 12)}-${String((totalMonthsBase % 12) + 1).padStart(2, "0")}`;
                            if (!(l.dateFin >= ym && l.dateDebut <= ym)) continue;
                            const [ly, lm] = l.dateDebut.split("-").map(Number);
                            const leaseStart = ly * 12 + lm - 1;
                            const monthsSinceStart = Math.max(0, (y * 12 + m - 1 + i) - leaseStart);
                            if (monthsSinceStart + 1 <= l.franchiseMois) continue;
                            rowTotal += (l.loyerAnnuel / 12) * Math.pow(1 + l.indexation / 100, monthsSinceStart / 12);
                          }
                          return s + rowTotal;
                        }, 0)).toLocaleString("fr-LU")}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="px-5 py-3 text-[10px] text-muted">{t("monthlyLeaseNote")}</p>
            </div>
          </div>
        </div>
      </div>

      <SEOContent
        ns="dcfMulti"
        sections={[
          { titleKey: "analyseTitle", contentKey: "analyseContent" },
          { titleKey: "bailParBailTitle", contentKey: "bailParBailContent" },
          { titleKey: "tauxTitle", contentKey: "tauxContent" },
          { titleKey: "irrTitle", contentKey: "irrContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
        ]}
        relatedLinks={[
          { href: "/valorisation", labelKey: "valorisation" },
          { href: "/outils-bancaires", labelKey: "bancaire" },
        ]}
      />
    </div>
  );
}
