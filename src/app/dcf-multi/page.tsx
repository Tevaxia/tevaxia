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
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-navy">{t("etatLocatif", { count: leases.length })}</h2>
              <button onClick={addLease} className="rounded-lg bg-navy px-3 py-1.5 text-xs font-medium text-white hover:bg-navy-light transition-colors">{t("ajouterBail")}</button>
            </div>

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
