"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { fetchECBRatesClient, type ECBRates } from "@/lib/ecb-rates";
import { OAT_10Y, TAUX_HYPOTHECAIRE, TAUX_DIRECTEUR_BCE, INFLATION } from "@/lib/macro-data";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer,
} from "recharts";
import SEOContent from "@/components/SEOContent";
import RelatedTools from "@/components/RelatedTools";
import InputField from "@/components/InputField";
import ResultPanel from "@/components/ResultPanel";
import {
  calculerLTV,
  calculerMensualite,
  calculerCapaciteEmprunt,
  genererTableauAmortissement,
  calculerDSCR,
  simulerRemboursementAnticipe,
  formatEUR,
  formatEUR2,
  formatPct,
} from "@/lib/calculations";
import { generateBancairePdfBlob, PdfButton } from "@/components/ToolsPdf";
import {
  simulateMortgageWithEnergy,
  getAllEnergyLTVAdjustments,
  type MortgageEnergyResult,
} from "@/lib/energy-banking";

type ActiveTab = "ltv" | "capacite" | "amortissement" | "dscr" | "cpe" | "remboursement" | "comparateur";

/* ── Taux du marché luxembourgeois ─────────────────────────────── */
const TAUX_MARCHE_LU = {
  lastUpdate: "2026-04-01",
  source: "BCL / Switchr.lu — taux moyens observés",
  rates: [
    { label: "fixedLabel10y", duree: 10, min: 2.85, max: 3.15 },
    { label: "fixedLabel15y", duree: 15, min: 2.95, max: 3.25 },
    { label: "fixedLabel20y", duree: 20, min: 3.05, max: 3.40 },
    { label: "fixedLabel25y", duree: 25, min: 3.15, max: 3.55 },
    { label: "variableLabel", duree: 0, min: 2.75, max: 3.05 },
  ],
  bclRefi: 3.65,
  bclDeposit: 3.25,
};

function MarketRatesBox({ onSelectRate }: { onSelectRate?: (midpoint: number, duree: number) => void }) {
  const t = useTranslations("outilsBancaires");
  const [ecb, setEcb] = useState<ECBRates | null>(null);

  useEffect(() => {
    fetchECBRatesClient().then(setEcb);
  }, []);

  const bceRefi = ecb?.mainRefi ?? TAUX_MARCHE_LU.bclRefi;
  const bceDeposit = ecb?.depositFacility ?? TAUX_MARCHE_LU.bclDeposit;
  const bceDate = ecb?.lastUpdate ?? TAUX_MARCHE_LU.lastUpdate;
  const isLive = ecb?.live ?? false;

  return (
    <div className="mt-4 rounded-lg bg-navy/5 p-3">
      <div className="text-xs font-semibold text-navy mb-2">{t("tauxMarcheTitle")}</div>
      <div className="space-y-1">
        {TAUX_MARCHE_LU.rates.map((r) => {
          const mid = Math.round(((r.min + r.max) / 2) * 100) / 100;
          return (
            <button
              key={r.label}
              type="button"
              onClick={() => onSelectRate?.(mid, r.duree)}
              className="flex w-full items-center justify-between rounded px-2 py-1 text-xs hover:bg-navy/10 transition-colors cursor-pointer"
            >
              <span className="text-muted">{t(r.label)}</span>
              <span className="font-mono text-navy">{r.min.toFixed(2)} — {r.max.toFixed(2)} %</span>
            </button>
          );
        })}
      </div>
      <div className="mt-2 border-t border-navy/10 pt-2 text-[11px] text-muted space-y-0.5">
        <div className="flex justify-between">
          <span>{t("tauxDirecteurBCE")}</span>
          <span className="font-mono text-navy">{bceRefi.toFixed(2)} %</span>
        </div>
        <div className="flex justify-between">
          <span>{t("tauxDepotBCE")}</span>
          <span className="font-mono text-navy">{bceDeposit.toFixed(2)} %</span>
        </div>
        {isLive && (
          <div className="flex items-center gap-1 mt-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
            <span className="text-[10px] text-green-700">{t("tauxLive")}</span>
          </div>
        )}
      </div>
      <p className="mt-2 text-[10px] text-muted">{t("tauxMarcheSource")}</p>
      <p className="text-[10px] text-muted">{t("tauxMarcheDate", { date: bceDate })}</p>
      <p className="text-[10px] text-muted italic">{t("tauxNote")}</p>
      {onSelectRate && (
        <p className="mt-1 text-[10px] text-navy/60 font-medium">{t("tauxClickHint")}</p>
      )}
    </div>
  );
}

function TabLTV() {
  const t = useTranslations("outilsBancaires");
  const [valeurBien, setValeurBien] = useState(750000);
  const [montantPret, setMontantPret] = useState(600000);

  const ltv = calculerLTV({ valeurBien, montantPret });
  const ltvColor = ltv > 0.9 ? "text-error" : ltv > 0.8 ? "text-warning" : "text-success";
  const ltvLabel =
    ltv > 0.9 ? t("ltvHigh") : ltv > 0.8 ? t("ltvAcceptable") : t("ltvHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("ltvParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("propertyValue")} value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
            <InputField label={t("loanAmount")} value={montantPret} onChange={(v) => setMontantPret(Number(v))} suffix="€" />
          </div>
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("ltvRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${ltvColor}`}>
            {(ltv * 100).toFixed(1)} %
          </div>
          <div className={`mt-2 text-sm font-medium ${ltvColor}`}>{ltvLabel}</div>
          <div className="mt-4 text-xs text-muted">{t("deposit")} : {formatEUR(valeurBien - montantPret)} ({formatPct(1 - ltv)})</div>
        </div>
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("ltvThresholdsTitle")}</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-3">
              <span className="shrink-0 rounded-full bg-success px-2.5 py-0.5 text-xs font-bold text-white">≤ 80%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStandard")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStandardDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
              <span className="shrink-0 rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-white">≤ 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvFirstBuyer")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvFirstBuyerDesc")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-lg bg-red-50 border border-red-200 p-3">
              <span className="shrink-0 rounded-full bg-error px-2.5 py-0.5 text-xs font-bold text-white">&gt; 90%</span>
              <div>
                <div className="text-sm font-medium text-slate">{t("ltvStateGuarantee")}</div>
                <p className="text-xs text-muted mt-0.5">{t("ltvStateGuaranteeDesc")}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-3">{t("prudentValueTitle")}</h3>
          <p className="text-xs text-muted leading-relaxed mb-3">
            {t.rich("prudentValueIntro", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}
          </p>
          <div className="space-y-2 text-xs text-muted">
            <p>{t.rich("prudentValueMethod", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueLegal", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
            })}</p>
            <p>{t.rich("prudentValueCalculate", {
              strong: (chunks) => <strong className="text-slate">{chunks}</strong>,
              link: (chunks) => <a href="/valorisation" className="text-navy font-medium hover:underline">{chunks}</a>,
            })}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function TabCapacite() {
  const t = useTranslations("outilsBancaires");
  const [revenuNet, setRevenuNet] = useState(5000);
  const [charges, setCharges] = useState(500);
  const [tauxEndettement, setTauxEndettement] = useState(40);
  const [tauxInteret, setTauxInteret] = useState(3.5);
  const [duree, setDuree] = useState(25);
  const [tauxAssurance, setTauxAssurance] = useState(0.30); // % du capital

  const result = useMemo(
    () =>
      calculerCapaciteEmprunt({
        revenuNetMensuel: revenuNet,
        chargesMensuelles: charges,
        tauxEndettementMax: tauxEndettement / 100,
        tauxInteret: tauxInteret / 100,
        dureeAnnees: duree,
      }),
    [revenuNet, charges, tauxEndettement, tauxInteret, duree]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">{t("incomeAndCharges")}</h2>
        <div className="space-y-4">
          <InputField label={t("netMonthlyIncome")} value={revenuNet} onChange={(v) => setRevenuNet(Number(v))} suffix="€" />
          <InputField label={t("existingMonthlyCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("existingMonthlyChargesHint")} />
          <InputField label={t("maxDebtRatio")} value={tauxEndettement} onChange={(v) => setTauxEndettement(Number(v))} suffix="%" min={10} max={50} />
          <InputField label={t("interestRate")} value={tauxInteret} onChange={(v) => setTauxInteret(Number(v))} suffix="%" step={0.1} />
          <InputField label={t("loanDuration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          <InputField label={t("remainingBalanceInsurance")} value={tauxAssurance} onChange={(v) => setTauxAssurance(Number(v))} suffix={t("pctCapital")} step={0.05} hint={t("remainingBalanceInsuranceHint")} />
        </div>
        <MarketRatesBox
          onSelectRate={(mid, dureeRate) => {
            setTauxInteret(mid);
            if (dureeRate > 0) setDuree(dureeRate);
          }}
        />
      </div>
      <div className="space-y-6">
        <ResultPanel
          title={t("results")}
          lines={[
            { label: t("maxMonthlyPayment"), value: formatEUR2(result.mensualiteMax) },
            { label: t("ofWhichInsurance", { pct: tauxAssurance }), value: formatEUR2(result.capaciteEmprunt * tauxAssurance / 100 / 12), sub: true },
            { label: t("borrowingCapacity"), value: formatEUR(result.capaciteEmprunt), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("withDeposit")}
          lines={[
            { label: t("plusDeposit", { amount: "50 000" }), value: formatEUR(result.capaciteEmprunt + 50000), sub: true },
            { label: t("plusDeposit", { amount: "100 000" }), value: formatEUR(result.capaciteEmprunt + 100000), sub: true },
            { label: t("plusDeposit", { amount: "150 000" }), value: formatEUR(result.capaciteEmprunt + 150000), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

function TabAmortissement() {
  const t = useTranslations("outilsBancaires");
  const [capital, setCapital] = useState(600000);
  const [taux, setTaux] = useState(3.5);
  const [duree, setDuree] = useState(25);

  const mensualite = useMemo(() => calculerMensualite(capital, taux / 100, duree), [capital, taux, duree]);
  const tableau = useMemo(() => genererTableauAmortissement(capital, taux / 100, duree), [capital, taux, duree]);
  const totalInterets = useMemo(() => tableau.reduce((sum, l) => sum + l.interets, 0), [tableau]);

  // Show yearly summary
  const annuel = useMemo(() => {
    const years: { annee: number; capital: number; interets: number; restant: number }[] = [];
    for (let i = 0; i < tableau.length; i += 12) {
      const slice = tableau.slice(i, i + 12);
      years.push({
        annee: Math.floor(i / 12) + 1,
        capital: slice.reduce((s, l) => s + l.capital, 0),
        interets: slice.reduce((s, l) => s + l.interets, 0),
        restant: slice[slice.length - 1]?.capitalRestant || 0,
      });
    }
    return years;
  }, [tableau]);

  return (
    <div className="space-y-6">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("loanParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("borrowedCapital")} value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label={t("annualInterestRate")} value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label={t("duration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          </div>
          <MarketRatesBox
            onSelectRate={(mid, dureeRate) => {
              setTaux(mid);
              if (dureeRate > 0) setDuree(dureeRate);
            }}
          />
        </div>
        <ResultPanel
          title={t("summary")}
          lines={[
            { label: t("monthlyPayment"), value: formatEUR2(mensualite), highlight: true, large: true },
            { label: t("totalInterest"), value: formatEUR(totalInterets) },
            { label: t("totalCreditCost"), value: formatEUR(capital + totalInterets) },
            { label: t("interestCapitalRatio"), value: formatPct(totalInterets / capital), sub: true },
          ]}
        />
        <div className="flex justify-end">
          <PdfButton
            label="PDF"
            filename={`simulation-bancaire-${new Date().toLocaleDateString("fr-LU")}.pdf`}
            generateBlob={() => {
              const prixBien = Math.round(capital / 0.8);
              const apport = prixBien - capital;
              return generateBancairePdfBlob({
                prixBien,
                apport,
                montantCredit: capital,
                dureeAns: duree,
                tauxNominal: taux,
                mensualite,
                coutTotal: capital + totalInterets,
                coutInterets: totalInterets,
                ltv: 80,
                tauxEndettement: 0,
              });
            }}
          />
        </div>
      </div>

      {/* Tableau annuel */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">{t("year")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("capitalRepaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("interestPaid")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("remainingCapital")}</th>
            </tr>
          </thead>
          <tbody>
            {annuel.map((a) => (
              <tr key={a.annee} className="border-b border-card-border/50 hover:bg-background/50">
                <td className="px-4 py-2 font-medium">{a.annee}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.capital)}</td>
                <td className="px-4 py-2 text-right font-mono text-muted">{formatEUR(a.interets)}</td>
                <td className="px-4 py-2 text-right font-mono">{formatEUR(a.restant)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabDSCR() {
  const t = useTranslations("outilsBancaires");
  const [revenuLocatif, setRevenuLocatif] = useState(36000);
  const [charges, setCharges] = useState(6000);
  const [serviceDette, setServiceDette] = useState(24000);

  const dscr = calculerDSCR({
    revenuLocatifAnnuel: revenuLocatif,
    chargesAnnuelles: charges,
    serviceDetteAnnuel: serviceDette,
  });

  const dscrColor = dscr < 1.0 ? "text-error" : dscr < 1.2 ? "text-warning" : "text-success";
  const dscrLabel =
    dscr < 1.0 ? t("dscrInsufficient") : dscr < 1.2 ? t("dscrLimit") : t("dscrHealthy");

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">{t("dscrParams")}</h2>
        <div className="space-y-4">
          <InputField label={t("grossRentalIncome")} value={revenuLocatif} onChange={(v) => setRevenuLocatif(Number(v))} suffix="€" />
          <InputField label={t("annualOperatingCharges")} value={charges} onChange={(v) => setCharges(Number(v))} suffix="€" hint={t("annualOperatingChargesHint")} />
          <InputField label={t("annualDebtService")} value={serviceDette} onChange={(v) => setServiceDette(Number(v))} suffix="€" hint={t("annualDebtServiceHint")} />
        </div>
      </div>
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-8 shadow-sm text-center">
          <div className="text-sm text-muted">{t("dscrRatio")}</div>
          <div className={`mt-2 text-5xl font-bold ${dscrColor}`}>{dscr.toFixed(2)}</div>
          <div className={`mt-2 text-sm font-medium ${dscrColor}`}>{dscrLabel}</div>
        </div>
        <ResultPanel
          title={t("detail")}
          lines={[
            { label: t("grossRentalIncomeShort"), value: formatEUR(revenuLocatif) },
            { label: t("operatingCharges"), value: `- ${formatEUR(charges)}` },
            { label: t("noi"), value: formatEUR(revenuLocatif - charges), highlight: true },
            { label: t("debtService"), value: formatEUR(serviceDette) },
            { label: t("dscrFormula"), value: dscr.toFixed(2), highlight: true, large: true },
          ]}
        />
        <ResultPanel
          title={t("referenceThresholds")}
          lines={[
            { label: t("dscrBelow1"), value: t("dscrBelow1Desc"), sub: true, warning: true },
            { label: t("dscr1to1_2"), value: t("dscr1to1_2Desc"), sub: true },
            { label: t("dscrAbove1_2"), value: t("dscrAbove1_2Desc"), sub: true },
            { label: t("dscrAbove1_5"), value: t("dscrAbove1_5Desc"), sub: true },
          ]}
        />
      </div>
    </div>
  );
}

const CPE_CLASSES = ["A", "B", "C", "D", "E", "F", "G", "H", "I"] as const;
const CPE_CLASS_COLORS: Record<string, string> = {
  A: "bg-green-600 text-white", B: "bg-green-500 text-white", C: "bg-lime-500 text-white",
  D: "bg-yellow-400 text-gray-900", E: "bg-orange-400 text-white", F: "bg-orange-600 text-white",
  G: "bg-red-600 text-white", H: "bg-red-700 text-white", I: "bg-red-900 text-white",
};

function TabCPE() {
  const t = useTranslations("outilsBancaires");
  const [valeurBien, setValeurBien] = useState(750000);
  const [classeEnergie, setClasseEnergie] = useState("D");
  const [tauxBase, setTauxBase] = useState(3.5);
  const [ltvMaxBase, setLtvMaxBase] = useState(80);
  const [duree, setDuree] = useState(25);

  const result: MortgageEnergyResult = useMemo(
    () => simulateMortgageWithEnergy({ valeurBien, classeEnergie, tauxBaseAnnuel: tauxBase, ltvMaxBase, dureeAnnees: duree }),
    [valeurBien, classeEnergie, tauxBase, ltvMaxBase, duree]
  );

  const allAdj = useMemo(() => getAllEnergyLTVAdjustments(), []);

  return (
    <div className="space-y-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h2 className="mb-4 text-base font-semibold text-navy">{t("cpeParams")}</h2>
            <div className="space-y-4">
              <InputField label={t("propertyValue")} value={valeurBien} onChange={(v) => setValeurBien(Number(v))} suffix="€" />
              <div>
                <label className="block text-sm font-medium text-slate mb-1.5">{t("cpeClasseEnergie")}</label>
                <div className="flex gap-1.5">
                  {CPE_CLASSES.map((c) => (
                    <button key={c} onClick={() => setClasseEnergie(c)}
                      className={`flex-1 rounded-lg py-2 text-sm font-bold transition-all ${
                        classeEnergie === c ? `${CPE_CLASS_COLORS[c]} ring-2 ring-offset-2 ring-navy` : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}>{c}</button>
                  ))}
                </div>
              </div>
              <InputField label={t("cpeBaseRate")} value={tauxBase} onChange={(v) => setTauxBase(Number(v))} suffix="%" step={0.1} />
              <InputField label={t("cpeLtvMaxBase")} value={ltvMaxBase} onChange={(v) => setLtvMaxBase(Number(v))} suffix="%" min={50} max={100} />
              <InputField label={t("loanDuration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
            </div>
            <MarketRatesBox
              onSelectRate={(mid, dureeRate) => {
                setTauxBase(mid);
                if (dureeRate > 0) setDuree(dureeRate);
              }}
            />
          </div>
        </div>

        <div className="space-y-6">
          {/* Résultat principal */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-navy">{t("cpeResultTitle")}</h3>
              <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold ${CPE_CLASS_COLORS[classeEnergie]}`}>{classeEnergie}</span>
            </div>
            <div className="divide-y divide-card-border/50">
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate">{t("cpeAdjustedRate")}</span>
                <span className="font-mono font-semibold text-foreground">{result.tauxAjuste.toFixed(2)} %</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted pl-4">{t("cpeRateDelta")}</span>
                <span className={`font-mono text-sm ${result.adjustment.rateAdjustmentBps < 0 ? "text-green-600" : result.adjustment.rateAdjustmentBps > 0 ? "text-red-600" : "text-muted"}`}>
                  {result.adjustment.rateAdjustmentBps > 0 ? "+" : ""}{result.adjustment.rateAdjustmentBps} bps
                </span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-slate">{t("cpeAdjustedLtv")}</span>
                <span className="font-mono font-semibold text-foreground">{result.ltvMaxAjuste.toFixed(1)} %</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted pl-4">{t("cpeLtvDelta")}</span>
                <span className={`font-mono text-sm ${result.adjustment.ltvAdjustmentBps > 0 ? "text-green-600" : result.adjustment.ltvAdjustmentBps < 0 ? "text-red-600" : "text-muted"}`}>
                  {result.adjustment.ltvAdjustmentBps > 0 ? "+" : ""}{result.adjustment.ltvAdjustmentBps} bps
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-t-2 border-gold pt-3 text-lg">
                <span className="font-semibold text-slate">{t("cpeBorrowingCapacity")}</span>
                <span className="font-mono font-semibold text-navy text-xl">{formatEUR(result.montantMaxAjuste)}</span>
              </div>
              <div className="flex items-center justify-between py-2 text-sm">
                <span className="text-muted pl-4">{t("cpeCapacityDelta")}</span>
                <span className={`font-mono font-semibold ${result.differenceCapacite > 0 ? "text-green-600" : result.differenceCapacite < 0 ? "text-red-600" : "text-muted"}`}>
                  {result.differenceCapacite > 0 ? "+" : ""}{formatEUR(result.differenceCapacite)}
                </span>
              </div>
            </div>
          </div>

          {/* Mensualités */}
          <ResultPanel
            title={t("cpeMonthlyTitle")}
            lines={[
              { label: t("cpeMonthlyBase"), value: formatEUR2(result.mensualiteBase) },
              { label: t("cpeMonthlyAdjusted"), value: formatEUR2(result.mensualiteAjustee), highlight: true },
              { label: t("cpeMonthlyDelta"), value: `${result.differenceMensuelle > 0 ? "+" : ""}${formatEUR2(result.differenceMensuelle)}`, sub: true },
              { label: t("cpeTotalCostDelta"), value: `${result.differenceCoutTotal > 0 ? "+" : ""}${formatEUR(result.differenceCoutTotal)}`, sub: true },
            ]}
          />

          {/* Rationale */}
          <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
            <h3 className="text-base font-semibold text-navy mb-2">{t("cpeRationale")}</h3>
            <p className="text-sm text-muted leading-relaxed">{result.adjustment.rationale}</p>
          </div>
        </div>
      </div>

      {/* Tableau récapitulatif toutes classes */}
      <div className="rounded-xl border border-card-border bg-card shadow-sm overflow-x-auto">
        <div className="px-6 py-4 border-b border-card-border">
          <h3 className="text-base font-semibold text-navy">{t("cpeAllClassesTitle")}</h3>
          <p className="text-xs text-muted mt-1">{t("cpeAllClassesDesc")}</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-card-border bg-background">
              <th className="px-4 py-3 text-left font-semibold text-navy">{t("cpeColClasse")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("cpeColLtv")}</th>
              <th className="px-4 py-3 text-right font-semibold text-navy">{t("cpeColRate")}</th>
              <th className="px-4 py-3 text-left font-semibold text-navy">{t("cpeColRationale")}</th>
            </tr>
          </thead>
          <tbody>
            {allAdj.map((adj) => {
              const isActive = adj.classe === classeEnergie;
              return (
                <tr key={adj.classe} className={`border-b border-card-border/50 ${isActive ? "bg-navy/5" : "hover:bg-background/50"}`}>
                  <td className="px-4 py-2">
                    <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${CPE_CLASS_COLORS[adj.classe]}`}>{adj.classe}</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    <span className={adj.ltvAdjustmentBps > 0 ? "text-green-600" : adj.ltvAdjustmentBps < 0 ? "text-red-600" : "text-muted"}>
                      {adj.ltvAdjustmentBps > 0 ? "+" : ""}{adj.ltvAdjustmentBps} bps
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    <span className={adj.rateAdjustmentBps < 0 ? "text-green-600" : adj.rateAdjustmentBps > 0 ? "text-red-600" : "text-muted"}>
                      {adj.rateAdjustmentBps > 0 ? "+" : ""}{adj.rateAdjustmentBps} bps
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-muted max-w-xs">{adj.rationale}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="px-6 py-3 bg-gray-50 text-[11px] text-muted">
          {t("cpeDisclaimer")}
        </div>
      </div>
    </div>
  );
}

interface OffreBancaire {
  nom: string;
  taux: number;
  duree: number;
  assuranceSRD: number; // % capital
  fraisDossier: number; // € forfait
}

function TabComparateur() {
  const t = useTranslations("outilsBancaires");
  const [capital, setCapital] = useState(600000);
  const [offres, setOffres] = useState<OffreBancaire[]>([
    { nom: "Spuerkeess", taux: 3.10, duree: 25, assuranceSRD: 0.30, fraisDossier: 1500 },
    { nom: "BIL", taux: 3.25, duree: 25, assuranceSRD: 0.28, fraisDossier: 1200 },
    { nom: "BGL BNP", taux: 3.20, duree: 25, assuranceSRD: 0.32, fraisDossier: 1800 },
  ]);

  const updateOffre = (index: number, field: keyof OffreBancaire, value: string | number) => {
    setOffres((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: typeof next[index][field] === "number" ? Number(value) : value };
      return next;
    });
  };

  const resultats = useMemo(() => {
    return offres.map((o) => {
      const mensualite = calculerMensualite(capital, o.taux / 100, o.duree);
      const assuranceMensuelle = capital * (o.assuranceSRD / 100) / 12;
      const mensualiteTotal = mensualite + assuranceMensuelle;
      const totalInterets = mensualite * o.duree * 12 - capital;
      const totalAssurance = assuranceMensuelle * o.duree * 12;
      const coutTotal = capital + totalInterets + totalAssurance + o.fraisDossier;
      const tauxEffectifGlobal = totalInterets / capital * 100 / o.duree;
      return { ...o, mensualite, assuranceMensuelle, mensualiteTotal, totalInterets, totalAssurance, coutTotal, tauxEffectifGlobal };
    });
  }, [offres, capital]);

  // Find best offer (lowest total cost)
  const bestIdx = resultats.reduce((bestI, r, i, arr) => (r.coutTotal < arr[bestI].coutTotal ? i : bestI), 0);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-navy">Capital à emprunter</h2>
        <InputField label="Montant du prêt" value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {offres.map((o, i) => (
          <div key={i} className={`rounded-xl border p-5 ${i === bestIdx ? "border-emerald-400 bg-emerald-50" : "border-card-border bg-card"}`}>
            <div className="flex items-center justify-between mb-3">
              <input
                type="text"
                value={o.nom}
                onChange={(e) => updateOffre(i, "nom", e.target.value)}
                className="flex-1 rounded-lg border border-input-border bg-input-bg px-2 py-1 text-sm font-semibold text-navy"
              />
              {i === bestIdx && (
                <span className="ml-2 shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  MEILLEURE
                </span>
              )}
            </div>
            <div className="space-y-2">
              <InputField label="Taux annuel" value={o.taux} onChange={(v) => updateOffre(i, "taux", v)} suffix="%" step={0.05} />
              <InputField label="Durée" value={o.duree} onChange={(v) => updateOffre(i, "duree", v)} suffix="ans" min={5} max={35} />
              <InputField label="Assurance SRD" value={o.assuranceSRD} onChange={(v) => updateOffre(i, "assuranceSRD", v)} suffix="% capital" step={0.05} />
              <InputField label="Frais de dossier" value={o.fraisDossier} onChange={(v) => updateOffre(i, "fraisDossier", v)} suffix="€" />
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="rounded-xl border border-card-border bg-card overflow-hidden">
        <div className="p-5 pb-3">
          <h3 className="text-base font-semibold text-navy">Comparaison détaillée</h3>
          <p className="mt-0.5 text-xs text-muted">Offre la moins chère mise en évidence. Basé sur coût total toutes charges comprises.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-card-border bg-background">
                <th className="px-3 py-2 text-left font-semibold text-navy">Indicateur</th>
                {resultats.map((r, i) => (
                  <th key={i} className={`px-3 py-2 text-right font-semibold ${i === bestIdx ? "text-emerald-800" : "text-navy"}`}>
                    {r.nom}
                    {i === bestIdx && <span className="ml-1 text-[9px]">✓</span>}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-card-border/40">
                <td className="px-3 py-2 text-muted">Mensualité crédit</td>
                {resultats.map((r, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono">{formatEUR2(r.mensualite)}</td>
                ))}
              </tr>
              <tr className="border-b border-card-border/40">
                <td className="px-3 py-2 text-muted">Assurance SRD</td>
                {resultats.map((r, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono">{formatEUR2(r.assuranceMensuelle)}</td>
                ))}
              </tr>
              <tr className="border-b border-card-border/40 bg-background/50">
                <td className="px-3 py-2 font-semibold">Mensualité TOTALE</td>
                {resultats.map((r, i) => (
                  <td key={i} className={`px-3 py-2 text-right font-mono font-semibold ${i === bestIdx ? "text-emerald-700" : "text-navy"}`}>
                    {formatEUR2(r.mensualiteTotal)}
                  </td>
                ))}
              </tr>
              <tr className="border-b border-card-border/40">
                <td className="px-3 py-2 text-muted">Total intérêts</td>
                {resultats.map((r, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-muted">{formatEUR(r.totalInterets)}</td>
                ))}
              </tr>
              <tr className="border-b border-card-border/40">
                <td className="px-3 py-2 text-muted">Total assurance</td>
                {resultats.map((r, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-muted">{formatEUR(r.totalAssurance)}</td>
                ))}
              </tr>
              <tr className="border-b border-card-border/40">
                <td className="px-3 py-2 text-muted">Frais de dossier</td>
                {resultats.map((r, i) => (
                  <td key={i} className="px-3 py-2 text-right font-mono text-muted">{formatEUR(r.fraisDossier)}</td>
                ))}
              </tr>
              <tr className="border-t-2 border-navy bg-navy/5">
                <td className="px-3 py-3 font-semibold text-navy">COÛT TOTAL CRÉDIT</td>
                {resultats.map((r, i) => {
                  const diff = r.coutTotal - resultats[bestIdx].coutTotal;
                  return (
                    <td key={i} className={`px-3 py-3 text-right font-mono font-bold ${i === bestIdx ? "text-emerald-800" : "text-navy"}`}>
                      {formatEUR(r.coutTotal)}
                      {i !== bestIdx && diff > 0 && (
                        <div className="text-[9px] font-normal text-rose-700">+{formatEUR(diff)}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
        <strong>Méthodologie :</strong> le coût total inclut le capital remboursé, les intérêts, l&apos;assurance
        solde restant dû et les frais de dossier. Au Luxembourg, l&apos;assurance SRD est obligatoire. Les taux
        indicatifs sont ceux du marché LU T1 2026 (Spuerkeess/BIL/BGL). Négociez votre taux personnel selon
        votre profil (revenus, LTV, apport, relation bancaire).
      </div>
    </div>
  );
}

function TabRemboursement() {
  const t = useTranslations("outilsBancaires");
  const [capital, setCapital] = useState(600000);
  const [taux, setTaux] = useState(3.5);
  const [duree, setDuree] = useState(25);
  const [moisPrepaiement, setMoisPrepaiement] = useState(60);
  const [montantRembourse, setMontantRembourse] = useState(100000);
  const [penaliteMois, setPenaliteMois] = useState(6);
  const [strategie, setStrategie] = useState<"reduire_duree" | "reduire_mensualite">("reduire_duree");

  const res = useMemo(
    () =>
      simulerRemboursementAnticipe({
        capital,
        tauxAnnuel: taux / 100,
        dureeAnnees: duree,
        moisPrepaiement,
        montantRembourse,
        penaliteMoisInterets: penaliteMois,
        strategie,
      }),
    [capital, taux, duree, moisPrepaiement, montantRembourse, penaliteMois, strategie]
  );

  const gainColor = res.gainNet > 0 ? "text-success" : res.gainNet < 0 ? "text-error" : "text-muted";
  const anneesApres = Math.floor(res.nouvelleDureeMois / 12);
  const moisApres = res.nouvelleDureeMois % 12;

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-6">
        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("remboursLoanParams")}</h2>
          <div className="space-y-4">
            <InputField label={t("borrowedCapital")} value={capital} onChange={(v) => setCapital(Number(v))} suffix="€" />
            <InputField label={t("annualInterestRate")} value={taux} onChange={(v) => setTaux(Number(v))} suffix="%" step={0.1} />
            <InputField label={t("duration")} value={duree} onChange={(v) => setDuree(Number(v))} suffix={t("years")} min={5} max={35} />
          </div>
          <MarketRatesBox
            onSelectRate={(mid, dureeRate) => {
              setTaux(mid);
              if (dureeRate > 0) setDuree(dureeRate);
            }}
          />
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-base font-semibold text-navy">{t("remboursPrepayParams")}</h2>
          <div className="space-y-4">
            <InputField
              label={t("remboursMonth")}
              value={moisPrepaiement}
              onChange={(v) => setMoisPrepaiement(Number(v))}
              min={1}
              max={duree * 12}
              hint={t("remboursMonthHint", { max: duree * 12 })}
            />
            <InputField
              label={t("remboursAmount")}
              value={montantRembourse}
              onChange={(v) => setMontantRembourse(Number(v))}
              suffix="€"
              hint={t("remboursAmountHint")}
            />
            <InputField
              label={t("remboursPenalty")}
              value={penaliteMois}
              onChange={(v) => setPenaliteMois(Number(v))}
              suffix={t("remboursPenaltyUnit")}
              step={0.5}
              min={0}
              max={12}
              hint={t("remboursPenaltyHint")}
            />
            <div>
              <label className="block text-sm font-medium text-slate mb-1.5">{t("remboursStrategy")}</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setStrategie("reduire_duree")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    strategie === "reduire_duree"
                      ? "border-navy bg-navy text-white"
                      : "border-card-border bg-card text-slate hover:bg-background"
                  }`}
                >
                  {t("remboursReduceDuration")}
                </button>
                <button
                  type="button"
                  onClick={() => setStrategie("reduire_mensualite")}
                  className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                    strategie === "reduire_mensualite"
                      ? "border-navy bg-navy text-white"
                      : "border-card-border bg-card text-slate hover:bg-background"
                  }`}
                >
                  {t("remboursReduceMonthly")}
                </button>
              </div>
              <p className="mt-1.5 text-xs text-muted">{t("remboursStrategyHint")}</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-2">{t("remboursLegalTitle")}</h3>
          <p className="text-xs text-muted leading-relaxed">
            {t("remboursLegalBody")}
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className={`rounded-2xl bg-gradient-to-br ${res.gainNet > 0 ? "from-emerald-600 to-emerald-800" : res.gainNet < 0 ? "from-red-600 to-red-800" : "from-gray-500 to-gray-700"} p-8 text-center text-white shadow-lg`}>
          <div className="text-sm text-white/70">{t("remboursNetGain")}</div>
          <div className="mt-2 text-5xl font-bold">
            {res.gainNet > 0 ? "+" : ""}{formatEUR(res.gainNet)}
          </div>
          <div className="mt-2 text-xs text-white/70">
            {t("remboursNetGainDetail", {
              gain: formatEUR(res.gainInterets),
              penalty: formatEUR(res.penalite),
            })}
          </div>
        </div>

        <ResultPanel
          title={t("remboursResult")}
          lines={[
            { label: t("remboursInitialMonthly"), value: formatEUR2(res.mensualiteInitiale) },
            { label: t("remboursRemainingBefore"), value: formatEUR(res.capitalRestantAvant) },
            { label: t("remboursRemainingAfter"), value: formatEUR(res.capitalRestantApres), highlight: true },
            { label: t("remboursNewMonthly"), value: formatEUR2(res.nouvelleMensualite) },
            {
              label: t("remboursNewDuration"),
              value: anneesApres > 0
                ? t("remboursYearsMonths", { years: anneesApres, months: moisApres })
                : t("remboursMonthsOnly", { months: res.nouvelleDureeMois }),
              highlight: true,
            },
          ]}
        />

        <ResultPanel
          title={t("remboursComparison")}
          lines={[
            { label: t("remboursInterestWithout"), value: formatEUR(res.interetsRestantsAvant) },
            { label: t("remboursInterestWith"), value: formatEUR(res.interetsRestantsApres) },
            { label: t("remboursInterestSaved"), value: formatEUR(res.gainInterets), highlight: true },
            { label: t("remboursPenaltyPaid"), value: formatEUR(res.penalite) },
            { label: t("remboursNetGain"), value: formatEUR(res.gainNet), highlight: true, large: true },
          ]}
        />

        <div className="rounded-xl border border-card-border bg-card p-6 shadow-sm">
          <h3 className="text-base font-semibold text-navy mb-2">{t("remboursRecommendation")}</h3>
          <p className={`text-sm font-medium ${gainColor}`}>
            {res.gainNet > 0
              ? t("remboursRecoPositive", { amount: formatEUR(res.gainNet) })
              : res.gainNet < 0
                ? t("remboursRecoNegative", { amount: formatEUR(-res.gainNet) })
                : t("remboursRecoNeutral")}
          </p>
          {res.breakEvenMois !== null && res.penalite > 0 && (
            <p className="mt-2 text-xs text-muted">
              {t("remboursBreakEven", { months: res.breakEvenMois })}
            </p>
          )}
          {res.breakEvenMois === null && res.penalite > 0 && (
            <p className="mt-2 text-xs text-muted">{t("remboursBreakEvenNever")}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function RatesHistoryChart() {
  const t = useTranslations("outilsBancaires");
  // On garde les 8 dernières années pour garder le graphique lisible
  const currentYear = new Date().getFullYear();
  const minYear = currentYear - 7;
  const data: { year: number; bce: number | null; oat: number | null; hypo: number | null; inflation: number | null }[] = [];
  for (let y = minYear; y <= currentYear; y++) {
    const bce = TAUX_DIRECTEUR_BCE.find((d) => d.year === y)?.value ?? null;
    const oat = OAT_10Y.find((d) => d.year === y)?.value ?? null;
    const hypo = TAUX_HYPOTHECAIRE.find((d) => d.year === y)?.value ?? null;
    const inflation = INFLATION.find((d) => d.year === y)?.value ?? null;
    data.push({ year: y, bce, oat, hypo, inflation });
  }

  return (
    <div className="mt-8 rounded-xl border border-card-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
        <div>
          <h3 className="text-base font-semibold text-navy">{t("ratesHistoryTitle")}</h3>
          <p className="mt-0.5 text-[11px] text-muted">{t("ratesHistorySubtitle")}</p>
        </div>
        <span className="rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-[10px] text-emerald-800 font-semibold">
          {t("ratesHistoryPublicData")}
        </span>
      </div>
      <ResponsiveContainer width="100%" height={280}>
        <LineChart data={data} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e2db" />
          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} tickFormatter={(v: number) => `${v.toFixed(1)} %`} />
          <RechartsTooltip
            formatter={(v: unknown) => typeof v === "number" ? `${v.toFixed(2)} %` : "—"}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="bce" stroke="#1e3a5f" strokeWidth={2} dot={{ r: 2 }} name={t("rateBCE")} />
          <Line type="monotone" dataKey="oat" stroke="#b8860b" strokeWidth={2} dot={{ r: 2 }} name={t("rateOAT")} />
          <Line type="monotone" dataKey="hypo" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} name={t("rateHypo")} />
          <Line type="monotone" dataKey="inflation" stroke="#059669" strokeWidth={1.5} strokeDasharray="4 2" dot={{ r: 2 }} name={t("rateInflation")} />
        </LineChart>
      </ResponsiveContainer>
      <p className="mt-3 text-[10px] text-muted">{t("ratesHistoryNote")}</p>
    </div>
  );
}

export default function OutilsBancaires() {
  const t = useTranslations("outilsBancaires");
  const [activeTab, setActiveTab] = useState<ActiveTab>("ltv");

  const TABS: { id: ActiveTab; label: string }[] = [
    { id: "ltv", label: t("tabLtv") },
    { id: "capacite", label: t("tabCapacite") },
    { id: "amortissement", label: t("tabAmortissement") },
    { id: "dscr", label: t("tabDscr") },
    { id: "cpe", label: t("tabCpe") },
    { id: "remboursement", label: t("tabRemboursement") },
    { id: "comparateur", label: t("tabComparateur") },
  ];

  return (
    <div className="bg-background py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-2 text-muted">
            {t("subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 overflow-x-auto rounded-xl bg-card border border-card-border p-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? "bg-navy text-white shadow-sm"
                  : "text-muted hover:bg-background hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === "ltv" && <TabLTV />}
        {activeTab === "capacite" && <TabCapacite />}
        {activeTab === "amortissement" && <TabAmortissement />}
        {activeTab === "dscr" && <TabDSCR />}
        {activeTab === "cpe" && <TabCPE />}
        {activeTab === "remboursement" && <TabRemboursement />}
        {activeTab === "comparateur" && <TabComparateur />}

        {/* Historique taux BCE / OAT / hypothécaire */}
        <RatesHistoryChart />

        <RelatedTools keys={["achatLocation", "frais", "aides", "estimation"]} />
      </div>

      <SEOContent
        ns="outilsBancaires"
        sections={[
          { titleKey: "creditTitle", contentKey: "creditContent" },
          { titleKey: "ltvTitle", contentKey: "ltvContent" },
          { titleKey: "capaciteTitle", contentKey: "capaciteContent" },
          { titleKey: "amortissementTitle", contentKey: "amortissementContent" },
          { titleKey: "dscrTitle", contentKey: "dscrContent" },
        ]}
        faq={[
          { questionKey: "faq1Q", answerKey: "faq1A" },
          { questionKey: "faq2Q", answerKey: "faq2A" },
          { questionKey: "faq3Q", answerKey: "faq3A" },
          { questionKey: "faq4Q", answerKey: "faq4A" },
          { questionKey: "faq5Q", answerKey: "faq5A" },
        ]}
        relatedLinks={[
          { href: "/achat-vs-location", labelKey: "achatLocation" },
          { href: "/simulateur-aides", labelKey: "aides" },
          { href: "/frais-acquisition", labelKey: "frais" },
        ]}
      />
    </div>
  );
}
